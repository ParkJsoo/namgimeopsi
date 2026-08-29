import type { InventoryKind, StoragePlace } from '../inventory/types.ts';

/**
 * 로컬 포트폴리오 데모에서 AI가 읽은 것처럼 보여 주는 영수증 후보다.
 * 원문과 AI가 정리한 값을 함께 보관해 사용자가 결과를 검수할 수 있게 한다.
 */
export type ReceiptDraftItem = {
  id: string;
  rawName: string;
  name: string;
  quantity: string;
  storage: StoragePlace;
  kind: InventoryKind;
  /** 영수증에 인쇄된 포장 표기일. 구매일/보관 시작일과 혼용하지 않는다. */
  labelExpiryAt?: string;
  /** 사용자가 보기 쉬운 권장 섭취 시점 문구. */
  recommendedUseBy: string;
  /** 추천 순위에만 사용할 수 있는 ISO 권장 섭취일. */
  recommendedUseByAt?: string;
  confidence: 'high' | 'needs-review';
  included: boolean;
};

export type ReceiptReviewDraft = {
  batchId: string;
  sourceLabel: string;
  items: ReceiptDraftItem[];
};
