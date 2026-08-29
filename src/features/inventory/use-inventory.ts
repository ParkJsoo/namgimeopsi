import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { completeInventoryItems, getActiveInventoryItems, mergeMissingRecommendationDates, parseInventoryState, type CompletionContext } from './ledger';
import { seedInventory } from './seed';
import { deleteInventoryItem, ensureInventoryUser, loadRemoteInventory, upsertInventoryEvents, upsertInventoryItems } from './supabase-store';
import type { InventoryDraft, InventoryItem, InventoryState } from './types';
import { confirmReceiptDraft, isReceiptDraftAlreadyConfirmed, type ReceiptConfirmationResult } from '../receipts/confirm-receipt';
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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      try {
        const [saved, legacySaved] = await Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(legacyStorageKey)]);
        const parsed = saved || legacySaved ? parseInventoryState(JSON.parse(saved ?? legacySaved ?? 'null')) : null;
        const localState = mergeMissingRecommendationDates(parsed ?? { version: 2, items: seedInventory, events: [] }, seedInventory);
        const nextUser = await ensureInventoryUser();
        const remoteState = await loadRemoteInventory();
        const nextState = remoteState.items.length || remoteState.events.length ? remoteState : localState;
        if (!remoteState.items.length && !remoteState.events.length) {
          await Promise.all([upsertInventoryItems(nextUser, nextState.items), upsertInventoryEvents(nextUser, nextState.events)]);
        }
        void AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
        if (isMounted) {
          setUser(nextUser);
          setState(nextState);
        }
      } catch {
        if (isMounted) setState({ version: 2, items: seedInventory, events: [] });
      } finally {
        if (isMounted) setIsReady(true);
      }
    }
    void hydrate();
    return () => { isMounted = false; };
  }, []);

  const persistLocal = (nextState: InventoryState) => {
    void AsyncStorage.setItem(storageKey, JSON.stringify(nextState));
  };
  const publish = (operation: Promise<unknown>) => { void operation.catch(() => undefined); };
  const add = (draft: InventoryDraft) => {
    const item = createItem(draft);
    const nextState = { ...state, items: [item, ...state.items] };
    setState(nextState);
    persistLocal(nextState);
    if (user) publish(upsertInventoryItems(user, [item]));
  };
  const update = (id: string, draft: InventoryDraft) => {
    let changedItem: InventoryItem | undefined;
    const items = state.items.map((item) => {
      if (item.id !== id) return item;
      changedItem = { ...item, ...draft, name: draft.name.trim(), reason: '직접 수정한 재고예요.', storageStartedAt: draft.kind === 'leftover' ? item.storageStartedAt ?? '지금' : undefined };
      return changedItem;
    });
    const nextState = { ...state, items };
    setState(nextState);
    persistLocal(nextState);
    if (user && changedItem) publish(upsertInventoryItems(user, [changedItem]));
  };
  const remove = (id: string) => {
    const nextState = { ...state, items: state.items.filter((item) => item.id !== id) };
    setState(nextState);
    persistLocal(nextState);
    if (user) publish(deleteInventoryItem(id));
  };
  const consumeAll = (itemIds: string[], context: Omit<CompletionContext, 'occurredAt'> = {}) => {
    const nextState = completeInventoryItems(state, itemIds, { ...context, occurredAt: new Date().toISOString() });
    setState(nextState);
    persistLocal(nextState);
    if (user && nextState !== state) publish(upsertInventoryEvents(user, nextState.events.slice(state.events.length)));
  };
  const confirmReceipt = async (draft: ReceiptReviewDraft): Promise<ReceiptConfirmationResult> => {
    if (!user) return 'failed';
    if (isReceiptDraftAlreadyConfirmed(state, draft)) return 'already-confirmed';
    const nextState = confirmReceiptDraft(state, draft, { occurredAt: new Date().toISOString() });
    if (nextState === state) return 'failed';
    try {
      await Promise.all([
        upsertInventoryItems(user, nextState.items.filter((item) => !state.items.some((current) => current.id === item.id))),
        upsertInventoryEvents(user, nextState.events.slice(state.events.length)),
      ]);
      setState(nextState);
      persistLocal(nextState);
      return 'confirmed';
    } catch { return 'failed'; }
  };
  return { items: getActiveInventoryItems(state), allItems: state.items, events: state.events, isReady, add, update, remove, consumeAll, confirmReceipt };
}
