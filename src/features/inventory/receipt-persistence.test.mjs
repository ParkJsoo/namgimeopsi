import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

import * as ledger from './ledger.ts';
import * as syncQueue from './sync-queue.ts';
import * as receiptConfirmation from '../receipts/confirm-receipt.ts';
import { receiptReviewFixture } from '../receipts/fixture.ts';

// Exercise the actual hook's persistence ordering without native modules or a
// remote project. Hydration is skipped so each case starts with empty inventory.
const hookCode = ts.transpileModule(
  readFileSync(new URL('./use-inventory.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: false } },
).outputText;

function createHarness() {
  const durable = new Map();
  const controls = {
    failStorage: false,
    failStorageAt: null,
    storageAttempts: 0,
    attemptedWrites: [],
    failRemote: false,
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
        multiSet: async (entries) => {
          controls.storageAttempts += 1;
          controls.attemptedWrites.push(new Map(entries));
          if (controls.failStorage || controls.storageAttempts === controls.failStorageAt) throw new Error('storage unavailable');
          for (const [key, value] of entries) durable.set(key, value);
        },
      },
    },
    react: {
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
    './ledger': ledger,
    './seed': { seedInventory: [] },
    './sync-queue': syncQueue,
    '../receipts/confirm-receipt': receiptConfirmation,
    './supabase-store': {
      ensureInventoryUser: async () => ({ id: 'test-user' }),
      commitReceiptIntake: remoteWrite,
      upsertInventoryItems: remoteWrite,
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
const leftoverDraft = { name: 'QA curry', quantity: '1인분', kind: 'leftover', storage: '냉장', recommendedUseBy: '내일까지' };

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
