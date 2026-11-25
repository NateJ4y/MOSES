import { describe, expect, it } from 'vitest';
import { buildAssistPrompt, parseAssistReply, runSkeemAssist } from './skeem-assist';
import type { OutreachRecord } from '../skeem';

const lead = { id: 'L1', business: 'Acme Bakery', status: 'CONTACTED', priceRegion: 'SOUTH_AFRICA' as const, problem: 'Slow website', problemVerified: true };
const T = Date.parse('2026-11-04T08:00:00Z');

describe('SKEEM coach', () => {
  it('builds a prompt from server-side facts: region price, cadence, history and untrusted markers', () => {
    const outreach: OutreachRecord[] = [{ id: 'o1', leadId: 'L1', stage: 'OPENING', channel: 'WHATSAPP', direction: 'OUTBOUND', sequence: 'COLD',
      content: 'Hi there', status: 'SENT', createdAt: '2026-11-02T09:00:00Z', sentAt: '2026-11-02T09:00:00Z' }];
    const { prompt, cold } = buildAssistPrompt({ lead, outreach, activities: [], request: { message: 'They went quiet', channel: 'WHATSAPP', tone: 'FRIENDLY' }, now: T });
    expect(prompt).toContain('R1,600');
    expect(prompt).toContain('<user_message>'); expect(prompt).toContain('They went quiet');
    expect(prompt).toContain('Hi there');
    expect(cold.state).toBe('IN_PROGRESS');
    expect(prompt).toContain('Wednesday');
  });
  it('never puts an unchecked concept link in the prompt', () => {
    const { prompt } = buildAssistPrompt({ lead: { ...lead, conceptStatus: 'REQUESTED', conceptUrl: 'https://secret.example/x' }, outreach: [], activities: [], request: { message: 'hi', channel: 'EMAIL', tone: 'NATURAL' }, now: T });
    expect(prompt).not.toContain('secret.example');
  });
  it('parses structured output, lints each draft and blocks a false concept claim', () => {
    const json = JSON.stringify({
      headline: 'Quiet since Monday', stage: { id: 'OPENING', reason: 'No reply yet' }, advice: 'Send the soft nudge on Thursday.',
      drafts: [{ label: 'Nudge', channel: 'WHATSAPP', body: 'Here is the concept for you' }, { label: 'Alt', channel: 'WHATSAPP', body: 'Quick nudge, R1,600 is the price.' }],
      nextAction: { text: 'Soft nudge', dueInDays: 3 }, signals: { sentiment: 'NONE', optOutDetected: false, objection: null }, warnings: [], needsFromYou: []
    });
    const r = parseAssistReply('```json\n' + json + '\n```', lead, 'WHATSAPP', 'they went quiet');
    expect(r.status).toBe('ONLINE'); expect(r.stage?.id).toBe('OPENING'); expect(r.drafts.length).toBe(2);
    expect(r.drafts[0].blocked).toBe(true);
    expect(r.drafts[1].blocked).toBe(false); expect(r.drafts[1].lint).toEqual([]);
    expect(r.nextAction?.dueInDays).toBe(3);
  });
  it('detects an opt-out in the user message even if the model misses it', () => {
    const r = parseAssistReply(JSON.stringify({ headline: 'x', advice: 'y', drafts: [] }), lead, 'WHATSAPP', 'He said please stop messaging me');
    expect(r.signals.optOutDetected).toBe(true);
  });
  it('degrades safely when the model returns plain text or an invalid stage', () => {
    const plain = parseAssistReply('Just send a nudge.', lead, 'EMAIL', 'help');
    expect(plain.drafts).toEqual([]); expect(plain.warnings.length).toBe(1);
    const badStage = parseAssistReply(JSON.stringify({ headline: 'h', stage: { id: 'MADE_UP' }, advice: 'a' }), lead, 'EMAIL', 'help');
    expect(badStage.stage).toBeNull();
  });
  it('refuses without calling the AI when the lead has opted out', async () => {
    const r = await runSkeemAssist({ lead: { ...lead, contactRestriction: 'OPT_OUT' }, outreach: [], activities: [], request: { message: 'draft', channel: 'EMAIL', tone: 'NATURAL' } });
    expect(r.status).toBe('BLOCKED'); expect(r.drafts).toEqual([]);
  });
});
