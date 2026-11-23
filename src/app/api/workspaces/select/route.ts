import { NextResponse } from 'next/server';
import {
  dbConfigured,
  getAuthenticatedUser,
  getWorkspaceMembership,
  isSameOriginRequest,
  WORKSPACE_COOKIE,
  workspaceCookieOptions
} from '@/lib/db/server';

export const dynamic = 'force-dynamic';

// Choose the active workspace. The choice is only a hint: every other route
// re-checks for an ACTIVE membership on each request.
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!dbConfigured) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
  const workspaceId = (body as { workspaceId?: unknown })?.workspaceId;
  if (typeof workspaceId !== 'string' || !workspaceId) return NextResponse.json({ error: 'workspaceId is required.' }, { status: 400 });

  const membership = await getWorkspaceMembership(user.id, workspaceId);
  if (!membership) return NextResponse.json({ error: 'You do not have an active membership in that workspace.' }, { status: 403 });

  const response = NextResponse.json({ ok: true, workspaceId });
  response.cookies.set(WORKSPACE_COOKIE, workspaceId, workspaceCookieOptions());
  return response;
}
