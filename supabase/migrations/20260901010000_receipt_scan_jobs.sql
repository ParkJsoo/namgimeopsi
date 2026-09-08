create table public.scan_jobs (
  id text primary key check (char_length(trim(id)) > 0),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(trim(storage_path)) > 0),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/heic')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  status text not null default 'uploaded' check (status in ('uploaded', 'analyzing', 'ready', 'failed')),
  analysis_source text check (analysis_source in ('fixture', 'ocr')),
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  analyzed_at timestamptz
);

create index scan_jobs_user_created_at_idx on public.scan_jobs (user_id, created_at desc);

alter table public.scan_jobs enable row level security;

grant select, insert on public.scan_jobs to authenticated;

create policy "Users read their own receipt scan jobs"
on public.scan_jobs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users create their own uploaded receipt scan jobs"
on public.scan_jobs for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'uploaded'
  and result is null
  and analysis_source is null
  and error_code is null
  and analyzed_at is null
  and storage_path like ((select auth.uid())::text || '/%')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-images',
  'receipt-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their own receipt images"
on storage.objects for select to authenticated
using (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users upload their own receipt images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete their own receipt images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'receipt-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

alter table public.receipt_intakes
add column scan_job_id text references public.scan_jobs(id);

create or replace function public.commit_receipt_scan_intake(
  p_receipt_id text,
  p_items jsonb,
  p_events jsonb,
  p_scan_id text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_result text;
begin
  if v_user_id is null then
    raise exception 'authenticated user is required';
  end if;

  if char_length(trim(coalesce(p_scan_id, ''))) = 0 then
    raise exception 'scan id is required';
  end if;

  if not exists (
    select 1
    from public.scan_jobs
    where id = p_scan_id
      and user_id = v_user_id
      and status = 'ready'
  ) then
    raise exception 'receipt scan is not ready';
  end if;

  v_result := public.commit_receipt_intake(p_receipt_id, p_items, p_events);

  if v_result = 'confirmed' then
    update public.receipt_intakes
    set scan_job_id = p_scan_id
    where user_id = v_user_id
      and receipt_id = p_receipt_id;
  end if;

  return v_result;
end;
$$;

revoke execute on function public.commit_receipt_scan_intake(text, jsonb, jsonb, text) from public, anon;
grant execute on function public.commit_receipt_scan_intake(text, jsonb, jsonb, text) to authenticated;
