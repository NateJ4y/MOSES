import { NextResponse } from 'next/server';
import {
  dbConfigured,
  getAuthenticatedUser,
  isApprovedWorkspaceCreator,
  isPlatformAdmin,
  listUserWorkspaces,
  resolveWorkspaceForUser,
  WorkspaceAuthorizationError
} from '@/lib/db/server';

export const dynamic = 'force-dynamic';

// Read-only: reports who the user is and what access they have. It never
// creates workspaces or memberships.
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });
  const identity = { id: user.id, email: user.email };
  if (!dbConfigured) {
    return NextResponse.json({ authenticated: true, user: identity, error: 'Database is not connected.' }, { status: 503 });
  }

  try {
    const [workspaces, platformAdmin, canCreate] = await Promise.all([
      listUserWorkspaces(user.id),
      isPlatformAdmin(user.id),
      isApprovedWorkspaceCreator(user.id)
    ]);
    const base = {
      authenticated: true,
      user: identity,
      workspaces,
      isPlatformAdmin: platformAdmin,
      canCreateWorkspaces: platformAdmin || canCreate
    };
    try {
      const workspaceId = await resolveWorkspaceForUser(user.id);
      return NextResponse.json({ ...base, workspaceId });
    } catch (error) {
      if (error instanceof WorkspaceAuthorizationError) {
        return NextResponse.json({ ...base, workspaceId: null, code: error.code, message: error.message });
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json({
      authenticated: true,
      user: identity,
      error: error instanceof Error ? error.message : 'Workspace lookup failed.'
    }, { status: 500 });
  }
}
