import { NextResponse } from "next/server";
import { getAuthenticatedUser, isSameOriginRequest } from "@/lib/db/server";

export const dynamic = "force-dynamic";

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const TRANSCRIPTION_MODEL = process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3-turbo";

export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "YOUR_GROQ_API_KEY" || apiKey === "MY_GROQ_API_KEY") {
      return NextResponse.json({ error: "Voice transcription is not configured. Check the server's Groq configuration." }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "An audio recording is required." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "The audio recording is empty. Please record again." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "That recording is larger than the 4 MB upload limit. Please record a shorter message." }, { status: 413 });
    }

    const groqForm = new FormData();
    groqForm.append("file", file, file.name || "moses-voice-message.webm");
    groqForm.append("model", TRANSCRIPTION_MODEL);
    groqForm.append("response_format", "json");
    groqForm.append("language", "en");
    groqForm.append("temperature", "0");

    const groqResponse = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
      signal: AbortSignal.timeout(120_000),
    });

    const result = await groqResponse.json().catch(() => null) as { text?: string; error?: { message?: string } } | null;
    if (!groqResponse.ok) {
      const detail = result?.error?.message || `Groq transcription returned HTTP ${groqResponse.status}.`;
      console.error("MOSES Groq transcription error:", { status: groqResponse.status, detail });
      return NextResponse.json({ error: "Audio transcription failed: " + detail }, { status: groqResponse.status >= 500 ? 502 : groqResponse.status });
    }

    const text = typeof result?.text === "string" ? result.text.trim() : "";
    if (!text) return NextResponse.json({ error: "No speech could be detected in that recording." }, { status: 422 });

    return NextResponse.json({ text }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("MOSES transcription route failed:", error);
    return NextResponse.json({ error: "MOSES could not process that audio recording. Please try again." }, { status: 500 });
  }
}
