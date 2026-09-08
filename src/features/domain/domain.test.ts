import { getConsumptionPriorityDate, getConsumptionStatus } from './date-status.ts';
import { calculateRemainingQuantity, isDepleted } from './inventory-events.ts';
import { rankRecipes, type Recipe } from './recipe-ranking.ts';
import { getLiveRecipeRecommendations, projectAvailableFoods } from '../recipes/recommendations.ts';
import { seedInventory } from '../inventory/seed.ts';
import {
  completeCookingSession,
  completeInventoryItems,
  getActiveInventoryItems,
  mergeMissingRecommendationDates,
  parseInventoryState,
} from '../inventory/ledger.ts';
import { applyPendingInventorySync, createBootstrapInventorySyncOperations } from '../inventory/sync-queue.ts';
import type { InventoryItem, InventoryState } from '../inventory/types.ts';
import { receiptReviewFixture } from '../receipts/fixture.ts';
import { canConfirmReceiptDraft, confirmReceiptDraft, isReceiptDraftAlreadyConfirmed } from '../receipts/confirm-receipt.ts';
import { getReceiptReviewCounts, updateReceiptDraftItem } from '../receipts/review-draft.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, message: string) {
  assert(Object.is(actual, expected), `${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function throws(fn: () => void, expectedMessage: string) {
  try {
    fn();
  } catch (error) {
    assert(error instanceof Error && error.message.includes(expectedMessage), `Unexpected error: ${String(error)}`);
    return;
  }
  throw new Error(`Expected an error containing: ${expectedMessage}`);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test('재고 이벤트는 입고·소비·수정·폐기를 순서대로 원장에 반영한다', () => {
  const remaining = calculateRemainingQuantity(
    { amount: 2, unit: '개' },
    [
      { type: 'intake', quantity: { amount: 3, unit: '개' }, occurredAt: '2026-08-27T09:00:00Z' },
      { type: 'consume', quantity: { amount: 1, unit: '개' }, occurredAt: '2026-08-27T12:00:00Z' },
      { type: 'adjust', remainingQuantity: { amount: 2, unit: '개' }, occurredAt: '2026-08-27T13:00:00Z' },
      { type: 'discard', occurredAt: '2026-08-27T18:00:00Z' },
    ],
  );
  equal(remaining.amount, 0, '폐기 후 잔량');
  equal(isDepleted(remaining), true, '소진 상태');
});

test('재고 이벤트는 단위 혼용과 초과 소비를 막는다', () => {
  throws(
    () => calculateRemainingQuantity({ amount: 1, unit: '모' }, [{ type: 'consume', quantity: { amount: 1, unit: 'g' }, occurredAt: '2026-08-27T09:00:00Z' }]),
    '단위가 일치하지 않습니다',
  );
  throws(
    () => calculateRemainingQuantity({ amount: 1, unit: '개' }, [{ type: 'consume', quantity: { amount: 2, unit: '개' }, occurredAt: '2026-08-27T09:00:00Z' }]),
    '현재 잔량보다 많은',
  );
});

test('날짜 계산은 권장 섭취 시점을 우선하고, 포장 표기일을 보조 기준으로 쓴다', () => {
  const dates = { labelExpiryAt: '2026-09-05', recommendedUseByAt: '2026-08-28', purchasedAt: '2026-08-27' };
  equal(getConsumptionPriorityDate(dates), '2026-08-28', '소비 우선 날짜');
  equal(getConsumptionStatus(dates, '2026-08-27'), 'soon', '내일 상태');
  equal(getConsumptionStatus({ labelExpiryAt: '2026-08-27' }, '2026-08-27'), 'today', '포장 표기일만 있는 경우');
  equal(getConsumptionStatus({ storageStartedAt: '2026-08-27' }, '2026-08-27'), 'unknown', '보관 시작일만으로 안전 상태를 추측하지 않음');
});

test('레시피는 임박 재료 활용, 부족 재료, 조리 시간을 근거로 결정론적으로 정렬한다', () => {
  const recipes: Recipe[] = [
    { id: 'tofu-bowl', title: '두부 덮밥', cookMinutes: 15, servings: 1, ingredients: [{ foodName: '두부' }, { foodName: '애호박' }, { foodName: '간장' }] },
    { id: 'egg-soup', title: '계란국', cookMinutes: 10, servings: 1, ingredients: [{ foodName: '계란' }, { foodName: '대파' }, { foodName: '소금' }] },
    { id: 'missing', title: '어려운 메뉴', cookMinutes: 5, servings: 1, ingredients: [{ foodName: '두부' }, { foodName: '감자' }, { foodName: '양파' }, { foodName: '버섯' }] },
  ];
  const recommendations = rankRecipes(
    recipes,
    [
      { name: '두부', consumptionStatus: 'soon' },
      { name: '애호박', consumptionStatus: 'today' },
      { name: '계란', consumptionStatus: 'relaxed' },
    ],
    ['간장', '소금'],
  );

  equal(recommendations.length, 2, '부족 재료 3개 메뉴 제외');
  equal(recommendations[0]?.recipe.id, 'tofu-bowl', '임박 재료를 더 쓰는 메뉴 우선');
  equal(recommendations[0]?.missingIngredients.length, 0, '기본 보유 재료는 부족 재료에서 제외');
  assert(recommendations[0]?.reason.includes('두부와 애호박'), '추천 이유에 임박 재료가 포함되어야 합니다');
});

test('재고를 기반으로 한 홈 추천은 최대 3개를 반환하고 소비 상태에 따라 정렬한다', () => {
  const recommendations = getLiveRecipeRecommendations(seedInventory, '2026-08-29');

  equal(recommendations.length, 3, '홈 추천 상한');
  equal(recommendations[0]?.recipe.id, 'tofu-zucchini-bowl', '임박 재료 두 개를 쓰는 메뉴 우선');
  equal(recommendations[1]?.recipe.id, 'chicken-mayo-bowl', '오늘 권장 남은 음식 메뉴');
  equal(recommendations[0]?.missingIngredients.length, 0, '기본 보유 재료는 부족 재료에서 제외');
  assert(recommendations[1]?.reason.startsWith('남은 치킨을 먼저'), '추천 이유는 자연스러운 조사로 표시');
  equal(getLiveRecipeRecommendations([], '2026-08-29').length, 0, '보유 재료가 없으면 메뉴를 제안하지 않음');
});

test('추천 입력은 표시용 날짜나 보관 시작일을 소비 상태로 추정하지 않는다', () => {
  const baseItem: InventoryItem = {
    id: 'tofu-display-only',
    name: '두부',
    quantity: '1모',
    storage: '냉장',
    recommendedUseBy: '오늘',
    reason: '표시용 문구',
    kind: 'ingredient',
    storageStartedAt: '오늘',
    createdAt: '2026-08-29T10:00:00.000Z',
  };
  const foods = projectAvailableFoods(
    [baseItem, { ...baseItem, id: 'tofu-soon', recommendedUseByAt: '2026-08-31' }],
    '2026-08-29',
  );

  equal(foods.length, 1, '동일 식재료 lot는 하나의 추천 입력으로 투영');
  equal(foods[0]?.consumptionStatus, 'soon', 'ISO 권장일이 있는 lot의 상태를 우선');
  equal(projectAvailableFoods([baseItem], '2026-08-29')[0]?.consumptionStatus, 'unknown', '표시 문구만 있으면 확인 필요');
});

test('전량 소비는 활성 재고에서만 제외하고 생활 단위 원장을 보존한다', () => {
  const initialState: InventoryState = { version: 2, items: seedInventory, events: [] };
  const completed = completeInventoryItems(initialState, ['leftover-chicken'], {
    occurredAt: '2026-08-29T12:00:00.000Z',
    recipeId: 'chicken-mayo-bowl',
    recipeTitle: '치킨마요 덮밥',
  });

  equal(getActiveInventoryItems(completed).some((item) => item.id === 'leftover-chicken'), false, '소비 완료 항목은 활성 재고에서 제외');
  equal(completed.events.length, 1, '소비 원장 기록 수');
  equal(completed.events[0]?.type, 'consume-all', '전량 소비 이벤트 타입');
  equal(completed.events[0]?.quantityLabel, '1인분', '생활 단위 보존');
  const consumptionEvent = completed.events[0];
  assert(consumptionEvent?.type === 'consume-all', '첫 이벤트는 소비 이벤트');
  equal(consumptionEvent.recipeId, 'chicken-mayo-bowl', '레시피 근거 보존');
  equal(completeInventoryItems(completed, ['leftover-chicken'], { occurredAt: '2026-08-29T13:00:00.000Z' }).events.length, 1, '이미 소비한 lot는 중복 기록하지 않음');
});

test('조리 세션은 확인한 남은 생활 단위만 부분 차감하고 전량 소비와 함께 원장을 남긴다', () => {
  const initialState: InventoryState = { version: 2, items: seedInventory, events: [] };
  const completed = completeCookingSession(
    initialState,
    [
      { itemId: 'eggs', mode: 'remaining', remainingQuantity: '8개' },
      { itemId: 'leftover-chicken', mode: 'all' },
      { itemId: 'zucchini', mode: 'remaining', remainingQuantity: '반 개' },
    ],
    {
      sessionId: 'cooking-test-1',
      occurredAt: '2026-08-29T12:00:00.000Z',
      recipeId: 'chicken-mayo-bowl',
      recipeTitle: '치킨마요 덮밥',
    },
  );

  equal(completed.items.find((item) => item.id === 'eggs')?.quantity, '8개', '부분 소비 뒤 남은 양 갱신');
  equal(completed.items.find((item) => item.id === 'zucchini')?.quantity, '반 개', '같은 생활 단위는 추측 없이 유지');
  equal(getActiveInventoryItems(completed).some((item) => item.id === 'leftover-chicken'), false, '전량 소비 lot만 활성 재고에서 제외');
  equal(completed.events.length, 2, '바뀌지 않은 남은 양은 원장을 만들지 않음');
  const partial = completed.events.find((event) => event.type === 'consume');
  assert(partial?.type === 'consume', '부분 소비 원장이 필요함');
  equal(partial.remainingQuantityLabel, '8개', '부분 소비 원장에 남은 생활 단위 보존');
  equal(partial.cookingSessionId, 'cooking-test-1', '조리 세션 연결 보존');
});

test('저장소 상태는 v1 배열을 v2 원장 상태로 안전하게 이관한다', () => {
  const migrated = parseInventoryState(seedInventory);
  equal(migrated?.version, 2, 'v2 버전');
  equal(migrated?.items.length, seedInventory.length, '기존 재고 보존');
  equal(migrated?.events.length, 0, '기존 원장은 빈 배열');
  equal(parseInventoryState({ version: 2, items: seedInventory, events: [] })?.items.length, seedInventory.length, 'v2 상태 유지');
  equal(parseInventoryState({ version: 1, items: seedInventory }), null, '알 수 없는 상태 거부');

  const legacyItems = seedInventory.map(({ recommendedUseByAt: _recommendedUseByAt, ...item }) => item);
  const enriched = mergeMissingRecommendationDates(
    { version: 2, items: legacyItems, events: [] },
    seedInventory,
  );
  equal(enriched.items.find((item) => item.id === 'leftover-chicken')?.recommendedUseByAt, '2026-08-29', '시드 lot ISO 날짜 보완');
});

test('원격 상태 위에 대기 중인 재고 변경을 순서대로 다시 적용한다', () => {
  const remoteItem = seedInventory[0];
  assert(remoteItem, '시드 재고가 필요함');
  const pendingItem: InventoryItem = { ...remoteItem, id: 'pending-item', name: '대기 재고' };
  const projected = applyPendingInventorySync(
    { version: 2, items: [remoteItem], events: [] },
    [
      { id: 'add', type: 'upsert-items', items: [pendingItem] },
      { id: 'update', type: 'upsert-items', items: [{ ...remoteItem, quantity: '반 모' }] },
      { id: 'remove', type: 'delete-item', itemId: 'pending-item' },
    ],
  );

  equal(projected.items.length, 1, '삭제 대기 작업도 원격 상태에 반영');
  equal(projected.items[0]?.quantity, '반 모', '같은 lot의 마지막 수정이 우선');
});

test('초기 이관에서도 영수증 lot와 입고 원장을 단일 RPC 작업으로 묶는다', () => {
  const reviewed = updateReceiptDraftItem(receiptReviewFixture, 'pork', { included: false });
  const confirmed = confirmReceiptDraft(
    { version: 2, items: seedInventory, events: [] },
    reviewed,
    { occurredAt: '2026-08-29T14:00:00.000Z' },
  );
  const operations = createBootstrapInventorySyncOperations(confirmed);
  const receiptOperation = operations.find((operation) => operation.type === 'commit-receipt');

  assert(receiptOperation?.type === 'commit-receipt', '영수증 확정은 RPC 작업이어야 함');
  equal(receiptOperation.items.length, 5, '선택한 lot를 함께 전송');
  equal(receiptOperation.events.length, 5, '입고 원장을 함께 전송');
  equal(receiptOperation.receiptId, reviewed.batchId, '영수증 batch id 보존');
});

test('삭제된 legacy receipt lot의 intake 원장은 recovery upsert로 보존한다', () => {
  const reviewed = updateReceiptDraftItem(receiptReviewFixture, 'pork', { included: false });
  const confirmed = confirmReceiptDraft(
    { version: 2, items: seedInventory, events: [] },
    reviewed,
    { occurredAt: '2026-08-29T14:00:00.000Z' },
  );
  const deletedLotId = confirmed.events.find((event) => event.type === 'intake')?.inventoryItemId;
  assert(deletedLotId, '영수증 intake lot가 필요함');

  const operations = createBootstrapInventorySyncOperations({
    ...confirmed,
    items: confirmed.items.filter((item) => item.id !== deletedLotId),
  });
  const receiptOperation = operations.find((operation) => operation.type === 'commit-receipt');
  const recoveryOperation = operations.find((operation) => operation.type === 'upsert-events');

  equal(receiptOperation, undefined, '불완전 batch는 RPC로 재확정하지 않음');
  assert(recoveryOperation?.type === 'upsert-events', 'recovery 이벤트 upsert가 필요함');
  equal(recoveryOperation.events.length, 5, '삭제된 lot를 포함한 intake 원장 전체 보존');
  equal(recoveryOperation.events[0]?.type, 'intake', 'recovery 원장 타입');
});

test('영수증 fixture는 원문과 검수 필요 상태를 보존하며, 제외 결과를 즉시 계산한다', () => {
  equal(receiptReviewFixture.items.length, 6, '데모 영수증 후보 수');
  equal(getReceiptReviewCounts(receiptReviewFixture).confirmed, 4, '확인됨 후보 수');
  equal(getReceiptReviewCounts(receiptReviewFixture).needsReview, 2, '확인 필요 후보 수');
  equal(receiptReviewFixture.items.find((item) => item.id === 'sesame-oil')?.rawName, '백설 진한참기름', 'AI 원문 보존');

  const excluded = updateReceiptDraftItem(receiptReviewFixture, 'pork', { included: false, quantity: '500g' });
  equal(getReceiptReviewCounts(excluded).included, 5, '제외한 후보는 확정 개수에서 빠짐');
  equal(excluded.items.find((item) => item.id === 'pork')?.quantity, '500g', '생활 단위 수정 반영');
  equal(receiptReviewFixture.items.find((item) => item.id === 'pork')?.included, true, '원본 fixture는 변경하지 않음');
});

test('영수증은 사용자 확정 뒤에만 개별 lot와 입고 원장으로 한 번 저장한다', () => {
  const initialState: InventoryState = { version: 2, items: seedInventory, events: [] };
  const reviewed = updateReceiptDraftItem(receiptReviewFixture, 'pork', { included: false, quantity: '500g' });
  equal(canConfirmReceiptDraft(reviewed), true, '포함한 모든 후보가 검수 가능한 경우에만 확정 가능');

  const confirmed = confirmReceiptDraft(initialState, reviewed, { occurredAt: '2026-08-29T14:00:00.000Z' });
  equal(initialState.items.length, seedInventory.length, '확정 전 원본 재고는 변경하지 않음');
  equal(confirmed.items.length, seedInventory.length + 5, '선택한 후보만 개별 lot로 추가');
  equal(confirmed.events.length, 5, '선택한 후보와 입고 원장이 일대일 대응');
  equal(confirmed.events[0]?.type, 'intake', '입고 이벤트 타입');
  const intakeEvent = confirmed.events[0];
  assert(intakeEvent?.type === 'intake', '첫 이벤트는 입고 이벤트');
  equal(intakeEvent.rawName, '신선란 10구', '영수증 원문 보존');
  equal(intakeEvent.quantityLabel, '10개', '생활 단위 보존');
  equal(confirmed.items[0]?.createdAt, '2026-08-29T14:00:00.000Z', '확정 시각 보존');
  equal(isReceiptDraftAlreadyConfirmed(confirmed, reviewed), true, '같은 영수증의 재확정을 식별');
  equal(confirmReceiptDraft(confirmed, reviewed, { occurredAt: '2026-08-29T15:00:00.000Z' }).events.length, 5, '같은 영수증은 중복 입고하지 않음');

  const invalid = updateReceiptDraftItem(receiptReviewFixture, 'tofu', { name: ' ' });
  equal(canConfirmReceiptDraft(invalid), false, '포함한 항목의 이름이 비면 확정 불가');
  equal(confirmReceiptDraft(initialState, invalid, { occurredAt: '2026-08-29T14:00:00.000Z' }), initialState, '무효 검수는 상태를 바꾸지 않음');
});
