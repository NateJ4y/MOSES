import { NextResponse } from 'next/server';
import { dbConfigured, dbRequest, ensureWorkspaceId } from '@/lib/db/server';

export async function GET() {
  if (!dbConfigured) {
    return NextResponse.json({ ok: false, configured: false, error: 'Supabase server environment variables are missing.' }, { status: 503 });
  }

  try {
    const workspaceId = await ensureWorkspaceId();
    const leads = await dbRequest(
      'leads?select=id,business,workspace_id&workspace_id=eq.' + encodeURIComponent(workspaceId) + '&order=created_at.desc&limit=5',
      { method: 'GET' }
    );

    return NextResponse.json({
      ok: true,
      configured: true,
      workspaceId,
      leadCount: Array.isArray(leads) ? leads.length : 0,
      leads: Array.isArray(leads) ? leads : []
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown database error.'
    }, { status: 500 });
  }
}
