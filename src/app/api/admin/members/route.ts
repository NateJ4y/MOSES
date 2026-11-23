import { NextResponse } from 'next/server';
import {
  dbRequest,
  findAuthUserIdByEmail,
  getAuthUserEmail,
  isSameOriginRequest,
  MEMBERSHIP_STATUSES,
  requirePlatformAdmin,
  WORKSPACE_ROLES,
  type MembershipStatus
} from '@/lib/db/server';

export const dynamic = 'force-dynamic';

const q = encodeURIComponent;

// List every workspace membership (pending first). Platform admins only.
export async function GET() {
  const auth = await requirePlatformAdmin();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const [members, workspaces] = await Promise.all([
      dbRequest('workspace_members?select=workspace_id,user_id,role,status,created_at&order=created_at.desc', { method: 'GET' }),
      dbRequest('workspaces?select=id,name', { method: 'GET' })
    ]);
    const names = new Map<string, string>((workspaces || []).map((w: { id: string; name: string }) => [w.id, w.name]));
    const rows = await Promise.all((members || []).map(async (m: { workspace_id: string; user_id: string; role: string; status: string; created_at: string }) => ({
      workspaceId: m.workspace_id,
      workspaceName: names.get(m.workspace_id) || 'Workspace',
      userId: m.user_id,
      email: await getAuthUserEmail(m.user_id),
      role: m.role,
      status: m.status,
      createdAt: m.created_at
    })));
    const order: Record<string, number> = { pending: 0, active: 1, suspended: 2, rejected: 3 };
    rows.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    return NextResponse.json({ members: rows, workspaces: (workspaces || []).map((w: { id: string; name: string }) => ({ id: w.id, name: w.name })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load members.' }, { status: 500 });
  }
}

// Grant a user (by email) access to a workspace. Platform admins only.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const auth = await requirePlatformAdmin();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { email?: unknown; workspaceId?: unknown; role?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId : '';
  const role = typeof body.role === 'string' ? body.role : 'member';
  if (!email || !workspaceId) return NextResponse.json({ error: 'email and workspaceId are required.' }, { status: 400 });
  if (!(WORKSPACE_ROLES as readonly string[]).includes(role)) return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });

  try {
    const userId = await findAuthUserIdByEmail(email);
    if (!userId) return NextResponse.json({ error: 'No account with that email has signed up yet.' }, { status: 404 });
    await dbRequest('workspace_members?on_conflict=workspace_id,user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ workspace_id: workspaceId, user_id: userId, role, status: 'active' })
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not add the member.' }, { status: 500 });
  }
}

// Approve, reject, suspend or reactivate a membership. Platform admins only.
export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const auth = await requirePlatformAdmin();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: { workspaceId?: unknown; userId?: unknown; status?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const { workspaceId, userId, status } = body;
  if (typeof workspaceId !== 'string' || typeof userId !== 'string') return NextResponse.json({ error: 'workspaceId and userId are required.' }, { status: 400 });
  if (typeof status !== 'string' || !MEMBERSHIP_STATUSES.includes(status as MembershipStatus)) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });

  try {
    if (status !== 'active') {
      // Never leave a workspace without an active owner.
      const owners = await dbRequest(
        'workspace_members?select=user_id&workspace_id=eq.' + q(workspaceId) + '&role=eq.owner&status=eq.active',
        { method: 'GET' }
      );
      const remaining = (owners || []).filter((o: { user_id: string }) => o.user_id !== userId);
      const isActiveOwner = (owners || []).some((o: { user_id: string }) => o.user_id === userId);
      if (isActiveOwner && remaining.length === 0) {
        return NextResponse.json({ error: 'This is the last active owner of the workspace.' }, { status: 409 });
      }
    }
    await dbRequest(
      'workspace_members?workspace_id=eq.' + q(workspaceId) + '&user_id=eq.' + q(userId),
      { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status }) }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update the membership.' }, { status: 500 });
  }
}
