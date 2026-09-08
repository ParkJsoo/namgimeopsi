import type { ReceiptDraftItem, ReceiptReviewDraft } from './types.ts';

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
