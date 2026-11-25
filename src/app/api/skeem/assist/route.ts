import { NextResponse } from 'next/server';
import {
  dbConfigured, getAuthenticatedUser, getWorkspaceMembership, isSameOriginRequest, listRecords,
  resolveWorkspaceForUser, WorkspaceAuthorizationError
} from '@/lib/db/server';
import { runSkeemAssist, type AssistTone } from '@/lib/ai/skeem-assist';
import type { ActivityRecord, OutreachChannel, OutreachRecord, SkeemLeadLike } from '@/lib/skeem';

export const dynamic = 'force-dynamic';

const CHANNELS = ['EMAIL', 'WHATSAPP', 'PHONE', 'INSTAGRAM', 'LINKEDIN', 'OTHER'];
const TONES = ['NATURAL', 'FRIENDLY', 'DIRECT', 'PROFESSIONAL'];
const SEQUENCES = ['COLD', 'POST_CONCEPT', 'OTHER'];

// The SKEEM Coach. The lead and its history are read from the database on the
// server (never trusted from the browser). The reply is only a suggestion:
// this route never writes records and never sends anything.
export async function POST(req: Request) {
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    if (!dbConfigured) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
    const workspaceId = await resolveWorkspaceForUser(user.id);
    const membership = await getWorkspaceMembership(user.id, workspaceId);
    if (!membership) throw new WorkspaceAuthorizationError('You do not have access to this workspace.');

    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const leadId = typeof body.leadId === 'string' ? body.leadId : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!leadId) return NextResponse.json({ error: 'leadId is required.' }, { status: 400 });
    if (!message) return NextResponse.json({ error: 'Tell the coach what you need.' }, { status: 400 });
    if (message.length > 6000) return NextResponse.json({ error: 'Message must be 6,000 characters or fewer.' }, { status: 413 });
    const channel = CHANNELS.includes(String(body.channel)) ? body.channel as OutreachChannel : 'WHATSAPP';
    const tone = TONES.includes(String(body.tone)) ? body.tone as AssistTone : 'NATURAL';
    const sequence = SEQUENCES.includes(String(body.sequence)) ? body.sequence as 'COLD' | 'POST_CONCEPT' | 'OTHER' : 'COLD';

    const [leads, outreach, activities] = await Promise.all([
      listRecords('leads', workspaceId, 500),
      listRecords('outreach', workspaceId, 500),
      listRecords('activities', workspaceId, 500)
    ]);
    const lead = (leads as Array<SkeemLeadLike & Record<string, unknown>>).find((l) => l.id === leadId);
    if (!lead) return NextResponse.json({ error: 'That lead was not found in this workspace.' }, { status: 404 });

    const result = await runSkeemAssist({
      lead, outreach: outreach as OutreachRecord[], activities: activities as ActivityRecord[],
      request: { message, channel, tone, sequence }
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof WorkspaceAuthorizationError) return NextResponse.json({ error: error.message, code: error.code }, { status: 403 });
    console.error('SKEEM assist route error:', error);
    return NextResponse.json({ error: 'The SKEEM coach could not complete that request.' }, { status: 500 });
  }
}
