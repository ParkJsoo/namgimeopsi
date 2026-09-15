import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

import * as dates from './dates.ts';
import * as ledger from './ledger.ts';
import * as syncQueue from './sync-queue.ts';
import * as receiptConfirmation from '../receipts/confirm-receipt.ts';
import { receiptReviewFixture } from '../receipts/fixture.ts';

// Exercise the actual hook's persistence ordering without native modules or a
// remote project. Hydration can run against a durable cache and remote snapshot.
const hookCode = ts.transpileModule(
  readFileSync(new URL('./use-inventory.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: false } },
).outputText;

function createHarness(options = {}) {
  const durable = options.durable ?? new Map();
  const remote = options.remote ?? { version: 2, items: [], events: [] };
  const controls = {
    failStorage: false,
    failStorageAt: null,
    storageAttempts: 0,
    attemptedWrites: [],
    failRemote: options.offline ?? false,
    remoteCalls: 0,
    cookingCalls: [],
  };
  const remoteWrite = async () => {
    controls.remoteCalls += 1;
    if (controls.failRemote) throw new Error('offline');
    return 'confirmed';
  };
  const modules = {
    '@react-native-async-storage/async-storage': {
      default: {
        getItem: async (key) => durable.get(key) ?? null,
        multiSet: async (entries) => {
          controls.storageAttempts += 1;
          controls.attemptedWrites.push(new Map(entries));
          if (controls.failStorage || controls.storageAttempts === controls.failStorageAt) throw new Error('storage unavailable');
          for (const [key, value] of entries) durable.set(key, value);
        },
      },
    },
    react: {
      useEffect: (effect) => { if (options.hydrate) effect(); },
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
    './ledger': ledger,
    './dates': dates,
    './seed': { seedInventory: options.seed ?? [] },
    './sync-queue': syncQueue,
    '../receipts/confirm-receipt': receiptConfirmation,
    './supabase-store': {
      ensureInventoryUser: async () => {
        if (options.hydrate && controls.failRemote) throw new Error('offline');
        return { id: 'test-user' };
      },
      loadRemoteInventory: async () => structuredClone(remote),
      commitReceiptIntake: remoteWrite,
      upsertInventoryItems: async (_user, items) => {
        await remoteWrite();
        if (items.some((item) => !item.quantity.trim())) throw new Error('quantity CHECK');
        const merged = new Map(remote.items.map((item) => [item.id, item]));
        items.forEach((item) => merged.set(item.id, structuredClone(item)));
        remote.items = [...merged.values()];
      },
      deleteInventoryItem: async (id) => { await remoteWrite(); remote.items = remote.items.filter((item) => item.id !== id); },
      commitCookingSession: async (events) => {
        controls.cookingCalls.push(events);
        return remoteWrite();
      },
    },
  };
  const exports = {};
  runInNewContext(hookCode, {
    exports,
    require: (name) => {
      assert.ok(name in modules, `Unexpected dependency: ${name}`);
      return modules[name];
    },
    Date,
    Promise,
  });
  return {
    hook: exports.useInventory(),
    controls,
    durable,
    readState: () => JSON.parse(durable.get('namgimeopsi.inventory.v2')),
    readQueue: () => JSON.parse(durable.get('namgimeopsi.inventory.sync-queue.v1')),
  };
}

function assertSingleReceipt(state) {
  assert.equal(state.items.length, 6);
  assert.equal(state.events.length, 6);
  assert.equal(new Set(state.items.map((item) => item.id)).size, 6);
  assert.equal(new Set(state.events.map((event) => event.id)).size, 6);
  assert.ok(state.events.every((event) => event.receiptId === receiptReviewFixture.batchId));
}

test('receipt retries keep reporting failure while local storage is unavailable', async () => {
  const { hook, controls, durable } = createHarness();
  controls.failStorage = true;

  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'failed');
  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'failed');
  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'failed');
  assert.equal(durable.size, 0);
  assert.equal(controls.remoteCalls, 0);
});

test('receipt retry persists the failed intake once and later confirmation stays idempotent', async () => {
  const { hook, controls, readState, readQueue } = createHarness();
  controls.failStorage = true;
  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'failed');

  controls.failStorage = false;
  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'already-confirmed');
  assertSingleReceipt(readState());
  assert.deepEqual(readQueue(), []);
  assert.equal(controls.remoteCalls, 1);

  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'already-confirmed');
  assertSingleReceipt(readState());
  assert.deepEqual(readQueue(), []);
  assert.equal(controls.remoteCalls, 1);
});

test('remote failure retains a durable receipt and retry drains its outbox without duplication', async () => {
  const { hook, controls, readState, readQueue } = createHarness();
  controls.failRemote = true;

  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'confirmed');
  assertSingleReceipt(readState());
  assert.equal(readQueue().length, 1);
  assert.equal(readQueue()[0].type, 'commit-receipt');

  controls.failRemote = false;
  assert.equal(await hook.confirmReceipt(receiptReviewFixture), 'already-confirmed');
  assertSingleReceipt(readState());
  assert.deepEqual(readQueue(), []);
  assert.equal(controls.remoteCalls, 2);
});

