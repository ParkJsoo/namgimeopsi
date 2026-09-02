-- analyze-receipt runs with the service role and is the only path that moves
-- a user-created scan job from uploaded to analyzing, ready, or failed.
grant update on table public.scan_jobs to service_role;
