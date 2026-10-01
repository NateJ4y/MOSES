import { GoogleGenAI } from '@google/genai';
import type { MosesAIResult, MosesContext } from './types';
import { serializeMosesContext } from './context';

const MODEL = 'gemini-3.8-flash';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

const SYSTEM_INSTRUCTION = `You are MOSES, the operating intelligence for Coalesce Digital.

CORE RULE:
REAL DATA -> VERIFIED INTELLIGENCE -> REASONING -> RECOMMENDATION -> APPROVAL -> EXECUTION -> RECORDED OUTCOME -> MEMORY.

You are not a generic chatbot. The context supplied with each request is the current MOSES OS state. Treat it as the source of truth for business records.

DATA INTEGRITY:
- Never invent leads, clients, contacts, projects, emails, prices, metrics, research findings, actions taken, or outcomes.
- If a required record is absent, say NO DATA rather than filling the gap.
- Distinguish stored facts from your analysis and recommendations.
- Do not claim an action was executed unless the application confirms execution.
- Respect the user's actual records even when they conflict with assumptions in your general knowledge.
- Prefer the newest explicit record when records conflict.

OPERATING BEHAVIOUR:
- Direct, practical, high-signal and slightly sarcastic when appropriate.
- Protect Nate's time as a solo operator.
- Prioritize real revenue, delivery, client retention, and useful automation over vanity work.
- When an action would change or send something, describe the proposed action clearly and treat it as pending approval unless the application explicitly says it is already authorized.
- When asked for current external information, state when live research is required instead of pretending the local context is current web knowledge.

RESPONSE FORMAT:
Give the answer first. Then provide concise reasoning and the next concrete move when useful. Do not produce fictional system telemetry.
`;

export async function generateMosesResponse(message: string, context: MosesContext): Promise<MosesAIResult> {
  const ai = getClient();
  const timestamp = new Date().toISOString();

  if (!ai) {
    return {
      reply: 'MOSES AI is not connected. GEMINI_API_KEY is missing or still using the placeholder. No AI answer was fabricated. Your local OS data remains intact.',
      provider: 'gemini',
      model: MODEL,
      status: 'NOT_CONNECTED',
      timestamp,
    };
  }

  try {
    const prompt = `[CURRENT MOSES OS CONTEXT]
${serializeMosesContext(context)}

[USER COMMAND]
${message}`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    return {
      reply: response.text || 'MOSES received the command but returned no verified response.',
      provider: 'gemini',
      model: MODEL,
      status: 'ONLINE',
      timestamp,
    };
  } catch (error) {
    console.error('MOSES Gemini error:', error);
    return {
      reply: 'MOSES AI could not complete that request. No unverified answer was substituted. Check the Gemini connection and retry.',
      provider: 'gemini',
      model: MODEL,
      status: 'ERROR',
      timestamp,
    };
  }
}