const settle = () => new Promise((resolve) => setImmediate(resolve));
const leftoverDraft = { name: 'QA curry', quantity: '1인분', kind: 'leftover', storage: '냉장', recommendedUseBy: '2026-09-10' };

test('sync retry persists a failed leftover addition before sending its original outbox operation', async () => {
  const { hook, controls, durable, readState, readQueue } = createHarness();
  controls.failStorage = true;
  hook.add(leftoverDraft);
  await settle();
  assert.equal(durable.size, 0);
  assert.equal(controls.remoteCalls, 0);
  const failedSnapshot = controls.attemptedWrites[0];

  // An unavailable disk must keep blocking remote writes, including on retry.
  hook.retrySync();
  await settle();
  assert.equal(durable.size, 0);
  assert.equal(controls.remoteCalls, 0);

  controls.failStorage = false;
  hook.retrySync();
  await settle();
  assert.equal(readState().items.length, 1);
  assert.equal(readState().items[0].name, leftoverDraft.name);
  assert.deepEqual(controls.attemptedWrites[2], failedSnapshot);
  assert.deepEqual(readQueue(), []);
  assert.equal(controls.remoteCalls, 1);
});

test('sync retry preserves cooking session IDs and queued operation order after a local write failure', async () => {
  const { hook, controls, readState, readQueue } = createHarness();
  controls.failRemote = true;
  hook.add(leftoverDraft);
  await settle();
  const item = readState().items[0];
  const pendingAddition = readQueue()[0];

  controls.failStorage = true;
  assert.equal(hook.completeCookingSession([
    { itemId: item.id, mode: 'remaining', remainingQuantity: '반 인분' },
  ], { recipeId: 'qa-recipe', recipeTitle: 'QA curry' }), true);
  await settle();
  const failedQueue = JSON.parse(controls.attemptedWrites.at(-1).get('namgimeopsi.inventory.sync-queue.v1'));
  assert.equal(failedQueue.length, 2);
  assert.deepEqual(failedQueue[0], pendingAddition);
  const cookingOperation = failedQueue[1];
  assert.equal(cookingOperation.type, 'commit-cooking-session');

  controls.failStorage = false;
  hook.retrySync();
  await settle();
  assert.deepEqual(readQueue(), failedQueue);
  assert.equal(readState().items[0].quantity, '반 인분');
  assert.equal(controls.cookingCalls.length, 0, 'The failed addition must block the later cooking operation');

  controls.failRemote = false;
  hook.retrySync();
  await settle();
  assert.deepEqual(readQueue(), []);
  assert.equal(readState().events.length, 1);
  assert.deepEqual(controls.cookingCalls, [cookingOperation.events]);
  assert.equal(readState().events[0].cookingSessionId, cookingOperation.events[0].cookingSessionId);
});

test('sync retry persists a completed dequeue even when the in-memory outbox is empty', async () => {
  const { hook, controls, readState, readQueue } = createHarness();
  controls.failStorageAt = 2;
  hook.add(leftoverDraft);
  await settle();
  assert.equal(controls.remoteCalls, 1);
  assert.equal(readQueue().length, 1, 'The failed dequeue write leaves the sent operation on disk');

  controls.failStorageAt = null;
  hook.retrySync();
  await settle();
  assert.deepEqual(readQueue(), []);
  assert.equal(readState().items.length, 1);
  assert.equal(controls.remoteCalls, 1, 'Retry only needs to persist the completed dequeue');
});


test('add and edit persist the same calendar date for display, ranking, and the outbox', async () => {
  const { hook, controls, readState, readQueue } = createHarness();
  controls.failRemote = true;
  hook.add(leftoverDraft);
  await settle();
  const item = readState().items[0];
  assert.equal(item.recommendedUseByAt, '2026-09-10');
  assert.ok(Number.isFinite(Date.parse(item.storageStartedAt)));
  assert.equal(readQueue()[0].items[0].recommendedUseByAt, '2026-09-10');
  hook.update(item.id, { ...leftoverDraft, recommendedUseBy: '2026-09-12' });
  await settle();
  assert.equal(readState().items[0].recommendedUseByAt, '2026-09-12');
  assert.equal(readState().items[0].storageStartedAt, item.storageStartedAt);
  assert.equal(readQueue().at(-1).items[0].recommendedUseByAt, '2026-09-12');
  hook.update(item.id, { ...leftoverDraft, recommendedUseBy: '' });
  await settle();
  assert.equal(readState().items[0].recommendedUseByAt, undefined);
  assert.throws(() => hook.update(item.id, { ...leftoverDraft, recommendedUseBy: '2026-02-30' }));
  assert.equal(readState().items[0].recommendedUseByAt, undefined);
});


