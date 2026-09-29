import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json({ error: "Research topic is required." }, { status: 400 });
    }

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
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2
      }
    });

    return NextResponse.json({
      status: "ONLINE",
      reply: response.text || "No verified research result returned.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata ?? null
    });
  } catch (error) {
    console.error("Research API error:", error);
    return NextResponse.json({
      status: "ERROR",
      reply: "Research failed. No result was fabricated. Check the API configuration and retry."
    }, { status: 500 });
  }
}
