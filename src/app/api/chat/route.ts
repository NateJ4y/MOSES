import { NextResponse } from "next/server";
import { buildMosesContext, generateMosesResponse } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const context = buildMosesContext(body?.context || {});
    const result = await generateMosesResponse(message, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error("MOSES Chat API error:", error);
    return NextResponse.json(
      {
        reply: "MOSES Core could not process the command. No unverified answer was fabricated.",
        provider: "gemini",
        model: "gemini-3.8-flash",
        status: "ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
