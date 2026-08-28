import type { InventoryItem, InventoryLedgerEvent, InventoryState } from './types.ts';

export type CompletionContext = Pick<InventoryLedgerEvent, 'occurredAt' | 'recipeId' | 'recipeTitle'>;

function getConsumedItemIds(events: InventoryLedgerEvent[]) {
  return new Set(events.filter((event) => event.type === 'consume-all').map((event) => event.inventoryItemId));
}

/** 전량 소비가 기록된 lot만 활성 재고에서 제외한다. 원장 이벤트 자체는 보존한다. */
export function getActiveInventoryItems(state: InventoryState): InventoryItem[] {
  const consumedItemIds = getConsumedItemIds(state.events);
  return state.items.filter((item) => !consumedItemIds.has(item.id));
}

/**
 * 수량 문자열을 임의로 수치화하지 않는다. 사용자가 `다 먹음`을 확정한 lot에만 consume-all 이벤트를 추가한다.
 */
export function completeInventoryItems(
  state: InventoryState,
  itemIds: string[],
  context: CompletionContext,
): InventoryState {
  const activeById = new Map(getActiveInventoryItems(state).map((item) => [item.id, item]));
  const uniqueItemIds = [...new Set(itemIds)];
  const completedItems = uniqueItemIds
    .map((itemId) => activeById.get(itemId))
    .filter((item): item is InventoryItem => item !== undefined);

  if (!completedItems.length) return state;

  const events = completedItems.map<InventoryLedgerEvent>((item, index) => ({
    id: `consume-all-${context.occurredAt}-${item.id}-${index}`,
    type: 'consume-all',
    inventoryItemId: item.id,
    foodName: item.name,
    quantityLabel: item.quantity,
    occurredAt: context.occurredAt,
    recipeId: context.recipeId,
    recipeTitle: context.recipeTitle,
  }));

  return { ...state, events: [...state.events, ...events] };
}

/** AsyncStorage v1 배열과 v2 객체를 모두 읽는다. */
export function parseInventoryState(value: unknown): InventoryState | null {
  if (Array.isArray(value)) {
    return { version: 2, items: value as InventoryItem[], events: [] };
  }
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<InventoryState>;
  if (candidate.version === 2 && Array.isArray(candidate.items) && Array.isArray(candidate.events)) {
    return { version: 2, items: candidate.items, events: candidate.events };
  }
  return null;
}
