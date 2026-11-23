-- MOSES Phase 4: approval-based access, multi-workspace and platform admins.
-- ADDITIVE ONLY. Nothing is dropped, truncated or rewritten.
--
-- BEFORE RUNNING
--   1. Inspect the live schema in Supabase (Table editor / `\d workspace_members`).
--   2. Run this in the Supabase SQL editor, ideally on a branch/backup first.
--   3. Replace <YOUR_LOGIN_EMAIL> in section 5 BEFORE running, or you will have
--      no platform administrator.
--
-- Policy (confirmed by the product owner):
--   * Workspace membership is approved by platform admins only.
--   * Workspaces may be created by approved owners (and platform admins).

-- 1. Membership status -------------------------------------------------------
-- Added with default 'active' so every EXISTING member keeps their access,
-- then the default is switched to 'pending' for all future rows.
alter table public.workspace_members
  add column if not exists status text not null default 'active';

alter table public.workspace_members
  drop constraint if exists workspace_members_status_check;
alter table public.workspace_members
  add constraint workspace_members_status_check
  check (status in ('pending', 'active', 'rejected', 'suspended'));

alter table public.workspace_members
  alter column status set default 'pending';

create index if not exists workspace_members_user_status_idx
  on public.workspace_members(user_id, status);

-- 2. Platform administrators -------------------------------------------------
-- Separate from workspace roles. Never derived from user-editable metadata.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3. Approved workspace owners (may create workspaces) -----------------------
create table if not exists public.workspace_creators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. Lock the new tables to the server (service role) -------------------------
alter table public.platform_admins enable row level security;
alter table public.workspace_creators enable row level security;
revoke all on public.platform_admins from anon, authenticated;
revoke all on public.workspace_creators from anon, authenticated;
grant all on public.platform_admins to service_role;
grant all on public.workspace_creators to service_role;

-- 5. Seed (REQUIRED) ---------------------------------------------------------
-- First platform administrator. Replace the email, then run.
insert into public.platform_admins (user_id)
select id from auth.users where lower(email) = lower('<YOUR_LOGIN_EMAIL>')
on conflict (user_id) do nothing;

-- Existing workspace owners keep the ability to create workspaces.
insert into public.workspace_creators (user_id)
select distinct user_id from public.workspace_members where role = 'owner'
on conflict (user_id) do nothing;

-- Sanity check: should return at least 1 row.
-- select * from public.platform_admins;
