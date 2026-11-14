import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOriginRequest } from "@/lib/db/server";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 5_000;

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) {
      return NextResponse.json({
        error: "MOSES voice is not configured. Add ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID to the server environment."
      }, { status: 503 });
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const text = payload && typeof payload === "object" && "text" in payload
      ? (payload as { text?: unknown }).text
      : null;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required for speech generation." }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Speech text must be 5,000 characters or fewer." }, { status: 413 });
    }

    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.48,
            similarity_boost: 0.82,
            style: 0.18,
            use_speaker_boost: true
          }
        }),
        signal: AbortSignal.timeout(60_000)
      }
    );

    if (!elevenLabsResponse.ok) {
      const detail = await elevenLabsResponse.text().catch(() => "");
      console.error("MOSES ElevenLabs API error:", {
        status: elevenLabsResponse.status,
        detail: detail.slice(0, 500)
      });
      const message = elevenLabsResponse.status === 401 || elevenLabsResponse.status === 403
        ? "ElevenLabs rejected the API key or voice access. Check the key permissions and selected voice."
        : elevenLabsResponse.status === 429
          ? "ElevenLabs rate or credit limit reached. Check your plan usage."
          : "ElevenLabs could not generate speech. Please try again.";
      return NextResponse.json({ error: message }, {
        status: elevenLabsResponse.status === 429 ? 429 : 502
      });
    }

    return new Response(elevenLabsResponse.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("MOSES speech generation failed:", error);
    return NextResponse.json({ error: "MOSES could not generate speech right now." }, { status: 500 });
  }
}
