import { describe, expect, it } from 'vitest';
import { buildMosesContext, selectRelevantCollections, serializeMosesContext } from './index';
import { summariseSkeemPipeline, type OutreachRecord } from '../skeem';

describe('SKEEM in the AI context', () => {
  it('pulls leads, outreach, activities and messages for SKEEM questions', () => {
    const picked = selectRelevantCollections('Who is due a follow-up or nudge today?', 'COMMAND');
    for (const c of ['leads', 'outreach', 'activities', 'messages']) expect(picked).toContain(c);
  });
  it('carries a compact digest and stays within the prompt budget with 30 leads', () => {
    const now = Date.parse('2026-11-25T08:00:00Z');
    const leads = Array.from({ length: 30 }, (_, i) => ({
      id: `L${i}`, business: `Business number ${i} with a fairly long name`, status: 'CONTACTED', skeemStage: 'OPENING' as const,
      nextAction: 'Send the soft nudge and check the last reply carefully', followUpDate: '2026-11-20'
    }));
    const outreach: OutreachRecord[] = leads.map((l, i) => ({
      id: `o${i}`, leadId: l.id, stage: 'OPENING', channel: 'WHATSAPP', direction: 'OUTBOUND', sequence: 'COLD', content: 'x'.repeat(500),
      status: 'SENT', createdAt: '2026-11-10T08:00:00Z', sentAt: '2026-11-10T08:00:00Z'
    }));
    const digest = summariseSkeemPipeline(leads, outreach, now);
    expect(digest.leadsConsidered).toBe(30);
    expect(digest.leads.length).toBe(10);
    const records = leads.map((l) => ({ ...l, notes: 'n'.repeat(400) }));
    const context = buildMosesContext({ activeSection: 'OUTREACH', collections: { leads: { records }, outreach: { records: outreach } }, skeem: digest });
    const text = serializeMosesContext(context);
    expect(context.skeem).toBeTruthy();
    expect(text.length).toBeLessThanOrEqual(16_000);
    expect(digest.totals.sequencesToStop + digest.totals.overdueColdTouches).toBeGreaterThan(0);
  });
});
