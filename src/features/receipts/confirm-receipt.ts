import type { InventoryItem, InventoryState } from '../inventory/types.ts';
import { getIncludedReceiptItems } from './review-draft.ts';
import type { ReceiptDraftItem, ReceiptReviewDraft } from './types.ts';

export type ReceiptConfirmationContext = {
  occurredAt: string;
};

function isValidIncludedItem(item: ReceiptDraftItem) {
  return Boolean(item.name.trim() && item.quantity.trim());
}

export function canConfirmReceiptDraft(draft: ReceiptReviewDraft) {
  const includedItems = getIncludedReceiptItems(draft);
  return includedItems.length > 0 && includedItems.every(isValidIncludedItem);
}

/**
 * 확정된 영수증 후보를 개별 lot와 입고 원장으로 한 번에 만든다.
 * 사용자가 확정하기 전에는 이 함수를 호출하지 않으며, 같은 영수증의 중복 확정도 막는다.
 */
export function confirmReceiptDraft(
  state: InventoryState,
  draft: ReceiptReviewDraft,
  context: ReceiptConfirmationContext,
): InventoryState {
  if (!canConfirmReceiptDraft(draft)) return state;

  const alreadyConfirmed = state.events.some(
    (event) => event.type === 'intake' && event.source === 'receipt' && event.receiptId === draft.batchId,
  );
  if (alreadyConfirmed) return state;

  const includedItems = getIncludedReceiptItems(draft);
  const items = includedItems.map<InventoryItem>((item) => ({
    id: `receipt-${draft.batchId}-${item.id}`,
    name: item.name.trim(),
    quantity: item.quantity.trim(),
    storage: item.storage,
    recommendedUseBy: item.recommendedUseBy,
    recommendedUseByAt: item.recommendedUseByAt,
    labelExpiryAt: item.labelExpiryAt,
    kind: item.kind,
    reason:
      item.confidence === 'needs-review'
        ? '영수증 AI 추정을 확인해 입고한 재고예요.'
        : '영수증에서 읽어 확인한 재고예요.',
    createdAt: context.occurredAt,
  }));
  const events = includedItems.map((item, index) => ({
    id: `intake-${draft.batchId}-${item.id}-${index}`,
    type: 'intake' as const,
    source: 'receipt' as const,
    receiptId: draft.batchId,
    inventoryItemId: `receipt-${draft.batchId}-${item.id}`,
    rawName: item.rawName,
    foodName: item.name.trim(),
    quantityLabel: item.quantity.trim(),
    occurredAt: context.occurredAt,
  }));

  return { ...state, items: [...items, ...state.items], events: [...state.events, ...events] };
}
