import { getConsumptionPriorityDate, getConsumptionStatus } from './date-status.ts';
import { calculateRemainingQuantity, isDepleted } from './inventory-events.ts';
import { rankRecipes, type Recipe } from './recipe-ranking.ts';

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
