import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDraftDates, compareInventoryDates, dateAfterDays, getDateDescription, getDateLabel, getFoodStatus, isValidDateInput, localDate } from './dates.ts';
import { getLiveRecipeRecommendations, projectAvailableFoods } from '../recipes/recommendations.ts';

const item = { id: 'test', name: '두부', quantity: '1모', kind: 'ingredient', storage: '냉장', recommendedUseBy: '이번 주 안', recommendedUseByAt: '2026-09-01', createdAt: '2026-08-29T00:00:00Z', reason: '' };
test('stale labels cannot override the shared date basis in the list and recommendation', () => {
  assert.equal(getFoodStatus(item, '2026-09-09'), 'overdue');
  assert.equal(projectAvailableFoods([item], '2026-09-09')[0].consumptionStatus, 'overdue');
  assert.equal(getDateLabel(item, '2026-09-09'), '권장 2026-09-01 · 지남');
  assert(!getDateLabel(item).includes('이번 주'));
});
test('one stored date progresses through upcoming, today and overdue without rewriting data', () => {
  assert.equal(getFoodStatus(item, '2026-08-29'), 'relaxed');
  assert.equal(getFoodStatus(item, '2026-08-31'), 'soon');
  assert.equal(getFoodStatus(item, '2026-09-01'), 'today');
  assert.equal(getFoodStatus(item, '2026-09-02'), 'overdue');
});
test('legacy text, purchase and start time cannot imply a consumption date', () => {
  const legacy = { ...item, recommendedUseByAt: undefined, recommendedUseBy: '내일까지', kind: 'leftover', storageStartedAt: '지금', purchasedAt: '오늘' };
  assert.equal(getFoodStatus(legacy, '2026-09-09'), 'unknown');
  assert.equal(getDateLabel(legacy), '날짜 확인 필요');
  assert.equal(getDateDescription(legacy), '보관 시작일 확인 필요');
  assert.equal(getFoodStatus({ ...legacy, labelExpiryAt: '8월 29일' }), 'unknown');
});
test('valid packaging dates are explicit fallback; malformed dates do not crash the UI', () => {
  assert.equal(getFoodStatus({ ...item, recommendedUseByAt: '2026-02-30' }), 'unknown');
  const fallback = { ...item, recommendedUseByAt: undefined, labelExpiryAt: '2026-09-03' };
  assert.equal(getDateLabel(fallback, '2026-09-09'), '포장 표기일 2026-09-03 · 지남');
  assert.equal(getFoodStatus({ ...fallback, recommendedUseByAt: '2026-09-20' }, '2026-09-09'), 'relaxed');
});
test('validation and calendar arithmetic cover leap dates and month/year boundaries', () => {
  for (const value of ['', '2028-02-29', '2026-12-31']) assert(isValidDateInput(value));
  for (const value of ['내일까지', '2026-02-29', '2026-09-31', '2026-13-01']) assert(!isValidDateInput(value));
  assert.equal(dateAfterDays(1, new Date(2026, 11, 31, 23, 59)), '2027-01-01');
  assert.equal(dateAfterDays(1, new Date(2028, 1, 28)), '2028-02-29');
});
test('local midnight, including DST, stays independent from UTC date', () => {
  const original = process.env.TZ;
  try {
    process.env.TZ = 'Asia/Seoul';
    const now = new Date('2026-09-09T15:01:00Z');
    assert.equal(localDate(now), '2026-09-10');
    assert.equal(getFoodStatus({ ...item, recommendedUseByAt: '2026-09-10' }, now), 'today');
    process.env.TZ = 'America/New_York';
    assert.equal(dateAfterDays(1, new Date(2026, 2, 7, 23)), '2026-03-08');
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
test('new leftovers store timestamps; editing never fabricates a legacy start date', () => {
  const draft = { name: '카레', quantity: '1인분', kind: 'leftover', storage: '냉장', recommendedUseBy: '2026-09-10' };
  const now = new Date('2026-09-09T07:00:00Z');
  assert.equal(applyDraftDates(draft, undefined, now).storageStartedAt, now.toISOString());
  assert.equal(applyDraftDates(draft, { ...item, kind: 'leftover', storageStartedAt: '지금' }, now).storageStartedAt, '지금');
  assert.equal(applyDraftDates({ ...draft, recommendedUseBy: '' }).recommendedUseByAt, undefined);
});
test('inventory sorts by the same urgency and actual day', () => {
  const today = { ...item, id: 'today', recommendedUseByAt: '2026-09-09' };
  const unknown = { ...item, id: 'unknown', recommendedUseByAt: undefined };
  assert.deepEqual([unknown, today, item].sort((a, b) => compareInventoryDates(a, b, '2026-09-09')).map(i => i.id), ['test', 'today', 'unknown']);
});


test('overdue recipe reasons retain the date warning, including mixed urgency', () => {
  const zucchini = { ...item, id: 'zucchini', name: '애호박', recommendedUseByAt: '2026-09-14' };
  const recommendations = getLiveRecipeRecommendations([item, zucchini], '2026-09-14');
  const bowl = recommendations.find((entry) => entry.recipe.id === 'tofu-zucchini-bowl');
  assert(bowl);
  assert(bowl.reason.includes('두부: 기준 날짜가 지났어요. 사용 전 상태를 확인해 주세요.'));
  assert(!bowl.reason.includes('먼저 쓰기 좋아요'));
  assert(bowl.reason.includes('부족 재료가 없어요'));
  assert(bowl.reason.includes('15분'));
  const current = getLiveRecipeRecommendations([{ ...item, recommendedUseByAt: '2026-09-14' }, zucchini], '2026-09-14')[0];
  assert(current.reason.includes('먼저 쓰기 좋아요'));
  assert(!current.reason.includes('지났어요'));
});
