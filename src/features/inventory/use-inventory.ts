import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import { useEffect, useRef, useState } from 'react';

import { completeInventoryItems, getActiveInventoryItems, mergeMissingRecommendationDates, parseInventoryState, type CompletionContext } from './ledger';
import { seedInventory } from './seed';
import { applyPendingInventorySync, createBootstrapInventorySyncOperations, parseInventorySyncQueue, type InventorySyncOperation } from './sync-queue';
import { commitReceiptIntake, deleteInventoryItem, ensureInventoryUser, loadRemoteInventory, upsertInventoryEvents, upsertInventoryItems } from './supabase-store';
import type { InventoryDraft, InventoryItem, InventoryState } from './types';
import { confirmReceiptDraft, isReceiptDraftAlreadyConfirmed, type ReceiptConfirmationResult } from '../receipts/confirm-receipt';
import type { ReceiptReviewDraft } from '../receipts/types';

const storageKey = 'namgimeopsi.inventory.v2';
const legacyStorageKey = 'namgimeopsi.inventory.v1';
const syncQueueKey = 'namgimeopsi.inventory.sync-queue.v1';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

let operationSequence = 0;

function createOperationId(type: InventorySyncOperation['type']) {
  operationSequence += 1;
  return `${type}-${Date.now()}-${operationSequence}`;
}

