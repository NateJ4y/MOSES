const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const dbConfigured = Boolean(url && key);

const allowed = new Set(['companies','contacts','leads','clients','client_dna','projects','tasks','services','offers','outreach','messages','emails','research','knowledge','memory','workflows','workflow_runs','activities','goals_kpis','documents','integrations','settings']);

function check(table: string) {
  if (!allowed.has(table)) throw new Error('Unsupported database collection.');
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
  const query = new URLSearchParams({ select: '*', workspace_id: 'eq.' + workspaceId });
  const query = '?select=*&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=created_at.desc';
  return dbRequest(table + '?select=*&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=created_at.desc', { method: 'GET', headers: { Prefer: 'return=representation' } });
}

export async function upsertRecords(table: string, records: unknown[]) {
  return dbRequest(table, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(records) });
}

export async function replaceRecords(table: string, workspaceId: string, records: unknown[]) {
  await dbRequest(table + '?workspace_id=eq.' + encodeURIComponent(workspaceId), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  return records.length ? upsertRecords(table, records) : [];
}
