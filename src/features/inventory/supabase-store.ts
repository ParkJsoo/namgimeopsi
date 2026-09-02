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
  cooking_session_id: string | null;
  remaining_quantity_label: string | null;
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

  if (row.type === 'consume') {
    return {
      id: row.id,
      type: 'consume',
      inventoryItemId: row.inventory_item_id,
      foodName: row.food_name,
      quantityLabel: row.quantity_label,
      remainingQuantityLabel: row.remaining_quantity_label ?? '',
      occurredAt: row.occurred_at,
      recipeId: row.recipe_id ?? undefined,
      recipeTitle: row.recipe_title ?? undefined,
      cookingSessionId: row.cooking_session_id ?? undefined,
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
    cookingSessionId: row.cooking_session_id ?? undefined,
  };
}

function itemRow(userId: string, item: InventoryItem) {
  return {
    user_id: userId,
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

function eventRow(userId: string, event: InventoryLedgerEvent) {
  return {
    user_id: userId,
    id: event.id,
    type: event.type,
    inventory_item_id: event.inventoryItemId,
    food_name: event.foodName,
    quantity_label: event.quantityLabel,
    occurred_at: event.occurredAt,
    recipe_id: event.type === 'consume-all' || event.type === 'consume' ? event.recipeId ?? null : null,
    recipe_title: event.type === 'consume-all' || event.type === 'consume' ? event.recipeTitle ?? null : null,
    cooking_session_id: event.type === 'consume-all' || event.type === 'consume' ? event.cookingSessionId ?? null : null,
    remaining_quantity_label: event.type === 'consume' ? event.remainingQuantityLabel : null,
    source: event.type === 'intake' ? event.source : null,
    receipt_id: event.type === 'intake' ? event.receiptId : null,
    raw_name: event.type === 'intake' ? event.rawName : null,
  };
}

function receiptItemPayload(item: InventoryItem) {
  const { user_id: _userId, ...payload } = itemRow('', item);
  return payload;
}

function receiptEventPayload(event: InventoryLedgerEvent) {
  const { user_id: _userId, ...payload } = eventRow('', event);
  return payload;
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
  const { error } = await supabase.from('inventory_items').upsert(items.map((item) => itemRow(user.id, item)), { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertInventoryEvents(user: User, events: InventoryLedgerEvent[]) {
  if (!events.length) return;
  const { error } = await supabase.from('inventory_events').upsert(events.map((event) => eventRow(user.id, event)), { onConflict: 'user_id,id' });
  if (error) throw error;
}

/** 영수증에서 만든 lot와 입고 원장을 Postgres 함수 하나로 확정한다. */
export async function commitReceiptIntake(receiptId: string, items: InventoryItem[], events: InventoryLedgerEvent[], scanJobId?: string) {
  const rpcName = scanJobId ? 'commit_receipt_scan_intake' : 'commit_receipt_intake';
  const args = {
    p_receipt_id: receiptId,
    p_items: items.map(receiptItemPayload),
    p_events: events.map(receiptEventPayload),
    ...(scanJobId ? { p_scan_id: scanJobId } : {}),
  };
  const { data, error } = await supabase.rpc(rpcName, args);
  if (error) throw error;
  if (data !== 'confirmed' && data !== 'already-confirmed') {
    throw new Error('영수증 입고 결과를 확인하지 못했어요.');
  }
  return data;
}

/** 조리 세션과 부분/전량 소비를 하나의 RPC로 확정해 재고와 원장의 불일치를 막는다. */
export async function commitCookingSession(events: InventoryLedgerEvent[]) {
  const consumptionEvents = events.filter(
    (event): event is Extract<InventoryLedgerEvent, { type: 'consume' | 'consume-all' }> =>
      event.type === 'consume' || event.type === 'consume-all',
  );
  const firstEvent = consumptionEvents[0];
  if (!firstEvent?.cookingSessionId) throw new Error('조리 세션 정보를 확인하지 못했어요.');

  const { data, error } = await supabase.rpc('complete_cooking_session', {
    p_session_id: firstEvent.cookingSessionId,
    p_recipe_id: firstEvent.recipeId ?? null,
    p_recipe_title: firstEvent.recipeTitle ?? null,
    p_completed_at: firstEvent.occurredAt,
    p_items: consumptionEvents.map((event) => ({
      id: event.id,
      inventory_item_id: event.inventoryItemId,
      food_name: event.foodName,
      quantity_label: event.quantityLabel,
      remaining_quantity_label: event.type === 'consume' ? event.remainingQuantityLabel : null,
      consumption_type: event.type,
    })),
  });
  if (error) throw error;
  if (data !== 'confirmed' && data !== 'already-confirmed') {
    throw new Error('조리 완료 결과를 확인하지 못했어요.');
  }
  return data;
}