function parseStoredJson(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

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

/** 로컬 변경을 먼저 영속하고, 같은 순서의 outbox를 하나씩 원격에 반영한다. */
export function useInventory() {
  const [state, setState] = useState<InventoryState>({ version: 2, items: [], events: [] });
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const stateRef = useRef(state);
  const userRef = useRef<User | null>(null);
  const queueRef = useRef<InventorySyncOperation[]>([]);
  const isFlushingRef = useRef(false);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  const setCurrentState = (nextState: InventoryState) => {
    stateRef.current = nextState;
    setState(nextState);
  };

  const persist = (nextState: InventoryState, nextQueue: InventorySyncOperation[]) => {
    const write = async () => {
      await AsyncStorage.multiSet([
        [storageKey, JSON.stringify(nextState)],
        [syncQueueKey, JSON.stringify(nextQueue)],
      ]);
    };
    writeChainRef.current = writeChainRef.current.then(write, write);
    return writeChainRef.current;
  };

  async function executeSyncOperation(user: User, operation: InventorySyncOperation) {
    switch (operation.type) {
      case 'upsert-items':
        return upsertInventoryItems(user, operation.items);
      case 'delete-item':
        return deleteInventoryItem(operation.itemId);
      case 'upsert-events':
        return upsertInventoryEvents(user, operation.events);
      case 'commit-receipt':
        return commitReceiptIntake(operation.receiptId, operation.items, operation.events, operation.scanJobId);
    }
  }

  async function flushSyncQueue() {
    if (isFlushingRef.current) return;
    if (!queueRef.current.length) {
      setSyncStatus('synced');
      return;
    }

    isFlushingRef.current = true;
    setSyncStatus('syncing');
    try {
      await writeChainRef.current;
      const user = userRef.current ?? await ensureInventoryUser();
      userRef.current = user;

      while (queueRef.current.length) {
        const operation = queueRef.current[0];
        if (!operation) break;
        await executeSyncOperation(user, operation);
        const nextQueue = queueRef.current.slice(1);
        queueRef.current = nextQueue;
        await persist(stateRef.current, nextQueue);
      }
      setSyncStatus('synced');
    } catch {
      // 로컬 상태와 queue는 이미 저장돼 있어 다음 실행 또는 재시도에서 이어서 전송한다.
      setSyncStatus('error');
    } finally {
      isFlushingRef.current = false;
    }
  }

  const queueLocalChange = (nextState: InventoryState, operation: InventorySyncOperation) => {
    const nextQueue = [...queueRef.current, operation];
    queueRef.current = nextQueue;
    setCurrentState(nextState);
    setSyncStatus('syncing');
    return persist(nextState, nextQueue).then(() => flushSyncQueue());
  };

  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      const [saved, legacySaved, savedQueue] = await Promise.all([
        AsyncStorage.getItem(storageKey),
        AsyncStorage.getItem(legacyStorageKey),
        AsyncStorage.getItem(syncQueueKey),
      ]);
      const parsed = parseInventoryState(parseStoredJson(saved ?? legacySaved));
      const localState = mergeMissingRecommendationDates(parsed ?? { version: 2, items: seedInventory, events: [] }, seedInventory);
      const savedOperations = parseInventorySyncQueue(parseStoredJson(savedQueue));

      // 원격 요청보다 로컬 cache를 먼저 기준으로 잡아, 요청 실패가 기존 재고를 지우지 못하게 한다.
      stateRef.current = localState;
      queueRef.current = savedOperations;
      if (isMounted) setState(localState);

      try {
        const user = await ensureInventoryUser();
        userRef.current = user;
        const remoteState = await loadRemoteInventory();
        const remoteHasData = remoteState.items.length > 0 || remoteState.events.length > 0;
        const nextState = remoteHasData ? applyPendingInventorySync(remoteState, savedOperations) : localState;
        const nextQueue = savedOperations.length || remoteHasData
          ? savedOperations
          : createBootstrapInventorySyncOperations(localState);

        stateRef.current = nextState;
        queueRef.current = nextQueue;
        await persist(nextState, nextQueue);
        if (isMounted) setState(nextState);
        void flushSyncQueue();
      } catch {
        const nextQueue = savedOperations.length ? savedOperations : createBootstrapInventorySyncOperations(localState);
        queueRef.current = nextQueue;
        void persist(localState, nextQueue);
        if (isMounted) setSyncStatus('offline');
      } finally {
        if (isMounted) setIsReady(true);
      }
    }
    void hydrate();
    return () => { isMounted = false; };
    // outbox와 flush 함수는 ref를 통해 최신 값만 읽으므로 hydrate는 마운트 시 한 번만 시작한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const add = (draft: InventoryDraft) => {
    const item = createItem(draft);
    const nextState = { ...stateRef.current, items: [item, ...stateRef.current.items] };
    void queueLocalChange(nextState, { id: createOperationId('upsert-items'), type: 'upsert-items', items: [item] }).catch(() => setSyncStatus('error'));
  };

  const update = (id: string, draft: InventoryDraft) => {
    let changedItem: InventoryItem | undefined;
    const items = stateRef.current.items.map((item) => {
      if (item.id !== id) return item;
      changedItem = {
        ...item,
        ...draft,
        name: draft.name.trim(),
        reason: '직접 수정한 재고예요.',
        storageStartedAt: draft.kind === 'leftover' ? item.storageStartedAt ?? '지금' : undefined,
      };
      return changedItem;
    });
    if (!changedItem) return;
    const nextState = { ...stateRef.current, items };
    void queueLocalChange(nextState, { id: createOperationId('upsert-items'), type: 'upsert-items', items: [changedItem] }).catch(() => setSyncStatus('error'));
  };

  const remove = (id: string) => {
    const nextState = { ...stateRef.current, items: stateRef.current.items.filter((item) => item.id !== id) };
    void queueLocalChange(nextState, { id: createOperationId('delete-item'), type: 'delete-item', itemId: id }).catch(() => setSyncStatus('error'));
  };

  const consumeAll = (itemIds: string[], context: Omit<CompletionContext, 'occurredAt'> = {}) => {
    const previousState = stateRef.current;
    const nextState = completeInventoryItems(previousState, itemIds, { ...context, occurredAt: new Date().toISOString() });
    const newEvents = nextState.events.slice(previousState.events.length);
    if (!newEvents.length) return;
    void queueLocalChange(nextState, { id: createOperationId('upsert-events'), type: 'upsert-events', events: newEvents }).catch(() => setSyncStatus('error'));
  };

  const confirmReceipt = async (draft: ReceiptReviewDraft): Promise<ReceiptConfirmationResult> => {
    const previousState = stateRef.current;
    if (isReceiptDraftAlreadyConfirmed(previousState, draft)) return 'already-confirmed';
    const nextState = confirmReceiptDraft(previousState, draft, { occurredAt: new Date().toISOString() });
    if (nextState === previousState) return 'failed';
    const newItems = nextState.items.filter((item) => !previousState.items.some((current) => current.id === item.id));
    const newEvents = nextState.events.slice(previousState.events.length);
    try {
      await queueLocalChange(nextState, {
        id: createOperationId('commit-receipt'),
        type: 'commit-receipt',
        receiptId: draft.batchId,
        scanJobId: draft.scanJobId,
        items: newItems,
        events: newEvents,
      });
      return 'confirmed';
    } catch {
      return 'failed';
    }
  };

  const retrySync = () => { void flushSyncQueue(); };

  return {
    items: getActiveInventoryItems(state),
    allItems: state.items,
    events: state.events,
    isReady,
    syncStatus,
    add,
    update,
    remove,
    consumeAll,
    confirmReceipt,
    retrySync,
  };
}
