import { getConsumptionPriorityDate, getConsumptionStatus } from './date-status.ts';
import { calculateRemainingQuantity, isDepleted } from './inventory-events.ts';
import { rankRecipes, type Recipe } from './recipe-ranking.ts';
import { getLiveRecipeRecommendations, projectAvailableFoods } from '../recipes/recommendations.ts';
import { seedInventory } from '../inventory/seed.ts';
import { completeInventoryItems, getActiveInventoryItems, parseInventoryState } from '../inventory/ledger.ts';
import type { InventoryItem, InventoryState } from '../inventory/types.ts';

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
  equal(completed.events[0]?.recipeId, 'chicken-mayo-bowl', '레시피 근거 보존');
  equal(completeInventoryItems(completed, ['leftover-chicken'], { occurredAt: '2026-08-29T13:00:00.000Z' }).events.length, 1, '이미 소비한 lot는 중복 기록하지 않음');
});

test('저장소 상태는 v1 배열을 v2 원장 상태로 안전하게 이관한다', () => {
  const migrated = parseInventoryState(seedInventory);
  equal(migrated?.version, 2, 'v2 버전');
  equal(migrated?.items.length, seedInventory.length, '기존 재고 보존');
  equal(migrated?.events.length, 0, '기존 원장은 빈 배열');
  equal(parseInventoryState({ version: 2, items: seedInventory, events: [] })?.items.length, seedInventory.length, 'v2 상태 유지');
  equal(parseInventoryState({ version: 1, items: seedInventory }), null, '알 수 없는 상태 거부');
});
