-- MOSES // COALESCE DIGITAL OS
-- Run once in Supabase SQL Editor before configuring the Vercel environment variables.
-- Records are JSONB so MOSES can add fields without destructive schema changes.
-- All app records are isolated by authenticated workspace and collection.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Coalesce Digital',
  owner_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.moses_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  collection text not null check (collection in (
    'companies','contacts','leads','clients','client_dna','projects','tasks',
    'services','offers','outreach','messages','emails','research','knowledge',
    'memory','workflows','workflow_runs','activities','goals_kpis','documents',
    'integrations','settings'
  )),
  record_key text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, collection, record_key)
);

create index if not exists moses_records_collection_updated_idx
  on public.moses_records (workspace_id, collection, updated_at desc);
create index if not exists moses_records_data_gin_idx
  on public.moses_records using gin (data);

create or replace function public.replace_moses_collection(
  p_workspace_id uuid,
  p_collection text,
  p_records jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  record_id text;
  saved_count integer := 0;
begin
  if p_collection not in (
    'companies','contacts','leads','clients','client_dna','projects','tasks',
    'services','offers','outreach','messages','emails','research','knowledge',
    'memory','workflows','workflow_runs','activities','goals_kpis','documents',
    'integrations','settings'
  ) then
    raise exception 'Unsupported MOSES collection: %', p_collection;
  end if;

  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'p_records must be a JSON array';
  end if;

  -- Atomically remove records deleted in the UI, then upsert the current collection.
  delete from public.moses_records existing
  where existing.workspace_id = p_workspace_id
    and existing.collection = p_collection
    and not exists (
      select 1
      from jsonb_array_elements(p_records) incoming
      where incoming->>'id' = existing.record_key
    );

  for item in select value from jsonb_array_elements(p_records)
  loop
    record_id := item->>'id';
    if record_id is null or length(trim(record_id)) = 0 then
      raise exception 'Every MOSES record must include a non-empty id';
    end if;

    insert into public.moses_records (workspace_id, collection, record_key, data, updated_at)
    values (p_workspace_id, p_collection, record_id, item->'data', now())
    on conflict (workspace_id, collection, record_key)
    do update set data = excluded.data, updated_at = now();

    saved_count := saved_count + 1;
  end loop;

  return jsonb_build_object('saved', saved_count, 'collection', p_collection);
end;
$$;

-- Direct browser access is denied. The application server uses its server-only secret
-- after validating the user's Supabase session and resolving their workspace membership.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.moses_records enable row level security;

revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_members from anon, authenticated;
revoke all on public.moses_records from anon, authenticated;
grant all on public.workspaces to service_role;
grant all on public.workspace_members to service_role;
grant all on public.moses_records to service_role;
grant execute on function public.replace_moses_collection(uuid, text, jsonb) to service_role;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists moses_records_set_updated_at on public.moses_records;
create trigger moses_records_set_updated_at before update on public.moses_records
for each row execute function public.set_updated_at();
