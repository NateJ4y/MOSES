import { NextResponse } from 'next/server';
import { dbRequest, findAuthUserIdByEmail, getAuthUserEmail, isSameOriginRequest, requirePlatformAdmin } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

// Approved workspace owners may create workspaces. Platform admins manage the list.
export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const rows = await dbRequest('workspace_creators?select=user_id,created_at&order=created_at.desc', { method: 'GET' });
    const creators = await Promise.all((rows || []).map(async (r: { user_id: string; created_at: string }) => ({
      userId: r.user_id, email: await getAuthUserEmail(r.user_id), createdAt: r.created_at
    })));
    return NextResponse.json({ creators });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load approved owners.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const auth = await requirePlatformAdmin();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { email?: unknown; approved?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || typeof body.approved !== 'boolean') return NextResponse.json({ error: 'email and approved are required.' }, { status: 400 });

  try {
    const userId = await findAuthUserIdByEmail(email);
    if (!userId) return NextResponse.json({ error: 'No account with that email has signed up yet.' }, { status: 404 });
    if (body.approved) {
      await dbRequest('workspace_creators?on_conflict=user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: userId, approved_by: auth.user.id })
      });
    } else {
      await dbRequest('workspace_creators?user_id=eq.' + encodeURIComponent(userId), { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update approved owners.' }, { status: 500 });
  }
}
