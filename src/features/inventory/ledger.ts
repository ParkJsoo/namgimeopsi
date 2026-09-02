import type { InventoryItem, InventoryLedgerEvent, InventoryState } from './types.ts';

export type CompletionContext = {
  occurredAt: string;
  recipeId?: string;
  recipeTitle?: string;
};

export type CookingSessionContext = CompletionContext & {
  sessionId: string;
};

export type CookingConsumption = {
  itemId: string;
  /** `all`은 lot를 소진 처리하고, `remaining`은 사용 뒤 남은 생활 단위를 기록한다. */
  mode: 'all' | 'remaining';
  remainingQuantity?: string;
};

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

/**
 * 조리 완료 시 사용자가 확인한 결과만 반영한다. `반 봉지`, `조금 남음` 같은
 * 생활 단위를 계산하거나 다른 단위로 환산하지 않고, 남은 양을 그대로 다음 재고값으로 쓴다.
 */
export function completeCookingSession(
  state: InventoryState,
  consumptions: CookingConsumption[],
  context: CookingSessionContext,
): InventoryState {
  const activeById = new Map(getActiveInventoryItems(state).map((item) => [item.id, item]));
  const uniqueConsumptions = new Map(consumptions.map((consumption) => [consumption.itemId, consumption]));
  const changedItems = new Map<string, InventoryItem>();
  const events: InventoryLedgerEvent[] = [];

  uniqueConsumptions.forEach((consumption, itemId) => {
    const item = activeById.get(itemId);
    if (!item) return;

    if (consumption.mode === 'all') {
      events.push({
        id: `consume-all-${context.sessionId}-${item.id}`,
        type: 'consume-all',
        inventoryItemId: item.id,
        foodName: item.name,
        quantityLabel: item.quantity,
        occurredAt: context.occurredAt,
        recipeId: context.recipeId,
        recipeTitle: context.recipeTitle,
        cookingSessionId: context.sessionId,
      });
      return;
    }

    const remainingQuantity = consumption.remainingQuantity?.trim();
    if (!remainingQuantity || remainingQuantity === item.quantity) return;
    changedItems.set(item.id, { ...item, quantity: remainingQuantity });
    events.push({
      id: `consume-${context.sessionId}-${item.id}`,
      type: 'consume',
      inventoryItemId: item.id,
      foodName: item.name,
      quantityLabel: '일부 사용',
      remainingQuantityLabel: remainingQuantity,
      occurredAt: context.occurredAt,
      recipeId: context.recipeId,
      recipeTitle: context.recipeTitle,
      cookingSessionId: context.sessionId,
    });
  });

  if (!events.length) return state;
  return {
    ...state,
    items: state.items.map((item) => changedItems.get(item.id) ?? item),
    events: [...state.events, ...events],
  };
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

/** 기존 시드 재고에는 표시 문구만 저장돼 있었으므로, 같은 lot ID에 한해 ISO 추천일 메타데이터를 보완한다. */
export function mergeMissingRecommendationDates(state: InventoryState, seedItems: InventoryItem[]): InventoryState {
  const seedItemsById = new Map(seedItems.map((item) => [item.id, item]));
  let hasChanges = false;
  const items = state.items.map((item) => {
    const seedItem = seedItemsById.get(item.id);
    if (item.recommendedUseByAt || !seedItem?.recommendedUseByAt) return item;
    hasChanges = true;
    return { ...item, recommendedUseByAt: seedItem.recommendedUseByAt };
  });

  return hasChanges ? { ...state, items } : state;
}
