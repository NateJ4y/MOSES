import { dbConfigured, ensureWorkspaceId, dbRequest } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const result: Record<string, unknown> = { configured: dbConfigured };

  if (!dbConfigured) {
    result.error = 'Supabase server environment variables are missing.';
  } else {
    try {
      const workspaceId = await ensureWorkspaceId();
      result.workspaceId = workspaceId;
      const collections = ['leads', 'projects', 'emails', 'messages', 'client_dna'];
      result.collections = {};
      for (const collection of collections) {
        try {
          const rows = await dbRequest(collection + '?select=id&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&limit=1');
          (result.collections as Record<string, unknown>)[collection] = { ok: true, count: Array.isArray(rows) ? rows.length : 0 };
        } catch (error) {
          (result.collections as Record<string, unknown>)[collection] = { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown database error.';
    }
  }

  return (
    <main style={{ fontFamily: 'monospace', padding: 32, whiteSpace: 'pre-wrap' }}>
      <h1>MOSES DATABASE HEALTH</h1>
      <p>{JSON.stringify(result, null, 2)}</p>
    </main>
  );
}
