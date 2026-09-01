import type { InventoryItem, InventoryLedgerEvent, InventoryState } from './types.ts';

export type InventorySyncOperation =
  | {
      id: string;
      type: 'upsert-items';
      items: InventoryItem[];
    }
  | {
      id: string;
      type: 'delete-item';
      itemId: string;
    }
  | {
      id: string;
      type: 'upsert-events';
      events: InventoryLedgerEvent[];
    }
  | {
      id: string;
      type: 'commit-receipt';
      receiptId: string;
      items: InventoryItem[];
      events: InventoryLedgerEvent[];
    };

export function parseInventorySyncQueue(value: unknown): InventorySyncOperation[] {
  if (!Array.isArray(value)) return [];
  return value.filter((operation): operation is InventorySyncOperation => {
    if (!operation || typeof operation !== 'object' || !('id' in operation) || !('type' in operation)) return false;
    return typeof operation.id === 'string' && typeof operation.type === 'string';
  });
}

function mergeItems(current: InventoryItem[], next: InventoryItem[]) {
  const items = new Map(current.map((item) => [item.id, item]));
  next.forEach((item) => items.set(item.id, item));
  return [...items.values()];
}

function mergeEvents(current: InventoryLedgerEvent[], next: InventoryLedgerEvent[]) {
  const events = new Map(current.map((event) => [event.id, event]));
  next.forEach((event) => events.set(event.id, event));
  return [...events.values()];
}

/** 원격 상태 위에 아직 전송하지 못한 로컬 변경만 순서대로 다시 적용한다. */
export function applyPendingInventorySync(remote: InventoryState, operations: InventorySyncOperation[]): InventoryState {
  return operations.reduce<InventoryState>((state, operation) => {
    switch (operation.type) {
      case 'upsert-items':
        return { ...state, items: mergeItems(state.items, operation.items) };
      case 'delete-item':
        return { ...state, items: state.items.filter((item) => item.id !== operation.itemId) };
      case 'upsert-events':
        return { ...state, events: mergeEvents(state.events, operation.events) };
      case 'commit-receipt':
        return {
          ...state,
          items: mergeItems(state.items, operation.items),
          events: mergeEvents(state.events, operation.events),
        };
    }
  }, remote);
}

/** 기존 로컬 재고를 처음 원격에 이관할 때도 완전한 영수증 batch는 같은 RPC로 보낸다. */
export function createBootstrapInventorySyncOperations(state: InventoryState): InventorySyncOperation[] {
  const operations: InventorySyncOperation[] = [];
  const receiptEvents = state.events.filter(
    (event): event is Extract<InventoryLedgerEvent, { type: 'intake' }> => event.type === 'intake' && event.source === 'receipt',
  );
  const eventsByReceiptId = new Map<string, InventoryLedgerEvent[]>();
  receiptEvents.forEach((event) => {
    const events = eventsByReceiptId.get(event.receiptId) ?? [];
    events.push(event);
    eventsByReceiptId.set(event.receiptId, events);
  });

  const receiptItemIds = new Set<string>();
  const committedReceiptEventIds = new Set<string>();
  eventsByReceiptId.forEach((events, receiptId) => {
    const items = state.items.filter((item) => events.some((event) => event.inventoryItemId === item.id));
    const eventItemIds = new Set(events.map((event) => event.inventoryItemId));
    const hasOneToOneLotMapping =
      items.length === events.length
      && eventItemIds.size === events.length
      && items.every((item) => eventItemIds.has(item.id));
    if (!hasOneToOneLotMapping) return;

    items.forEach((item) => receiptItemIds.add(item.id));
    events.forEach((event) => committedReceiptEventIds.add(event.id));
    operations.push({ id: `bootstrap-receipt-${receiptId}`, type: 'commit-receipt', receiptId, items, events });
  });

  const remainingItems = state.items.filter((item) => !receiptItemIds.has(item.id));
  // 일부 lot가 삭제된 legacy batch는 RPC의 일대일 검증을 통과하지 못한다.
  // 그 경우에도 기존 intake 원장은 recovery upsert로 보존한다.
  const remainingEvents = state.events.filter((event) => !committedReceiptEventIds.has(event.id));
  if (remainingItems.length) operations.unshift({ id: 'bootstrap-items', type: 'upsert-items', items: remainingItems });
  if (remainingEvents.length) operations.push({ id: 'bootstrap-events', type: 'upsert-events', events: remainingEvents });
  return operations;
}
