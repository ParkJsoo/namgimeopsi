import type { InventoryState } from '../inventory/types.ts';
import { projectAvailableFoods } from '../recipes/recommendations.ts';
import { canConfirmReceiptDraft, confirmReceiptDraft } from './confirm-receipt.ts';
import { receiptReviewFixture } from './fixture.ts';
import { isValidReceiptRecommendedDate, updateReceiptDraftItem, updateReceiptRecommendedDate } from './review-draft.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const emptyState: InventoryState = { version: 2, items: [], events: [] };
const context = { occurredAt: '2026-09-07T03:00:00.000Z' };

const edited = updateReceiptRecommendedDate(receiptReviewFixture, 'tofu', '2026-09-20');
const saved = confirmReceiptDraft(emptyState, edited, context);
const tofu = saved.items.find((item) => item.name === '두부');
assert(tofu?.recommendedUseBy === '2026-09-20', '입고 표시 날짜가 수정값이어야 한다');
assert(tofu.recommendedUseByAt === '2026-09-20', '추천 날짜도 수정값이어야 한다');
assert(tofu.labelExpiryAt === '2026-09-02', '포장 표기일은 수정하지 않는다');
assert(projectAvailableFoods([tofu], '2026-09-07')[0].consumptionStatus === 'relaxed', '추천은 과거 fixture 날짜 대신 수정일을 사용해야 한다');
assert(receiptReviewFixture.items.find((item) => item.id === 'tofu')?.recommendedUseByAt === '2026-09-01', '원본 fixture를 변경하지 않는다');

for (const value of ['2026-02-29', '2026-09-31', '2026-13-01', '2026-00-01', '2026-09-00', '2026-9-07', '내일', '2026-09-', ' ']) {
  const invalid = updateReceiptRecommendedDate(receiptReviewFixture, 'tofu', value);
  assert(!isValidReceiptRecommendedDate(value), `잘못된 날짜를 거부해야 한다: ${value}`);
  assert(invalid.items.find((item) => item.id === 'tofu')?.recommendedUseByAt === value, '입력 중 문자열은 보존해야 한다');
  assert(!canConfirmReceiptDraft(invalid), `잘못된 날짜의 확정을 막아야 한다: ${value}`);
  assert(confirmReceiptDraft(emptyState, invalid, context) === emptyState, '검증 실패 시 재고와 원장이 바뀌면 안 된다');
  assert(canConfirmReceiptDraft(updateReceiptDraftItem(invalid, 'tofu', { included: false })), '제외한 후보의 날짜 오류는 입고를 막지 않는다');
}
assert(isValidReceiptRecommendedDate('2028-02-29'), '윤년의 실제 날짜는 허용해야 한다');

const cleared = updateReceiptRecommendedDate(receiptReviewFixture, 'egg', '');
assert(canConfirmReceiptDraft(cleared), '미지정 날짜는 확정 가능해야 한다');
const egg = confirmReceiptDraft(emptyState, cleared, context).items.find((item) => item.name === '계란');
assert(egg?.recommendedUseBy === '미지정' && egg.recommendedUseByAt === undefined, '날짜를 지우면 표시와 추천 날짜를 함께 비워야 한다');
assert(projectAvailableFoods([egg], '2026-09-07')[0].consumptionStatus === 'unknown', '지운 권장 날짜를 추천에 사용하면 안 된다');
console.log('✓ 영수증 권장 날짜 수정·입고·추천 반영, 잘못된 날짜 차단, 미지정 및 제외 처리');
