export type MosesCollection = 'companies'|'contacts'|'leads'|'clients'|'client_dna'|'projects'|'tasks'|'services'|'offers'|'outreach'|'messages'|'emails'|'research'|'knowledge'|'memory'|'workflows'|'workflow_runs'|'activities'|'goals_kpis'|'documents'|'integrations'|'settings';

export async function getRecords<T>(collection: MosesCollection, workspaceId: string): Promise<T[]> {
  const query = new URLSearchParams({ collection, workspace_id: workspaceId });
  const response = await fetch('/api/data?' + query.toString(), { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error || 'Database read failed.');
  return Array.isArray(body.records) ? body.records as T[] : [];
}

export async function saveRecords<T>(collection: MosesCollection, records: T | T[]): Promise<T[]> {
  const response = await fetch('/api/data?collection=' + encodeURIComponent(collection), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(records)
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error || 'Database write failed.');
  return Array.isArray(body.records) ? body.records as T[] : [];
}
