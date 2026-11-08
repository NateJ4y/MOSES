import { NextResponse } from "next/server";
import { dbConfigured, ensureWorkspaceForUser, getAuthenticatedUser, getWorkspaceMembership, WorkspaceAuthorizationError, isSameOriginRequest } from "@/lib/db/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!dbConfigured) return NextResponse.json({ error: "Database is not connected." }, { status: 503 });

    const workspaceId = await ensureWorkspaceForUser(user.id);
    const membership = await getWorkspaceMembership(user.id, workspaceId);
    if (!membership) throw new WorkspaceAuthorizationError("You do not have access to this workspace.");
    if (!["OWNER", "ADMIN", "MEMBER"].includes(membership.role)) {
      return NextResponse.json({ error: "Your workspace role does not allow workflow execution." }, { status: 403 });
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "A valid workflow payload is required." }, { status: 400 });
    }
    const payload = body as Record<string, unknown>;
    if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
      return NextResponse.json({ error: "Workflow nodes and edges must be arrays." }, { status: 400 });
    }
    if (payload.nodes.length > 200 || payload.edges.length > 500) {
      return NextResponse.json({ error: "Workflow exceeds the allowed node or edge limit." }, { status: 413 });
    }

    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) {
      return NextResponse.json({
        status: "NOT CONNECTED",
        message: "n8n webhook is not configured. No workflow was simulated or executed."
      }, { status: 503 });
    }

    const target = new URL(webhook);
    if (target.protocol !== "https:" && target.hostname !== "localhost" && target.hostname !== "127.0.0.1") {
      return NextResponse.json({ error: "The configured workflow webhook must use HTTPS." }, { status: 500 });
    }

    const response = await fetch(target.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "MOSES",
        workspaceId,
        timestamp: new Date().toISOString(),
        nodes: payload.nodes,
        edges: payload.edges,
        payload: payload.payload ?? null
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000)
    });

    const text = await response.text();
    return NextResponse.json({
      status: response.ok ? "EXECUTED" : "ERROR",
      upstreamStatus: response.status,
      response: text.slice(0, 4000)
    }, { status: response.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Workflow execution error:", error);
    return NextResponse.json({ status: "ERROR", message: "Workflow execution failed. No result was fabricated." }, { status: 500 });
  }
}
