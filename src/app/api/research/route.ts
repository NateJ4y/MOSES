import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { dbConfigured, ensureWorkspaceForUser, getAuthenticatedUser, getWorkspaceMembership, WorkspaceAuthorizationError } from "@/lib/db/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (!dbConfigured) return NextResponse.json({ error: "Database is not connected." }, { status: 503 });

    const workspaceId = await ensureWorkspaceForUser(user.id);
    const membership = await getWorkspaceMembership(user.id, workspaceId);
    if (!membership) throw new WorkspaceAuthorizationError("You do not have access to this workspace.");
    if (!["OWNER", "ADMIN", "MEMBER"].includes(membership.role)) {
      return NextResponse.json({ error: "Your workspace role does not allow research requests." }, { status: 403 });
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const topic = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).topic : null;
    if (typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Research topic is required." }, { status: 400 });
    }
    if (topic.length > 2000) return NextResponse.json({ error: "Research topic must be 2,000 characters or fewer." }, { status: 413 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return NextResponse.json({
        status: "NOT CONNECTED",
        reply: "RESEARCH REQUIRED — connect GEMINI_API_KEY to enable live web research. No research was invented."
      }, { status: 503 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Research this topic for Coalesce Digital: ${topic}

Use current web information. Separate verified facts from analysis. Do not invent statistics, companies, prices, or claims. Return:
1. Key findings
2. Why it matters
3. Opportunities for Coalesce Digital
4. Immediate actions
5. Sources / URLs used
`,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 }
    });

    return NextResponse.json({
      status: "ONLINE",
      reply: response.text || "No verified research result returned.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata ?? null
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Research API error:", error);
    return NextResponse.json({
      status: "ERROR",
      reply: "Research failed. No result was fabricated. Check the API configuration and retry."
    }, { status: 500 });
  }
}
