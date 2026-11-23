import { NextResponse } from 'next/server';
import {
  dbConfigured,
  dbRequest,
  getAuthenticatedUser,
  isApprovedWorkspaceCreator,
  isPlatformAdmin,
  isSameOriginRequest,
  WORKSPACE_COOKIE,
  workspaceCookieOptions
} from '@/lib/db/server';

export const dynamic = 'force-dynamic';

// Create a workspace. Only approved workspace owners (or platform admins) may.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!dbConfigured) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });

  const allowed = (await isPlatformAdmin(user.id)) || (await isApprovedWorkspaceCreator(user.id));
  if (!allowed) return NextResponse.json({ error: 'Only approved workspace owners can create workspaces.' }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const name = typeof (body as { name?: unknown })?.name === 'string' ? (body as { name: string }).name.trim() : '';
  if (!name || name.length > 120) return NextResponse.json({ error: 'A workspace name of 1 to 120 characters is required.' }, { status: 400 });

  const created = await dbRequest('workspaces', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ name, owner_id: user.id })
  });
  const workspaceId = Array.isArray(created) ? created[0]?.id : null;
  if (!workspaceId) return NextResponse.json({ error: 'Could not create the workspace.' }, { status: 500 });

  await dbRequest('workspace_members?on_conflict=workspace_id,user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ workspace_id: workspaceId, user_id: user.id, role: 'owner', status: 'active' })
  });

  const response = NextResponse.json({ ok: true, workspaceId });
  response.cookies.set(WORKSPACE_COOKIE, workspaceId, workspaceCookieOptions());
  return response;
}
