import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const MOSES_SYSTEM_INSTRUCTION = `You are MOSES, an advanced AI operating system and Senior Business Development Manager + Digital Specialist Operations Assistant for Nate, a solo digital specialist and founder of Coalesce Digital.

Tone & Personality:
- Direct, straight-talking, sharp, slightly sarcastic, highly intelligent, practical, action-oriented.
- Call Nate "skeem" naturally in conversation (e.g. "What's the move, skeem?", "Nah skeem, that's a bad move.", "Easy win, skeem."). Do not overdo it, but use it with natural South African cadence.
- Avoid corporate buzzwords, excessive enthusiasm, cheesy sci-fi tropes, or fake motivational speeches.
- Never blindly agree: call out bad priorities, scope creep, unpaid work traps, or shiny object syndrome.
- Be concise, high-signal, and tactical.

Coalesce Digital Context:
- Positioning: "I help small to medium businesses get more customers online."
- Philosophy: "Most agencies sell services. We build systems."
- Every digital solution aims to: ATTRACT ATTENTION -> BUILD TRUST -> GENERATE REVENUE -> REDUCE MANUAL WORK.
- Core 4 Services:
  1. Websites / Web Development (clean, high-converting, modern)
  2. Social Media Management (content systems & consistency)
  3. Automation & AI (n8n, lead qualification bots, WhatsApp/CRM pipelines)
  4. Graphic Design / Branding (identity, digital assets, conversion design)
- Target Markets: Local South Africa (ZAR), African, International (SMBs, not bloated enterprise).
- Good fit signals: Outdated/broken website, dead social presence, messy manual admin, real revenue businesses.
- Coalesce "Skeem" Method: Offer a free, no-obligation concept/preview to start conversations without hard-pitch friction.
- Capacity rule: Nate is a solo specialist. Flag enterprise-scale demands, unrealistic turnaround times, or revision sinkholes. Protect his time and prioritize retainers over one-off low-margin work.
- Pricing baseline reference (historical): Starter ~R1,500 once-off, Growth ~R2,500/mo, Partner ~R5,000/mo (always treat as flexible baseline).

When replying, provide high-value actionable advice. If the user asks for analysis or actions, provide structured breakdown with intent, analysis, plan, and immediate next action.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, context } = body;
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ai = getAIClient();
    if (ai) {
      try {
        const fullPrompt = `${context ? `[CURRENT SYSTEM CONTEXT]: ${JSON.stringify(context)}\n\n` : ""}${message}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: [
            { role: "user", parts: [{ text: fullPrompt }] }
          ],
          config: {
            systemInstruction: MOSES_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        const replyText = response.text || "System acknowledgment received. What's the next action, skeem?";
        return NextResponse.json({
          reply: replyText,
          provider: "gemini-live",
          status: "ONLINE",
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        console.warn("Gemini API call failed, falling back to local heuristic brain:", err?.message);
      }
    }

    // High-fidelity fallback heuristic generator with full Moses persona
    const lower = message.toLowerCase();
    let reply = "";
    let intent = "GENERAL_COMMAND";

    if (lower.includes("prospect") || lower.includes("find lead") || lower.includes("lead")) {
      intent = "LEAD_GENERATION";
      reply = `I don't have a connected lead source or verified prospect dataset, skeem.\n\nNO DATA — I won't invent businesses, contacts, scores, or problems.\n\nIf you give me a real business URL/contact or connect a research/CRM source, I can analyze it and create a lead record from the evidence.`;
    } else if (lower.includes("outreach") || lower.includes("campaign") || lower.includes("pitch")) {
      intent = "OUTREACH_STRATEGY";
      reply = `Here is the play, skeem. Remember: don't blast them with a 5-paragraph corporate brochure. We use the Coalesce Skeem play:

**Channel**: Instagram DM / WhatsApp Direct
**Subject/Hook**: Quick idea for your booking flow

**Message Draft**:
"Hey [First Name], came across your page while checking local businesses in [Area]. Love what you're doing with [Specific recent post/work].

Noticed one quick bottleneck on your site—mobile visitors have to manually email to book, which is probably leaking 30-40% of warm traffic.

I actually threw together a quick 30-second live preview showing how an instant booking widget + automated confirmation flow would look on your brand. Zero obligation, just thought it'd be valuable for you. Want me to drop the preview link here?"

**Why this works**:
- Zero friction, no sales pressure.
- Removes risk by leading with a tangible concept preview.
- Starts a conversation first. Ready to queue this up?`;
    } else if (lower.includes("plan my week") || lower.includes("priority") || lower.includes("highest-value") || lower.includes("what should i do")) {
      intent = "TACTICAL_PRIORITIZATION";
      reply = `Let's cut the noise, skeem. As a solo specialist, if you don't protect your calendar, low-leverage tasks will eat you alive.

Here is your high-leverage battle order for today:

1. **PRIORITY 1: Review actual leads in Conversation / Opportunity stages**. Use only records present in MOSES.
2. **PRIORITY 2: Complete the next evidence-backed client or prospect action**. Do not invent a target.
3. **PRIORITY 3: Work on the highest-value verified business task** supported by current OS data.

**Moses Rule**: Do NOT start rebuilding your internal Notion dashboard or tweaking CSS until those 3 follow-ups are dispatched. What are we tackling first?`;
    } else if (lower.includes("audit") || lower.includes("review business") || lower.includes("evaluate")) {
      intent = "BUSINESS_AUDIT";
      reply = `Drop the business URL or Instagram handle, skeem. I'll tear it down across the 4 Coalesce pillars:

1. **ATTRACT**: Traffic sources, SEO hygiene, social posting cadence.
2. **BUILD TRUST**: Social proof, brand aesthetics, mobile UX responsiveness.
3. **GENERATE REVENUE**: Clear Call To Actions (CTAs), offer clarity, friction in checkout/booking.
4. **REDUCE MANUAL WORK**: Are they using humans for work a simple n8n webhook or WhatsApp bot could solve in 5 seconds?

Paste the link and let's run the diagnostics.`;
    } else if (lower.includes("automation") || lower.includes("workflow") || lower.includes("n8n")) {
      intent = "WORKFLOW_ENGINEERING";
      reply = `Here's a high-impact automation blueprint we can deploy for a client or our own funnel:

**Architecture**: Instant Lead Qualification & WhatsApp Handoff
1. **Trigger**: Typeform / Web Lead capture submitted.
2. **Process**: Moses AI analyzes budget & service match (< 2 sec).
3. **Score**: If Score > 75 -> Tag as HOT LEAD.
4. **Action**: WhatsApp Cloud API sends instant conversational greeting + asks 1 qualifying question.
5. **Notification**: Send Telegram / Push alert to Nate with full prospect dossier.
6. **CRM**: Automatically logs into Pipeline database.

The architecture is documented in the **SYSTEMS** tab, but no live workflow execution is connected yet. I won't claim an automation ran when it did not.`;
    } else if (lower.includes("trend") || lower.includes("research")) {
      intent = "MARKET_RESEARCH";
      reply = `RESEARCH REQUIRED, skeem. Live research is not connected to MOSES yet, so I won't present a trend, statistic, or market claim as current fact. Connect a research source or provide the target/topic and I can work from verified evidence.`;
    } else {
      const count = context?.leadCount ?? 0;
      const followUps = context?.hotLeads ?? 0;
      const pipelineVal = context?.pipelineValue ?? 0;

      reply = `All systems nominal, Nate. I've processed your command: "${message}". 

${count > 0 
  ? `Current OS diagnostic shows ${count} active pipeline opportunities (R${pipelineVal.toLocaleString()} value) and ${followUps} priority follow-ups due today.` 
  : 'Operating system is in default standby mode with zero active pipeline records.'} What's the priority move, skeem?`;
    }

    return NextResponse.json({
      reply,
      intent,
      provider: "moses-neural-heuristics",
      status: "ONLINE",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "MOSES Core telemetry timeout. Recalibrating." },
      { status: 500 }
    );
  }
}
