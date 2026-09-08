create table public.receipt_intakes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  receipt_id text not null check (char_length(trim(receipt_id)) > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, receipt_id)
);

grant insert on public.receipt_intakes to authenticated;

alter table public.receipt_intakes enable row level security;

create policy "Users claim their own receipt batches"
on public.receipt_intakes for insert to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.commit_receipt_intake(
  p_receipt_id text,
  p_items jsonb,
  p_events jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item_count integer;
  v_event_count integer;
  v_claimed_count integer;
begin
  if v_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  if char_length(trim(coalesce(p_receipt_id, ''))) = 0
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_typeof(p_events) <> 'array' then
    raise exception 'receipt id, items, and events are required';
  end if;

  select jsonb_array_length(p_items), jsonb_array_length(p_events)
  into v_item_count, v_event_count;

  if v_item_count = 0 or v_item_count <> v_event_count then
    raise exception 'receipt items and events must have matching nonzero counts';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id text,
      name text,
      quantity text,
      storage text,
      recommended_use_by text,
      reason text,
      kind text,
      created_at timestamptz
    )
    where char_length(trim(coalesce(id, ''))) = 0
      or char_length(trim(coalesce(name, ''))) = 0
      or char_length(trim(coalesce(quantity, ''))) = 0
      or storage not in ('냉장', '냉동', '실온')
      or char_length(trim(coalesce(recommended_use_by, ''))) = 0
      or char_length(trim(coalesce(reason, ''))) = 0
      or kind not in ('ingredient', 'leftover')
      or created_at is null
  ) then
    raise exception 'receipt items contain invalid values';
  end if;

  if (select count(distinct item.id) from jsonb_to_recordset(p_items) as item(id text)) <> v_item_count then
    raise exception 'receipt item ids must be unique';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_events) as event(
      id text,
      inventory_item_id text,
      food_name text,
      quantity_label text,
      occurred_at timestamptz,
      raw_name text
    )
    where char_length(trim(coalesce(id, ''))) = 0
      or char_length(trim(coalesce(inventory_item_id, ''))) = 0
      or char_length(trim(coalesce(food_name, ''))) = 0
      or char_length(trim(coalesce(quantity_label, ''))) = 0
      or occurred_at is null
  ) then
    raise exception 'receipt events contain invalid values';
  end if;

  if (select count(distinct event.id) from jsonb_to_recordset(p_events) as event(id text)) <> v_event_count
    or (select count(distinct event.inventory_item_id) from jsonb_to_recordset(p_events) as event(inventory_item_id text)) <> v_event_count
    or exists (
      select 1
      from jsonb_to_recordset(p_items) as item(id text)
      where not exists (
        select 1
        from jsonb_to_recordset(p_events) as event(inventory_item_id text)
        where event.inventory_item_id = item.id
      )
    )
    or exists (
      select 1
      from jsonb_to_recordset(p_events) as event(inventory_item_id text)
      where not exists (
        select 1
        from jsonb_to_recordset(p_items) as item(id text)
        where item.id = event.inventory_item_id
      )
    ) then
    raise exception 'receipt items and events must have a one-to-one mapping';
  end if;

  insert into public.receipt_intakes (user_id, receipt_id)
  values (v_user_id, p_receipt_id)
  on conflict do nothing;
  get diagnostics v_claimed_count = row_count;

  if v_claimed_count = 0 then
    return 'already-confirmed';
  end if;

  insert into public.inventory_items (
    user_id, id, name, quantity, storage, recommended_use_by, recommended_use_by_at,
    reason, kind, purchased_at, storage_started_at, label_expiry_at, created_at
  )
  select
    v_user_id,
    item.id,
    item.name,
    item.quantity,
    item.storage,
    item.recommended_use_by,
    item.recommended_use_by_at,
    item.reason,
    item.kind,
    item.purchased_at,
    item.storage_started_at,
    item.label_expiry_at,
    item.created_at
  from jsonb_to_recordset(p_items) as item(
    id text,
    name text,
    quantity text,
    storage text,
    recommended_use_by text,
    recommended_use_by_at date,
    reason text,
    kind text,
    purchased_at text,
    storage_started_at text,
    label_expiry_at text,
    created_at timestamptz
  );

  insert into public.inventory_events (
    user_id, id, type, inventory_item_id, food_name, quantity_label,
    occurred_at, source, receipt_id, raw_name
  )
  select
    v_user_id,
    event.id,
    'intake',
    event.inventory_item_id,
    event.food_name,
    event.quantity_label,
    event.occurred_at,
    'receipt',
    p_receipt_id,
    event.raw_name
  from jsonb_to_recordset(p_events) as event(
    id text,
    inventory_item_id text,
    food_name text,
    quantity_label text,
    occurred_at timestamptz,
    raw_name text
  );

  return 'confirmed';
end;
$$;

revoke execute on function public.commit_receipt_intake(text, jsonb, jsonb) from public, anon;
grant execute on function public.commit_receipt_intake(text, jsonb, jsonb) to authenticated;
