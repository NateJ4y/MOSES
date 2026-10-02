import { dbConfigured, ensureWorkspaceForUser, dbRequest, getAuthenticatedUser } from '@/lib/db/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const collections = [
  'workspaces',
  'workspace_members',
  'companies',
  'contacts',
  'leads',
  'clients',
  'client_dna',
  'projects',
  'tasks',
  'services',
  'offers',
  'outreach',
  'messages',
  'emails',
  'research',
  'knowledge',
  'memory',
  'workflows',
  'workflow_runs',
  'activities',
  'goals_kpis',
  'documents',
  'integrations',
  'settings',
] as const;

export default async function HealthPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login?next=/health');

  const result: Record<string, unknown> = {
    configured: dbConfigured,
    authenticated: true,
    userId: user.id,
    userEmail: user.email,
  };

  if (!dbConfigured) {
    result.error = 'Supabase server environment variables are missing.';
  } else {
    try {
      const workspaceId = await ensureWorkspaceForUser(user.id);
      result.workspaceId = workspaceId;
      result.collections = {};

      for (const collection of collections) {
        try {
          const query = collection === 'workspaces'
            ? 'select=id&limit=1'
            : 'select=id&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&limit=1';
          const rows = await dbRequest(collection + '?' + query);
          (result.collections as Record<string, unknown>)[collection] = {
            ok: true,
            count: Array.isArray(rows) ? rows.length : 0,
          };
        } catch (error) {
          (result.collections as Record<string, unknown>)[collection] = {
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
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
