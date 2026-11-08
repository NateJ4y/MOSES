import { NextResponse } from "next/server";
import { buildMosesContext, generateMosesResponse, MOSES_COLLECTION_NAMES } from "@/lib/ai";
import {
  dbConfigured,
  ensureWorkspaceForUser,
  getAuthenticatedUser,
  getWorkspaceMembership,
  listRecords,
  WorkspaceAuthorizationError,
  isSameOriginRequest
} from "@/lib/db/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!dbConfigured) return NextResponse.json({ error: "Database is not connected." }, { status: 503 });

    const workspaceId = await ensureWorkspaceForUser(user.id);
    const membership = await getWorkspaceMembership(user.id, workspaceId);
    if (!membership) throw new WorkspaceAuthorizationError("You do not have access to this workspace.");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "A valid chat payload is required." }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });
    if (message.length > 8000) return NextResponse.json({ error: "Message must be 8,000 characters or fewer." }, { status: 413 });

    // Never trust business records supplied by the browser. Retrieve every
    // approved collection from the authenticated workspace on the server.
    // A failed read remains explicitly unavailable; it is never represented as empty.
    const collectionReads = await Promise.allSettled(
      MOSES_COLLECTION_NAMES.map((collection) => listRecords(collection, workspaceId, 101))
    );
    const collections = Object.fromEntries(
      MOSES_COLLECTION_NAMES.map((collection, index) => {
        const result = collectionReads[index];
        return [collection, result.status === "fulfilled"
          ? { records: result.value }
          : { error: true }];
      })
    );

    const requestedSection = typeof payload.activeSection === "string" ? payload.activeSection.slice(0, 40) : "COMMAND";
    const context = buildMosesContext({ activeSection: requestedSection, collections });
    const result = await generateMosesResponse(message, context);
    const contextDiagnostics = {
      ...context.system,
      collections: Object.fromEntries(
        MOSES_COLLECTION_NAMES.map((collection) => {
          const snapshot = context.collections[collection];
          return [collection, {
            status: snapshot.status,
            count: snapshot.count,
            fetchedCount: snapshot.fetchedCount,
            truncated: snapshot.truncated,
          }];
        })
      ),
    };
    return NextResponse.json({ ...result, contextDiagnostics }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("MOSES Chat API error:", error);
    return NextResponse.json({
      reply: "MOSES Core could not process the command. No unverified answer was fabricated.",
      provider: "gemini",
      model: "gemini-3.8-flash",
      status: "ERROR",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