test('cleared seed date survives offline hydration, reconnect and another restart', async () => {
  const seed = { id: 'tofu', name: '두부', quantity: '1모', kind: 'ingredient', storage: '냉장', recommendedUseBy: '이틀 안', recommendedUseByAt: '2026-08-31', createdAt: '2026-08-29T00:00:00Z', reason: '' };
  const initial = { version: 2, items: [seed], events: [] };
  const durable = new Map([['namgimeopsi.inventory.v2', JSON.stringify(initial)]]);
  const remote = structuredClone(initial);
  const options = { hydrate: true, seed: [seed], durable, remote };
  const first = createHarness(options);
  await settle();
  first.hook.update(seed.id, { ...seed, recommendedUseBy: '' });
  await settle();
  assert.equal(remote.items[0].recommendedUseByAt, undefined);
  assert.deepEqual(first.readQueue(), []);
  const offline = createHarness({ ...options, offline: true });
  await settle();
  assert.equal(offline.readState().items[0].recommendedUseByAt, undefined);
  assert.equal(offline.readQueue()[0].items[0].recommendedUseByAt, undefined);
  offline.controls.failRemote = false;
  offline.hook.retrySync();
  await settle();
  assert.deepEqual(offline.readQueue(), []);
  assert.equal(remote.items[0].recommendedUseByAt, undefined);
  const restarted = createHarness(options);
  await settle();
  assert.equal(restarted.readState().items[0].recommendedUseByAt, undefined);
});


test('blank quantities never change inventory or enter the outbox', async () => {
  const app = createHarness();
  app.hook.add({ ...leftoverDraft, quantity: ' \t ' });
  await settle();
  assert.equal(app.controls.storageAttempts, 0);
  assert.equal(app.controls.remoteCalls, 0);
  app.hook.add(leftoverDraft);
  await settle();
  const before = app.readState();
  const attempts = app.controls.storageAttempts;
  app.hook.update(before.items[0].id, { ...leftoverDraft, quantity: '   ' });
  await settle();
  assert.deepEqual(app.readState(), before);
  assert.equal(app.controls.storageAttempts, attempts);
});

for (const correction of ['update', 'delete', 'already-queued']) {
  test(`persisted invalid quantity recovers with ${correction} and preserves other lots`, async () => {
    const bad = { ...leftoverDraft, id: 'bad', quantity: '   ', reason: 'legacy', createdAt: '2026-09-01T00:00:00Z' };
    const good = { ...bad, id: 'good', quantity: '조금 남음' };
    const fixed = { ...bad, quantity: '반 봉지' };
    const operations = [{ id: 'old', type: 'upsert-items', items: [bad, good] }];
    if (correction === 'already-queued') operations.push({ id: 'fix', type: 'upsert-items', items: [fixed] });
    const durable = new Map([
      ['namgimeopsi.inventory.v2', JSON.stringify({ version: 2, items: [correction === 'already-queued' ? fixed : bad, good], events: [] })],
      ['namgimeopsi.inventory.sync-queue.v1', JSON.stringify(operations)],
    ]);
    const remote = { version: 2, items: [], events: [] };
    const app = createHarness({ durable, remote, hydrate: true });
    await settle();
    if (correction === 'update') app.hook.update('bad', { ...leftoverDraft, quantity: '반 봉지' });
    if (correction === 'delete') app.hook.remove('bad');
    await settle();
    app.hook.retrySync();
    await settle();
    assert.deepEqual(app.readQueue(), []);
    assert.equal(remote.items.find((item) => item.id === 'good').quantity, '조금 남음');
    assert.equal(remote.items.find((item) => item.id === 'bad')?.quantity, correction === 'delete' ? undefined : '반 봉지');
    const restarted = createHarness({ durable, remote, hydrate: true });
    await settle();
    assert.deepEqual(restarted.readQueue(), []);
    assert.deepEqual(restarted.readState().items, JSON.parse(JSON.stringify(remote.items)));
  });
}


test('quantity recovery preserves unresolved rows and receipt/cooking dependencies', () => {
  const bad = { ...leftoverDraft, id: 'bad', quantity: ' ' };
  const invalid = { id: 'invalid', type: 'upsert-items', items: [bad] };
  const correction = { id: 'correction', type: 'upsert-items', items: [{ ...bad, quantity: '1모' }] };
  assert.deepEqual(syncQueue.recoverInvalidQuantityOperations([invalid]), [invalid]);
  for (const type of ['commit-receipt', 'commit-cooking-session', 'upsert-events']) {
    const dependency = { id: type, type, items: [bad], events: [{ inventoryItemId: 'bad' }] };
    const queue = [invalid, dependency, correction];
    assert.deepEqual(syncQueue.recoverInvalidQuantityOperations(queue), queue);
  }
});
