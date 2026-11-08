import { NextResponse } from "next/server";
import { dbConfigured, ensureWorkspaceForUser, getAuthenticatedUser, getWorkspaceMembership, WorkspaceAuthorizationError } from "@/lib/db/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
    if (!dbConfigured) return NextResponse.json({ ok: false, configured: false, error: "Database is not connected." }, { status: 503 });

    const workspaceId = await ensureWorkspaceForUser(user.id);
    const membership = await getWorkspaceMembership(user.id, workspaceId);
    if (!membership) throw new WorkspaceAuthorizationError("You do not have access to this workspace.");

    return NextResponse.json({
      ok: true,
      configured: true,
      status: "CONNECTED"
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    console.error("Database health check failed:", error);
    return NextResponse.json({
      ok: false,
      configured: dbConfigured,
      error: "Database health check failed."
    }, { status: 500 });
  }
}
