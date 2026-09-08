-- analyze-receipt runs with the service role and is the only path that moves
-- a user-created scan job from uploaded to analyzing, ready, or failed.
-- Filtered updates read these state/ownership columns, so PostgreSQL also
-- requires column SELECT privileges for the service role.
grant update on table public.scan_jobs to service_role;
grant select (id, user_id, status) on table public.scan_jobs to service_role;
