import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dbConfigured = Boolean(url && key);

const allowed = new Set(['workspaces','workspace_members','companies','contacts','leads','clients','client_dna','projects','tasks','services','offers','outreach','messages','emails','research','knowledge','memory','workflows','workflow_runs','activities','goals_kpis','documents','integrations','settings']);

function check(table: string) {
  if (!allowed.has(table.split('?')[0])) throw new Error('Unsupported database collection.');
  if (!dbConfigured) throw new Error('MOSES database is not configured.');
}

export async function dbRequest(table: string, init: RequestInit = {}) {
  check(table);
  const response = await fetch(url + '/rest/v1/' + table, {
    ...init,
    headers: {
      apikey: key!,
      Authorization: 'Bearer ' + key!,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Supabase ' + response.status + ': ' + (await response.text()).slice(0, 500));
  if (response.status === 204) return null;
  return response.json();
}

export async function listRecords(table: string, workspaceId: string) {
  return dbRequest(table + '?select=*&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=created_at.desc', { method: 'GET', headers: { Prefer: 'return=representation' } });
}

export async function upsertRecords(table: string, records: unknown[]) {
  return dbRequest(table, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(records) });
}

export async function replaceRecords(table: string, workspaceId: string, records: unknown[]) {
  await dbRequest(table + '?workspace_id=eq.' + encodeURIComponent(workspaceId), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  return records.length ? upsertRecords(table, records) : [];
}

export async function ensureWorkspaceId() {
  if (process.env.MOSES_WORKSPACE_ID) return process.env.MOSES_WORKSPACE_ID;
  const rows = await dbRequest('workspaces?select=id&order=created_at.asc&limit=1', { method: 'GET' });
  if (Array.isArray(rows) && rows[0]?.id) return rows[0].id as string;
  const created = await dbRequest('workspaces', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ name: 'Coalesce Digital' }) });
  if (Array.isArray(created) && created[0]?.id) return created[0].id as string;
  throw new Error('Could not initialize MOSES workspace.');
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function ensureWorkspaceForUser(userId: string) {
  if (!dbConfigured) throw new Error('MOSES database is not configured.');

  if (process.env.MOSES_WORKSPACE_ID) {
    const configuredId = process.env.MOSES_WORKSPACE_ID;
    const members = await dbRequest(
      'workspace_members?select=workspace_id&user_id=eq.' + encodeURIComponent(userId) + '&workspace_id=eq.' + encodeURIComponent(configuredId) + '&limit=1',
      { method: 'GET' }
    );
    if (Array.isArray(members) && members[0]?.workspace_id) return configuredId;

    const workspaces = await dbRequest(
      'workspaces?select=id,owner_id&id=eq.' + encodeURIComponent(configuredId) + '&limit=1',
      { method: 'GET' }
    );
    const workspace = Array.isArray(workspaces) ? workspaces[0] : null;
    if (workspace?.owner_id && workspace.owner_id !== userId) {
      throw new Error('Authenticated user is not a member of the configured MOSES workspace.');
    }
    if (!workspace?.owner_id) {
      await dbRequest('workspaces?id=eq.' + encodeURIComponent(configuredId), {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ owner_id: userId })
      });
    }
    await dbRequest('workspace_members', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ workspace_id: configuredId, user_id: userId, role: 'owner' })
    });
    return configuredId;
  }

  const memberships = await dbRequest(
    'workspace_members?select=workspace_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1',
    { method: 'GET' }
  );
  if (Array.isArray(memberships) && memberships[0]?.workspace_id) return memberships[0].workspace_id as string;

  const available = await dbRequest(
    'workspaces?select=id,owner_id&owner_id=is.null&order=created_at.asc&limit=1',
    { method: 'GET' }
  );
  let workspaceId: string | null = Array.isArray(available) && available[0]?.id ? available[0].id as string : null;

  if (!workspaceId) {
    const created = await dbRequest('workspaces', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ name: 'Coalesce Digital', owner_id: userId })
    });
    if (!Array.isArray(created) || !created[0]?.id) throw new Error('Could not initialize authenticated MOSES workspace.');
    workspaceId = created[0].id as string;
  } else {
    await dbRequest('workspaces?id=eq.' + encodeURIComponent(workspaceId), {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ owner_id: userId })
    });
  }

  await dbRequest('workspace_members', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
  });

  return workspaceId;
}
