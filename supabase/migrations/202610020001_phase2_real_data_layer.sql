-- MOSES Phase 2: Real Data Layer
-- Run this migration in the Supabase SQL editor.
-- No demo/business records are inserted.

create extension if not exists pgcrypto;

create type moses_record_status as enum ('ACTIVE','ARCHIVED','DELETED');
create type moses_source_type as enum ('USER','SYSTEM','IMPORT','API','WEBHOOK','AI','UNKNOWN');
create type moses_data_quality as enum ('REAL','UNKNOWN','INFERENCE','STALE');

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Coalesce Digital',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source moses_source_type not null default 'SYSTEM',
  data_quality moses_data_quality not null default 'REAL'
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'MEMBER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  website text,
  industry text,
  location text,
  phone text,
  email text,
  social_links jsonb not null default '{}'::jsonb,
  notes text,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  name text not null,
  role text,
  email text,
  phone text,
  social_links jsonb not null default '{}'::jsonb,
  notes text,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  business text not null,
  contact_person text,
  contact_role text,
  email text,
  phone text,
  website text,
  social text,
  social_links jsonb not null default '{}'::jsonb,
  industry text,
  location text,
  problem text,
  potential_service text,
  lead_score integer not null default 0,
  score_tier text not null default 'UNSCORED',
  status text not null default 'NEW',
  estimated_value numeric(12,2) not null default 0,
  next_action text,
  last_contact text,
  follow_up_date text,
  score_explanation text,
  signals jsonb not null default '[]'::jsonb,
  capacity_risk boolean not null default false,
  notes text,
  owner_user_id uuid,
  record_status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  name text not null,
  status text not null default 'ACTIVE',
  notes text,
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists client_dna (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  business_name text not null,
  position text,
  usp text,
  target_audience text,
  brand_voice text,
  visual_system text,
  goals text,
  offers text,
  proof text,
  constraints text,
  notes text,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  client text not null,
  service_category text not null,
  service_name text not null,
  status text not null default 'DISCOVERY',
  progress integer not null default 0,
  deadline text,
  monthly_retainer numeric(12,2),
  assets_count integer not null default 0,
  notes text,
  next_action text,
  capacity_impact text not null default 'LOW',
  owner_user_id uuid,
  record_status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date timestamptz,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  category text,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'SYSTEM',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  name text not null,
  price numeric(12,2),
  billing_period text,
  description text,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'SYSTEM',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  channel text not null,
  target_business text not null,
  contact_person text,
  subject text,
  content text not null,
  stage text not null,
  include_skeem_preview boolean not null default false,
  status text not null default 'DRAFT',
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  channel text not null,
  direction text,
  sender text,
  recipient text,
  subject text,
  content text not null,
  status text not null default 'DRAFT',
  sent_at timestamptz,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  external_id text,
  from_address text not null,
  to_address text not null,
  subject text not null,
  snippet text,
  body text,
  message_date timestamptz,
  category text not null default 'INBOX',
  status text not null default 'RECEIVED',
  ai_summary text,
  detected_opportunity text,
  source moses_source_type not null default 'API',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category text not null,
  trend text not null,
  why_it_matters text,
  opportunity_for_coalesce text,
  recommended_action text,
  urgency text,
  published_at timestamptz,
  source_url text,
  source_name text,
  source moses_source_type not null default 'API',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  category text not null,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  last_updated timestamptz not null default now(),
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists memory (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category text not null,
  type text not null,
  content text not null,
  context text,
  timestamp_label text,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'STANDBY',
  trigger_definition jsonb not null default '{}'::jsonb,
  definition jsonb not null default '{}'::jsonb,
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  workflow_id uuid references workflows(id) on delete set null,
  status text not null default 'PENDING',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  source moses_source_type not null default 'SYSTEM',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  source moses_source_type not null default 'SYSTEM',
  data_quality moses_data_quality not null default 'REAL',
  created_at timestamptz not null default now()
);

create table if not exists goals_kpis (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  metric text not null,
  target numeric,
  current_value numeric not null default 0,
  period text,
  status text not null default 'ACTIVE',
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  path text,
  mime_type text,
  storage_provider text,
  storage_key text,
  metadata jsonb not null default '{}'::jsonb,
  owner_user_id uuid,
  status moses_record_status not null default 'ACTIVE',
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  name text not null,
  status text not null default 'DISCONNECTED',
  config jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  confidence numeric(5,4),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider, name)
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  owner_user_id uuid,
  source moses_source_type not null default 'USER',
  data_quality moses_data_quality not null default 'REAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, key)
);

create index if not exists leads_workspace_status_idx on leads(workspace_id, status);
create index if not exists leads_workspace_score_idx on leads(workspace_id, lead_score desc);
create index if not exists projects_workspace_status_idx on projects(workspace_id, status);
create index if not exists tasks_project_idx on tasks(project_id);
create index if not exists activities_workspace_created_idx on activities(workspace_id, created_at desc);
create index if not exists memory_workspace_updated_idx on memory(workspace_id, updated_at desc);
create index if not exists knowledge_workspace_updated_idx on knowledge(workspace_id, updated_at desc);
create index if not exists research_workspace_updated_idx on research(workspace_id, updated_at desc);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'workspaces','workspace_members','companies','contacts','leads','clients','client_dna',
    'projects','tasks','services','offers','outreach','messages','emails','research',
    'knowledge','memory','workflows','workflow_runs','goals_kpis','documents','integrations','settings'
  ] loop
    execute format('drop trigger if exists %I_updated_at on %I', t, t);
    execute format('create trigger %I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- Phase 2 deliberately keeps authorization behind the server API.
-- Phase 3 will attach Supabase Auth identities and workspace-scoped RLS policies.
