import type { ReceiptDraftItem, ReceiptReviewDraft } from './types.ts';

/** 미지정은 허용하되, 지정한 날짜는 실제 존재하는 YYYY-MM-DD여야 한다. */
export function isValidReceiptRecommendedDate(value?: string) {
  if (value === undefined || value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** 입력 중인 날짜도 보존한다. 잘못된 날짜는 확정 검증에서 차단한다. */
export function updateReceiptRecommendedDate(draft: ReceiptReviewDraft, itemId: string, value: string) {
  return updateReceiptDraftItem(draft, itemId, {
    recommendedUseBy: value || '미지정',
    recommendedUseByAt: value || undefined,
  });
}

export function getIncludedReceiptItems(draft: ReceiptReviewDraft): ReceiptDraftItem[] {
  return draft.items.filter((item) => item.included);
}

export function getReceiptReviewCounts(draft: ReceiptReviewDraft) {
  const includedItems = getIncludedReceiptItems(draft);
  return {
    included: includedItems.length,
    confirmed: includedItems.filter((item) => item.confidence === 'high').length,
    needsReview: includedItems.filter((item) => item.confidence === 'needs-review').length,
  };
}

export function updateReceiptDraftItem(
  draft: ReceiptReviewDraft,
  itemId: string,
  patch: Partial<Omit<ReceiptDraftItem, 'id' | 'rawName' | 'confidence'>>,
): ReceiptReviewDraft {
  return {
    ...draft,
    items: draft.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  };
}
