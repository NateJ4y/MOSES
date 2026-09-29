import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nodes, edges, payload } = await req.json();
    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) {
      return NextResponse.json({
        status: "NOT CONNECTED",
        message: "n8n webhook is not configured. No workflow was simulated or executed."
      }, { status: 503 });
    }

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "MOSES",
        timestamp: new Date().toISOString(),
        nodes,
        edges,
        payload: payload ?? null
      }),
      cache: "no-store"
    });

    const text = await response.text();
    return NextResponse.json({
      status: response.ok ? "EXECUTED" : "ERROR",
      upstreamStatus: response.status,
      response: text.slice(0, 4000)
    }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json({ status: "ERROR", message: "Workflow execution failed. No result was fabricated." }, { status: 500 });
  }
}
