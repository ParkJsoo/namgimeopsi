export type StoragePlace = '냉장' | '냉동' | '실온';

export type InventoryKind = 'ingredient' | 'leftover';

export type FoodStatus = import('../domain/date-status').ConsumptionStatus;
export { getFoodStatus, getDateDescription } from './dates';

export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  storage: StoragePlace;
  /** 사용자가 정한 편의용 날짜 표현이며 식품 안전을 보장하지 않는다. */
  recommendedUseBy: string;
  /** 표시·정렬·추천에 함께 쓰는 ISO 날짜. 없으면 유효한 포장 표기일만 보조 기준으로 사용한다. */
  recommendedUseByAt?: string;
  reason: string;
  kind: InventoryKind;
  purchasedAt?: string;
  storageStartedAt?: string;
  labelExpiryAt?: string;
  createdAt: string;
};

export type InventoryDraft = Pick<
  InventoryItem,
  'name' | 'quantity' | 'storage' | 'recommendedUseBy' | 'kind'
>;

export type ConsumeAllInventoryEvent = {
  id: string;
  type: 'consume-all';
  inventoryItemId: string;
  foodName: string;
  quantityLabel: string;
  occurredAt: string;
  recipeId?: string;
  recipeTitle?: string;
  cookingSessionId?: string;
};

/** 실제 사용 뒤 사용자가 확인한 남은 생활 단위를 보존하는 부분 소비 원장이다. */
export type ConsumeInventoryEvent = {
  id: string;
  type: 'consume';
  inventoryItemId: string;
  foodName: string;
  /** 숫자 환산을 강요하지 않아 `일부 사용`처럼 기록한다. */
  quantityLabel: string;
  remainingQuantityLabel: string;
  occurredAt: string;
  recipeId?: string;
  recipeTitle?: string;
  cookingSessionId?: string;
};

/** 영수증 검수를 사용자가 확정한 뒤에만 남기는 입고 원장이다. */
export type ReceiptIntakeInventoryEvent = {
  id: string;
  type: 'intake';
  source: 'receipt';
  receiptId: string;
  inventoryItemId: string;
  rawName: string;
  foodName: string;
  quantityLabel: string;
  occurredAt: string;
};

export type InventoryLedgerEvent = ConsumeAllInventoryEvent | ConsumeInventoryEvent | ReceiptIntakeInventoryEvent;

export type InventoryState = {
  version: 2;
  items: InventoryItem[];
  events: InventoryLedgerEvent[];
};

export const blankDraft: InventoryDraft = {
  name: '',
  quantity: '1인분',
  storage: '냉장',
  recommendedUseBy: '',
  kind: 'ingredient',
};
