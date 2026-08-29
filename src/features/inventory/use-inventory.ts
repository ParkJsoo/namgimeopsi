import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import {
  completeInventoryItems,
  getActiveInventoryItems,
  mergeMissingRecommendationDates,
  parseInventoryState,
  type CompletionContext,
} from './ledger';
import { seedInventory } from './seed';
import type { InventoryDraft, InventoryItem, InventoryState } from './types';
import {
  confirmReceiptDraft,
  isReceiptDraftAlreadyConfirmed,
  type ReceiptConfirmationResult,
} from '../receipts/confirm-receipt';
import type { ReceiptReviewDraft } from '../receipts/types';

const storageKey = 'namgimeopsi.inventory.v2';
const legacyStorageKey = 'namgimeopsi.inventory.v1';

function createItem(draft: InventoryDraft): InventoryItem {
  const isLeftover = draft.kind === 'leftover';
  return {
    id: `inventory-${Date.now()}`,
    ...draft,
    name: draft.name.trim(),
    reason: isLeftover ? '방금 보관을 시작한 남은 음식이에요.' : '직접 추가한 재고예요.',
    storageStartedAt: isLeftover ? '지금' : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function useInventory() {
  const [state, setState] = useState<InventoryState>({ version: 2, items: [], events: [] });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        const legacySaved = saved ? null : await AsyncStorage.getItem(legacyStorageKey);
        const parsed = saved || legacySaved ? parseInventoryState(JSON.parse(saved ?? legacySaved ?? 'null')) : null;
        const nextState = mergeMissingRecommendationDates(
          parsed ?? { version: 2, items: seedInventory, events: [] },
          seedInventory,
        );
        if (!saved || nextState !== parsed) void AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
        if (isMounted) setState(nextState);
      } catch {
        if (isMounted) setState({ version: 2, items: seedInventory, events: [] });
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const commit = (nextState: InventoryState) => {
    setState(nextState);
    void AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
  };

  const add = (draft: InventoryDraft) => commit({ ...state, items: [createItem(draft), ...state.items] });

  const update = (id: string, draft: InventoryDraft) =>
    commit(
      {
        ...state,
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...draft,
                name: draft.name.trim(),
                reason: '직접 수정한 재고예요.',
                storageStartedAt:
                  draft.kind === 'leftover' ? item.storageStartedAt ?? '지금' : undefined,
              }
            : item,
        ),
      },
    );

  const remove = (id: string) => commit({ ...state, items: state.items.filter((item) => item.id !== id) });

  const consumeAll = (itemIds: string[], context: Omit<CompletionContext, 'occurredAt'> = {}) =>
    commit(completeInventoryItems(state, itemIds, { ...context, occurredAt: new Date().toISOString() }));

  /** 저장 결과를 구분해, 완료·중복·오류를 사용자에게 각각 알릴 수 있게 한다. */
  const confirmReceipt = async (draft: ReceiptReviewDraft): Promise<ReceiptConfirmationResult> => {
    if (isReceiptDraftAlreadyConfirmed(state, draft)) return 'already-confirmed';

    const nextState = confirmReceiptDraft(state, draft, { occurredAt: new Date().toISOString() });
    if (nextState === state) return 'failed';

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
      setState(nextState);
      return 'confirmed';
    } catch {
      return 'failed';
    }
  };

  return {
    items: getActiveInventoryItems(state),
    allItems: state.items,
    events: state.events,
    isReady,
    add,
    update,
    remove,
    consumeAll,
    confirmReceipt,
  };
}
