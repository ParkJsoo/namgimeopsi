create table public.inventory_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  name text not null check (char_length(trim(name)) > 0),
  quantity text not null check (char_length(trim(quantity)) > 0),
  storage text not null check (storage in ('냉장', '냉동', '실온')),
  recommended_use_by text not null,
  recommended_use_by_at date,
  reason text not null,
  kind text not null check (kind in ('ingredient', 'leftover')),
  purchased_at text,
  storage_started_at text,
  label_expiry_at text,
  created_at timestamptz not null,
  primary key (user_id, id)
);

create table public.inventory_events (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id text not null,
  type text not null check (type in ('consume-all', 'intake')),
  inventory_item_id text not null,
  food_name text not null,
  quantity_label text not null,
  occurred_at timestamptz not null,
  recipe_id text,
  recipe_title text,
  source text,
  receipt_id text,
  raw_name text,
  primary key (user_id, id)
);

alter table public.inventory_items enable row level security;
alter table public.inventory_events enable row level security;

create policy "Users manage their own inventory items"
on public.inventory_items for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage their own inventory events"
on public.inventory_events for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
