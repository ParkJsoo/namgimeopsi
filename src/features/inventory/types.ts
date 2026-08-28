export type StoragePlace = '냉장' | '냉동' | '실온';

export type InventoryKind = 'ingredient' | 'leftover';

export type FoodStatus = 'today' | 'soon' | 'relaxed';

export type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  storage: StoragePlace;
  /** 사용자가 정한 편의용 날짜 표현이며 식품 안전을 보장하지 않는다. */
  recommendedUseBy: string;
  /** 추천 로직에만 쓰는 ISO 날짜. 없으면 포장 표기일만 보조 기준으로 사용한다. */
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

/**
 * 숫자로 안전하게 환산할 수 없는 생활 단위는 그대로 남긴 채, 사용자가 전량 소비를 확정한 사실만 기록한다.
 * Supabase 전환 시 `inventory_events`의 소비 이벤트로 매핑할 로컬 MVP 원장이다.
 */
export type InventoryLedgerEvent = {
  id: string;
  type: 'consume-all';
  inventoryItemId: string;
  foodName: string;
  quantityLabel: string;
  occurredAt: string;
  recipeId?: string;
  recipeTitle?: string;
};

export type InventoryState = {
  version: 2;
  items: InventoryItem[];
  events: InventoryLedgerEvent[];
};

export const blankDraft: InventoryDraft = {
  name: '',
  quantity: '1인분',
  storage: '냉장',
  recommendedUseBy: '이틀 안',
  kind: 'ingredient',
};

export function getFoodStatus(item: InventoryItem): FoodStatus {
  if (item.recommendedUseBy === '오늘' || item.recommendedUseBy === '내일까지') return 'today';
  if (item.recommendedUseBy === '이틀 안' || item.recommendedUseBy === '이번 주') return 'soon';
  return 'relaxed';
}

export function getDateDescription(item: InventoryItem) {
  if (item.kind === 'leftover') {
    return item.storageStartedAt ? `냉장 보관 시작 ${item.storageStartedAt}` : '조리·보관 시작일을 확인해 주세요.';
  }
  return item.labelExpiryAt ? `포장 표기일 ${item.labelExpiryAt}` : '권장 섭취 시점을 정해 주세요.';
}
