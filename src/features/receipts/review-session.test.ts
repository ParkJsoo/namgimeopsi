import { createReviewSession } from './review-session.ts';

function equal(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const session = createReviewSession();
const first = deferred<string>();
const second = deferred<string>();
let displayed = 'choice';
const firstIsCurrent = session.begin();
const firstWork = first.promise.then((value) => {
  if (firstIsCurrent()) displayed = value;
});
session.invalidate(); // Android back / close.
const secondIsCurrent = session.begin();
const secondWork = second.promise.then((value) => {
  if (secondIsCurrent()) displayed = value;
});
second.resolve('second receipt');
await secondWork;
first.resolve('cancelled first receipt');
await firstWork;
equal(displayed, 'second receipt', 'late cancelled scan must not replace the new review');

const pendingConfirmation = session.capture();
session.invalidate();
equal(pendingConfirmation(), false, 'closed review must not reopen on confirmation completion');
equal(secondIsCurrent(), false, 'close invalidates even without a replacement request');
equal(session.begin()(), true, 'a fresh review can complete');
console.log('✓ cancelled scan and confirmation responses cannot update a new review');
