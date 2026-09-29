import { NextResponse } from "next/server";

export async function GET() {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );

  return NextResponse.json({
    status: "ONLINE",
    aiCore: hasKey ? "GEMINI_3_7_FLASH_ACTIVE" : "STANDALONE_NEURAL_ACTIVE",
    version: "2.4.0-COALESCE-OS",
    uptime: typeof process.uptime === "function" ? process.uptime() : 0,
    memory: "SYNCHRONIZED",
    web: "ONLINE",
    automation: "STANDBY",
  });
}
