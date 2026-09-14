import { getConsumptionStatus, isIsoDate, localDate, type ConsumptionStatus } from '../domain/date-status.ts';
import type { InventoryDraft, InventoryItem } from './types.ts';

export { isIsoDate, localDate };
export const isValidDateInput = (value: string) => !value.trim() || isIsoDate(value.trim());
export function dateAfterDays(days: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return localDate(date);
}

/** Legacy relative labels have no reliable reference day; never guess one. */
export function inventoryDates(item: InventoryItem) {
  return {
    recommendedUseByAt: isIsoDate(item.recommendedUseByAt) ? item.recommendedUseByAt : undefined,
    labelExpiryAt: isIsoDate(item.labelExpiryAt) ? item.labelExpiryAt : undefined,
  };
}
export function getFoodStatus(item: InventoryItem, reference: Date | string = new Date()): ConsumptionStatus {
  return getConsumptionStatus(inventoryDates(item), reference);
}
export function getDateLabel(item: InventoryItem, reference: Date | string = new Date()) {
  const dates = inventoryDates(item);
  const date = dates.recommendedUseByAt ?? dates.labelExpiryAt;
  if (!date) return '날짜 확인 필요';
  const source = dates.recommendedUseByAt ? '권장' : '포장 표기일';
  const status = getFoodStatus(item, reference);
  if (status === 'overdue') return `${source} ${date} · 지남`;
  if (status === 'today') return `${source} ${date} · 오늘`;
  return `${source} ${date}`;
}
export function getDateDescription(item: InventoryItem) {
  if (item.kind === 'leftover') {
    const value = item.storageStartedAt;
    if (value && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value))) {
      return `${item.storage} 보관 시작 ${localDate(new Date(value))}`;
    }
    return '보관 시작일 확인 필요';
  }
  if (item.labelExpiryAt) return `포장 표기일 ${item.labelExpiryAt}`;
  return isIsoDate(item.recommendedUseByAt) ? `권장 섭취일 ${item.recommendedUseByAt}` : '권장 섭취일 미지정';
}
export function compareInventoryDates(a: InventoryItem, b: InventoryItem, reference: Date | string) {
  const rank: Record<ConsumptionStatus, number> = { overdue: 0, today: 1, soon: 2, relaxed: 3, unknown: 4 };
  const aDate = inventoryDates(a); const bDate = inventoryDates(b);
  return rank[getFoodStatus(a, reference)] - rank[getFoodStatus(b, reference)] ||
    (aDate.recommendedUseByAt ?? aDate.labelExpiryAt ?? '9999').localeCompare(bDate.recommendedUseByAt ?? bDate.labelExpiryAt ?? '9999');
}
/** Called by both add and edit, so displayed and ranking dates cannot diverge. */
export function applyDraftDates(draft: InventoryDraft, previous?: InventoryItem, now = new Date()) {
  const value = draft.recommendedUseBy.trim();
  if (!isValidDateInput(value)) throw new Error('실제 날짜를 YYYY-MM-DD로 입력해 주세요.');
  return {
    recommendedUseBy: value,
    recommendedUseByAt: value || undefined,
    storageStartedAt: draft.kind === 'leftover'
      ? previous?.kind === 'leftover' ? previous.storageStartedAt : now.toISOString()
      : undefined,
  };
}
