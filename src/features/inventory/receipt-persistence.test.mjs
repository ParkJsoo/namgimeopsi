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
  const controls = { failStorage: false, failRemote: false, remoteCalls: 0 };
  const modules = {
    '@react-native-async-storage/async-storage': {
      default: {
        multiSet: async (entries) => {
          if (controls.failStorage) throw new Error('storage unavailable');
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
      commitReceiptIntake: async () => {
        controls.remoteCalls += 1;
        if (controls.failRemote) throw new Error('offline');
        return 'confirmed';
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
