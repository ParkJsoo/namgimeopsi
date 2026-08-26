import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { seedInventory } from './seed';
import type { InventoryDraft, InventoryItem } from './types';

const storageKey = 'namgimeopsi.inventory.v1';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        const parsed = saved ? (JSON.parse(saved) as InventoryItem[]) : seedInventory;
        if (isMounted) setItems(Array.isArray(parsed) ? parsed : seedInventory);
      } catch {
        if (isMounted) setItems(seedInventory);
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const commit = (nextItems: InventoryItem[]) => {
    setItems(nextItems);
    void AsyncStorage.setItem(storageKey, JSON.stringify(nextItems));
  };

  const add = (draft: InventoryDraft) => commit([createItem(draft), ...items]);

  const update = (id: string, draft: InventoryDraft) =>
    commit(
      items.map((item) =>
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
    );

  const remove = (id: string) => commit(items.filter((item) => item.id !== id));

  return { items, isReady, add, update, remove };
}
