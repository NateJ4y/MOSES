import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dbConfigured = Boolean(url && key);

const allowedTables = new Set(['workspaces', 'workspace_members', 'moses_records']);

function check(table: string) {
  const base = table.split('?')[0];
  if (!allowedTables.has(base)) throw new Error('Unsupported database table.');
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
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function listRecords(collection: string, workspaceId: string) {
  const rows = await dbRequest(
    'moses_records?select=data&collection=eq.' + encodeURIComponent(collection) +
    '&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=updated_at.desc',
    { method: 'GET' }
  );
  if (!Array.isArray(rows)) throw new Error('Unexpected database response while reading ' + collection + '.');
  return rows.map((row: { data: unknown }) => row.data);
}

function normalizeRecords(records: unknown[], workspaceId: string, collection: string) {
  return records.map((record) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error('Every database record must be a JSON object.');
    }
    const data = { ...(record as Record<string, unknown>) };
    const id = typeof data.id === 'string' && data.id.trim() ? data.id : crypto.randomUUID();
    data.id = id;
    return { workspace_id: workspaceId, collection, record_key: id, data };
  });
}

export async function upsertRecords(collection: string, workspaceId: string, records: unknown[]) {
  const normalized = normalizeRecords(records, workspaceId, collection);
  if (!normalized.length) return [];
  return dbRequest('moses_records?on_conflict=workspace_id,collection,record_key', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(normalized)
  });
}

export async function replaceRecords(collection: string, workspaceId: string, records: unknown[]) {
  const response = await dbRequest('rpc/replace_moses_collection', {
    method: 'POST',
    body: JSON.stringify({
      p_workspace_id: workspaceId,
      p_collection: collection,
      p_records: normalizeRecords(records, workspaceId, collection).map((record) => ({
        id: record.record_key,
        data: record.data
      }))
    })
  });
  return response ?? [];
}

export async function ensureWorkspaceId() {
  if (process.env.MOSES_WORKSPACE_ID) return process.env.MOSES_WORKSPACE_ID;
  const rows = await dbRequest('workspaces?select=id&order=created_at.asc&limit=1', { method: 'GET' });
  if (Array.isArray(rows) && rows[0]?.id) return rows[0].id as string;
  const created = await dbRequest('workspaces', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ name: 'Coalesce Digital' })
  });
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
      'workspace_members?select=workspace_id&user_id=eq.' + encodeURIComponent(userId) +
      '&workspace_id=eq.' + encodeURIComponent(configuredId) + '&limit=1',
      { method: 'GET' }
    );
    if (Array.isArray(members) && members[0]?.workspace_id) return configuredId;

    const workspaces = await dbRequest(
      'workspaces?select=id,owner_id&id=eq.' + encodeURIComponent(configuredId) + '&limit=1',
      { method: 'GET' }
    );
    const workspace = Array.isArray(workspaces) ? workspaces[0] : null;
    if (!workspace) throw new Error('Configured MOSES workspace does not exist. Run the database schema first.');
    if (workspace.owner_id && workspace.owner_id !== userId) {
      throw new Error('Authenticated user is not a member of the configured MOSES workspace.');
    }
    if (!workspace.owner_id) {
      await dbRequest('workspaces?id=eq.' + encodeURIComponent(configuredId), {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ owner_id: userId })
      });
    }
    await dbRequest('workspace_members?on_conflict=workspace_id,user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ workspace_id: configuredId, user_id: userId, role: 'owner' })
    });
    return configuredId;
  }

  const memberships = await dbRequest(
    'workspace_members?select=workspace_id&user_id=eq.' + encodeURIComponent(userId) + '&limit=1',
    { method: 'GET' }
  );
  if (Array.isArray(memberships) && memberships[0]?.workspace_id) return memberships[0].workspace_id as string;

  const created = await dbRequest('workspaces', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ name: 'Coalesce Digital', owner_id: userId })
  });
  if (!Array.isArray(created) || !created[0]?.id) throw new Error('Could not initialize authenticated MOSES workspace.');
  const workspaceId = created[0].id as string;

  await dbRequest('workspace_members?on_conflict=workspace_id,user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, role: 'owner' })
  });

  return workspaceId;
}
