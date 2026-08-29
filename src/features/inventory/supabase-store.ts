import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { InventoryItem, InventoryLedgerEvent, InventoryState } from './types';

type InventoryItemRow = {
  id: string;
  name: string;
  quantity: string;
  storage: InventoryItem['storage'];
  recommended_use_by: string;
  recommended_use_by_at: string | null;
  reason: string;
  kind: InventoryItem['kind'];
  purchased_at: string | null;
  storage_started_at: string | null;
  label_expiry_at: string | null;
  created_at: string;
};

type InventoryEventRow = {
  id: string;
  type: InventoryLedgerEvent['type'];
  inventory_item_id: string;
  food_name: string;
  quantity_label: string;
  occurred_at: string;
  recipe_id: string | null;
  recipe_title: string | null;
  source: 'receipt' | null;
  receipt_id: string | null;
  raw_name: string | null;
};

function toItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    storage: row.storage,
    recommendedUseBy: row.recommended_use_by,
    recommendedUseByAt: row.recommended_use_by_at ?? undefined,
    reason: row.reason,
    kind: row.kind,
    purchasedAt: row.purchased_at ?? undefined,
    storageStartedAt: row.storage_started_at ?? undefined,
    labelExpiryAt: row.label_expiry_at ?? undefined,
    createdAt: row.created_at,
  };
}

function toEvent(row: InventoryEventRow): InventoryLedgerEvent {
  if (row.type === 'intake') {
    return {
      id: row.id,
      type: 'intake',
      source: 'receipt',
      receiptId: row.receipt_id ?? '',
      inventoryItemId: row.inventory_item_id,
      rawName: row.raw_name ?? row.food_name,
      foodName: row.food_name,
      quantityLabel: row.quantity_label,
      occurredAt: row.occurred_at,
    };
  }

  return {
    id: row.id,
    type: 'consume-all',
    inventoryItemId: row.inventory_item_id,
    foodName: row.food_name,
    quantityLabel: row.quantity_label,
    occurredAt: row.occurred_at,
    recipeId: row.recipe_id ?? undefined,
    recipeTitle: row.recipe_title ?? undefined,
  };
}

function itemRow(user: User, item: InventoryItem) {
  return {
    user_id: user.id,
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    storage: item.storage,
    recommended_use_by: item.recommendedUseBy,
    recommended_use_by_at: item.recommendedUseByAt ?? null,
    reason: item.reason,
    kind: item.kind,
    purchased_at: item.purchasedAt ?? null,
    storage_started_at: item.storageStartedAt ?? null,
    label_expiry_at: item.labelExpiryAt ?? null,
    created_at: item.createdAt,
  };
}

function eventRow(user: User, event: InventoryLedgerEvent) {
  return {
    user_id: user.id,
    id: event.id,
    type: event.type,
    inventory_item_id: event.inventoryItemId,
    food_name: event.foodName,
    quantity_label: event.quantityLabel,
    occurred_at: event.occurredAt,
    recipe_id: event.type === 'consume-all' ? event.recipeId ?? null : null,
    recipe_title: event.type === 'consume-all' ? event.recipeTitle ?? null : null,
    source: event.type === 'intake' ? event.source : null,
    receipt_id: event.type === 'intake' ? event.receiptId : null,
    raw_name: event.type === 'intake' ? event.rawName : null,
  };
}

export async function ensureInventoryUser() {
  const { data, error } = await supabase.auth.getUser();
  if (data.user) return data.user;
  if (error && error.name !== 'AuthSessionMissingError') throw error;

  const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
  if (anonymousError || !anonymousData.user) throw anonymousError ?? new Error('익명 사용자를 만들지 못했어요.');
  return anonymousData.user;
}

export async function loadRemoteInventory() {
  const [itemsResult, eventsResult] = await Promise.all([
    supabase.from('inventory_items').select('*').order('created_at', { ascending: false }),
    supabase.from('inventory_events').select('*').order('occurred_at', { ascending: true }),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  return {
    version: 2 as const,
    items: (itemsResult.data as InventoryItemRow[]).map(toItem),
    events: (eventsResult.data as InventoryEventRow[]).map(toEvent),
  } satisfies InventoryState;
}

export async function upsertInventoryItems(user: User, items: InventoryItem[]) {
  if (!items.length) return;
  const { error } = await supabase.from('inventory_items').upsert(items.map((item) => itemRow(user, item)), { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertInventoryEvents(user: User, events: InventoryLedgerEvent[]) {
  if (!events.length) return;
  const { error } = await supabase.from('inventory_events').upsert(events.map((event) => eventRow(user, event)), { onConflict: 'user_id,id' });
  if (error) throw error;
}
