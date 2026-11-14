import { NextResponse } from 'next/server';
import { dbConfigured, dbRequest } from '@/lib/db/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasGroqKey = Boolean(
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY !== 'MY_GROQ_API_KEY'
  );

  let database: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR' = 'NOT_CONFIGURED';
  if (dbConfigured) {
    try {
      await dbRequest('workspaces?select=id&limit=1', { method: 'GET' });
      database = 'CONNECTED';
    } catch {
      database = 'ERROR';
    }
  }

  return NextResponse.json({
    status: 'ONLINE',
    aiCore: hasGroqKey ? 'CONFIGURED' : 'NOT_CONFIGURED',
    database,
    version: '2.5.0-COALESCE-OS',
    uptime: typeof process.uptime === 'function' ? process.uptime() : 0
  });
}
