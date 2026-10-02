-- MOSES Phase 2 follow-up: server-side data layer authorization boundary
-- Phase 2 uses the Next.js server API as the only database write/read boundary.
-- Supabase Auth + workspace-scoped RLS policies are introduced in Phase 3.
-- Disable table RLS for Phase 2 so the server API can create the initial workspace
-- and persist records without requiring a user identity before authentication exists.

alter table workspaces disable row level security;
alter table workspace_members disable row level security;
alter table companies disable row level security;
alter table contacts disable row level security;
alter table leads disable row level security;
alter table clients disable row level security;
alter table client_dna disable row level security;
alter table projects disable row level security;
alter table tasks disable row level security;
alter table services disable row level security;
alter table offers disable row level security;
alter table outreach disable row level security;
alter table messages disable row level security;
alter table emails disable row level security;
alter table research disable row level security;
alter table knowledge disable row level security;
alter table memory disable row level security;
alter table workflows disable row level security;
alter table workflow_runs disable row level security;
alter table activities disable row level security;
alter table goals_kpis disable row level security;
alter table documents disable row level security;
alter table integrations disable row level security;
alter table settings disable row level security;
