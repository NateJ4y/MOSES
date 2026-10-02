-- MOSES Phase 3: authentication and workspace ownership
-- Auth identity is Supabase Auth. The Next.js server API remains the database boundary.

alter table public.workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table public.workspace_members
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.workspace_members
  add column if not exists role text not null default 'member';

create unique index if not exists workspace_members_workspace_user_uidx
  on public.workspace_members(workspace_id, user_id);

create index if not exists workspaces_owner_id_idx
  on public.workspaces(owner_id);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members(user_id);

-- Phase 3 authorization is enforced in the Next.js server API using the
-- authenticated Supabase user plus workspace membership. RLS remains disabled
-- because the API uses the server-only secret key and is the sole DB boundary.
