alter table public.inventory_events
  drop constraint if exists inventory_events_type_check;

alter table public.inventory_events
  add constraint inventory_events_type_check
  check (type in ('consume-all', 'consume', 'intake'));

alter table public.inventory_events
  add column remaining_quantity_label text,
  add column cooking_session_id text;

create index inventory_events_cooking_session_idx
on public.inventory_events (user_id, cooking_session_id)
where cooking_session_id is not null;

create table public.cooking_sessions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null check (char_length(trim(id)) > 0),
  recipe_id text,
  recipe_title text,
  completed_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.cooking_session_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  cooking_session_id text not null,
  inventory_item_id text not null,
  food_name text not null check (char_length(trim(food_name)) > 0),
  consumption_type text not null check (consumption_type in ('consume', 'consume-all')),
  quantity_label text not null check (char_length(trim(quantity_label)) > 0),
  remaining_quantity_label text,
  created_at timestamptz not null default now(),
  primary key (user_id, cooking_session_id, inventory_item_id),
  foreign key (user_id, cooking_session_id)
    references public.cooking_sessions(user_id, id) on delete cascade
);

alter table public.cooking_sessions enable row level security;
alter table public.cooking_session_items enable row level security;

grant select, insert on public.cooking_sessions to authenticated;
grant select, insert on public.cooking_session_items to authenticated;

create policy "Users read their own cooking sessions"
on public.cooking_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own cooking sessions"
on public.cooking_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users read their own cooking session items"
on public.cooking_session_items for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own cooking session items"
on public.cooking_session_items for insert to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.complete_cooking_session(
  p_session_id text,
  p_recipe_id text,
  p_recipe_title text,
  p_completed_at timestamptz,
  p_items jsonb
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_item_count integer;
  v_claimed_count integer;
begin
  if v_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  if char_length(trim(coalesce(p_session_id, ''))) = 0
    or p_completed_at is null
    or jsonb_typeof(p_items) <> 'array' then
    raise exception 'session id, completed at, and items are required';
  end if;

  select jsonb_array_length(p_items) into v_item_count;
  if v_item_count = 0 then
    raise exception 'at least one consumed item is required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as item(
      id text,
      inventory_item_id text,
      food_name text,
      quantity_label text,
      remaining_quantity_label text,
      consumption_type text
    )
    where char_length(trim(coalesce(id, ''))) = 0
      or char_length(trim(coalesce(inventory_item_id, ''))) = 0
      or char_length(trim(coalesce(food_name, ''))) = 0
      or char_length(trim(coalesce(quantity_label, ''))) = 0
      or consumption_type not in ('consume', 'consume-all')
      or (consumption_type = 'consume' and char_length(trim(coalesce(remaining_quantity_label, ''))) = 0)
      or (consumption_type = 'consume-all' and remaining_quantity_label is not null)
  ) then
    raise exception 'cooking items contain invalid values';
  end if;

  if (select count(distinct item.id) from jsonb_to_recordset(p_items) as item(id text)) <> v_item_count
    or (select count(distinct item.inventory_item_id) from jsonb_to_recordset(p_items) as item(inventory_item_id text)) <> v_item_count then
    raise exception 'cooking item ids must be unique';
  end if;

  insert into public.cooking_sessions (user_id, id, recipe_id, recipe_title, completed_at)
  values (v_user_id, p_session_id, nullif(trim(p_recipe_id), ''), nullif(trim(p_recipe_title), ''), p_completed_at)
  on conflict do nothing;
  get diagnostics v_claimed_count = row_count;

  if v_claimed_count = 0 then
    return 'already-confirmed';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as draft(
      inventory_item_id text,
      food_name text,
      remaining_quantity_label text,
      consumption_type text
    )
    left join public.inventory_items as inventory
      on inventory.user_id = v_user_id
      and inventory.id = draft.inventory_item_id
    where inventory.id is null
      or inventory.name <> draft.food_name
      or exists (
        select 1 from public.inventory_events as event
        where event.user_id = v_user_id
          and event.inventory_item_id = draft.inventory_item_id
          and event.type = 'consume-all'
      )
      or (draft.consumption_type = 'consume' and inventory.quantity = draft.remaining_quantity_label)
  ) then
    raise exception 'cooking items must reference active inventory with a changed remaining quantity';
  end if;

  update public.inventory_items as inventory
  set quantity = draft.remaining_quantity_label
  from jsonb_to_recordset(p_items) as draft(
    inventory_item_id text,
    remaining_quantity_label text,
    consumption_type text
  )
  where inventory.user_id = v_user_id
    and inventory.id = draft.inventory_item_id
    and draft.consumption_type = 'consume';

  insert into public.inventory_events (
    user_id, id, type, inventory_item_id, food_name, quantity_label,
    remaining_quantity_label, occurred_at, recipe_id, recipe_title, cooking_session_id
  )
  select
    v_user_id,
    item.id,
    item.consumption_type,
    item.inventory_item_id,
    item.food_name,
    item.quantity_label,
    item.remaining_quantity_label,
    p_completed_at,
    nullif(trim(p_recipe_id), ''),
    nullif(trim(p_recipe_title), ''),
    p_session_id
  from jsonb_to_recordset(p_items) as item(
    id text,
    inventory_item_id text,
    food_name text,
    quantity_label text,
    remaining_quantity_label text,
    consumption_type text
  );

  insert into public.cooking_session_items (
    user_id, cooking_session_id, inventory_item_id, food_name,
    consumption_type, quantity_label, remaining_quantity_label
  )
  select
    v_user_id,
    p_session_id,
    item.inventory_item_id,
    item.food_name,
    item.consumption_type,
    item.quantity_label,
    item.remaining_quantity_label
  from jsonb_to_recordset(p_items) as item(
    inventory_item_id text,
    food_name text,
    quantity_label text,
    remaining_quantity_label text,
    consumption_type text
  );

  return 'confirmed';
end;
$$;

revoke execute on function public.complete_cooking_session(text, text, text, timestamptz, jsonb) from public, anon;
grant execute on function public.complete_cooking_session(text, text, text, timestamptz, jsonb) to authenticated;
