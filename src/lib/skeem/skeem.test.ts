import { describe, expect, it } from 'vitest';
import {
  conceptChangeAllowed, PRICEBOOK, COMMISSION_RATE, addCountingDays, isCountingDay, lintDraft, suggestPriceRegion, priceFor,
  SKEEM_STAGES, canContact, canMarkWon, coldSequenceStatus, conceptCanBeShared, getSkeemStage,
  isSkeemRelated, postConceptFollowUp, skeemSystemInstructions, stageAdvanceCheck,
  summariseSkeemPipeline, type OutreachRecord
} from './index';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse('2026-11-02T09:00:00Z'); // a Monday
const iso = (ms: number) => new Date(ms).toISOString();

function sent(id: string, leadId: string, at: number, extra: Partial<OutreachRecord> = {}): OutreachRecord {
  return { id, leadId, stage: 'OPENING', channel: 'WHATSAPP', direction: 'OUTBOUND', sequence: 'COLD',
    content: 'x', status: 'SENT', createdAt: iso(at), sentAt: iso(at), ...extra };
}
const reply = (id: string, leadId: string, at: number): OutreachRecord => ({
  id, leadId, stage: 'OPENING', channel: 'WHATSAPP', direction: 'INBOUND', content: 'hi', status: 'RECEIVED', createdAt: iso(at)
});

describe('stages', () => {
  it('has exactly the seven SKEEM stages in order', () => {
    expect(SKEEM_STAGES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(SKEEM_STAGES.map((s) => s.name)).toEqual([
      'Research & Preparation', 'Opening the Conversation', 'Discovery & Understanding',
      'Connecting the Opportunity', 'The Skeem', 'Presentation & Closing', 'Follow-up & Client Handover'
    ]);
    expect(getSkeemStage('THE_SKEEM').intent).toMatch(/not a free finished website/i);
  });
  it('generates AI instructions from the same definitions', () => {
    const text = skeemSystemInstructions();
    for (const stage of SKEEM_STAGES) expect(text).toContain(stage.name);
    expect(text).toMatch(/Claim, contact, update/);
    expect(text).toMatch(/Use the price for the lead's recorded priceRegion only/);
  });
});

describe('cold cadence (Day 1, Day 4, Day 10)', () => {
  const lead = { contactRestriction: 'NONE' as const };
  it('is not started with no sent touches, and drafts do not count', () => {
    const draft = sent('d', 'L', T0, { status: 'DRAFT', sentAt: undefined });
    const s = coldSequenceStatus(lead, [draft], T0);
    expect(s.state).toBe('NOT_STARTED');
    expect(s.next).toBe('FIRST_OUTREACH');
  });
  it('schedules the soft nudge for Day 4 and the final touch for Day 10', () => {
    const first = sent('1', 'L', T0);
    const a = coldSequenceStatus(lead, [first], T0 + 2 * DAY);
    expect(a.next).toBe('SOFT_NUDGE'); expect(a.due).toBe(false); expect(a.dueAt).toBe(iso(T0 + 3 * DAY)); // Thursday
    const b = coldSequenceStatus(lead, [first], T0 + 5 * DAY);
    expect(b.due).toBe(true); expect(b.overdueDays).toBe(2);
    const second = sent('2', 'L', T0 + 3 * DAY);
    const c = coldSequenceStatus(lead, [first, second], T0 + 8 * DAY);
    // Day 10 counts Monday to Saturday, so the Sunday in between is skipped: Thursday of the next week.
    expect(c.next).toBe('FINAL_TOUCH'); expect(c.due).toBe(false); expect(c.dueAt).toBe(iso(T0 + 10 * DAY));
  });
  it('stops after three unanswered touches and allows re-engagement after 60 days', () => {
    const recs = [sent('1', 'L', T0), sent('2', 'L', T0 + 3 * DAY), sent('3', 'L', T0 + 10 * DAY)];
    const s = coldSequenceStatus(lead, recs, T0 + 20 * DAY);
    expect(s.state).toBe('EXHAUSTED'); expect(s.shouldStop).toBe(true); expect(s.next).toBeNull();
    expect(s.reengagementEligibleFrom).toBe(iso(T0 + 10 * DAY + 60 * DAY));
  });
  it('ends the cold sequence when the prospect replies', () => {
    const s = coldSequenceStatus(lead, [sent('1', 'L', T0), reply('r', 'L', T0 + DAY)], T0 + 6 * DAY);
    expect(s.state).toBe('REPLIED'); expect(s.next).toBeNull(); expect(s.shouldStop).toBe(false);
  });
  it('opt-out overrides everything, including a due follow-up', () => {
    const optedOut = { contactRestriction: 'OPT_OUT' as const };
    expect(canContact(optedOut)).toBe(false);
    const s = coldSequenceStatus(optedOut, [sent('1', 'L', T0)], T0 + 30 * DAY);
    expect(s.state).toBe('BLOCKED_OPT_OUT'); expect(s.next).toBeNull(); expect(s.due).toBe(false);
  });
  it('skips Sundays when counting: a Friday first touch gets its nudge on Tuesday', () => {
    const friday = T0 + 4 * DAY; // Fri 6 Nov
    const s = coldSequenceStatus(lead, [sent('1', 'L', friday)], friday + DAY);
    expect(s.dueAt).toBe(iso(friday + 4 * DAY)); // Sat, (Sun skipped), Mon, Tue
    expect(new Date(s.dueAt as string).getUTCDay()).toBe(2);
  });
  it('never schedules a touch on a Sunday', () => {
    for (let start = 0; start < 14; start++) {
      for (const n of [3, 9]) expect(isCountingDay(addCountingDays(T0 + start * DAY, n))).toBe(true);
    }
  });
  it('ignores post-concept records so the two cadences never merge', () => {
    const post = sent('p', 'L', T0, { sequence: 'POST_CONCEPT' });
    expect(coldSequenceStatus(lead, [post], T0).state).toBe('NOT_STARTED');
  });
});

describe('post-concept cadence', () => {
  const deliveredAt = iso(T0);
  it('positive: prepare the proposal within 24 hours', () => {
    const r = postConceptFollowUp({ deliveredAt, response: 'POSITIVE', respondedAt: iso(T0 + 3600_000) }, T0 + 7200_000)!;
    expect(r.action).toBe('PREPARE_PROPOSAL'); expect(r.latestAt).toBe(iso(T0 + 3600_000 + 24 * 3600_000));
  });
  it('neutral: ask a specific question after 48 to 72 hours', () => {
    const r1 = postConceptFollowUp({ deliveredAt, response: 'NEUTRAL' }, T0 + 24 * 3600_000)!;
    expect(r1.action).toBe('ASK_SPECIFIC_QUESTION'); expect(r1.due).toBe(false);
    expect(postConceptFollowUp({ deliveredAt, response: 'NEUTRAL' }, T0 + 49 * 3600_000)!.due).toBe(true);
  });
  it('no response: short yes/no follow-up after 72 hours', () => {
    expect(postConceptFollowUp({ deliveredAt, response: 'NONE' }, T0 + 71 * 3600_000)!.due).toBe(false);
    const r = postConceptFollowUp({ deliveredAt, response: 'NONE' }, T0 + 72 * 3600_000)!;
    expect(r.action).toBe('SEND_YES_NO_FOLLOW_UP'); expect(r.due).toBe(true);
  });
});

describe('stage gating and commercial truthfulness', () => {
  it('blocks the concept stage until a need is verified', () => {
    expect(stageAdvanceCheck({ id: 'L', problem: 'Slow website' }, 'THE_SKEEM').blockers.length).toBe(1);
    expect(stageAdvanceCheck({ id: 'L', problem: 'Slow website', problemVerified: true }, 'THE_SKEEM').blockers).toEqual([]);
    expect(stageAdvanceCheck({ id: 'L', problem: 'Unknown', problemVerified: true }, 'THE_SKEEM').blockers.length).toBe(1);
  });
  it('blocks contact stages for an opted-out lead but allows research', () => {
    const lead = { id: 'L', contactRestriction: 'OPT_OUT' as const };
    expect(stageAdvanceCheck(lead, 'OPENING').blockers.length).toBe(1);
    expect(stageAdvanceCheck(lead, 'RESEARCH_PREP').blockers).toEqual([]);
  });
  it('warns, but does not block, presenting without a delivered concept or handing over unpaid', () => {
    expect(stageAdvanceCheck({ id: 'L' }, 'PRESENTATION_CLOSING').warnings.length).toBe(1);
    expect(stageAdvanceCheck({ id: 'L' }, 'FOLLOW_UP_HANDOVER').warnings.length).toBe(1);
  });
  it('requires verified payment before a lead can be marked won', () => {
    expect(canMarkWon({ paymentVerificationStatus: 'AWAITING_PAYMENT' }).ok).toBe(false);
    expect(canMarkWon({}).ok).toBe(false);
    expect(canMarkWon({ paymentVerificationStatus: 'VERIFIED' }).ok).toBe(true);
  });
  it('treats a concept as shareable only when checked and linked', () => {
    expect(conceptCanBeShared({ conceptStatus: 'REQUESTED', conceptUrl: 'https://x.co' })).toBe(false);
    expect(conceptCanBeShared({ conceptStatus: 'QUALITY_CHECKED' })).toBe(false);
    expect(conceptCanBeShared({ conceptStatus: 'QUALITY_CHECKED', conceptUrl: 'https://x.co' })).toBe(true);
  });
});

describe('AI pipeline digest and routing', () => {
  it('summarises stage, cadence and drafts from saved records, most urgent first', () => {
    const leads = [
      { id: 'A', business: 'Alpha', status: 'CONTACTED', skeemStage: 'OPENING' as const },
      { id: 'B', business: 'Bravo', status: 'NEW' },
      { id: 'C', business: 'Charlie', status: 'WON' }
    ];
    const outreach = [sent('1', 'A', T0), sent('d', 'B', T0, { status: 'DRAFT', sentAt: undefined })];
    const d = summariseSkeemPipeline(leads, outreach, T0 + 5 * DAY);
    expect(d.leadsConsidered).toBe(2);
    expect(d.leads[0].business).toBe('Alpha');
    expect(d.leads[0].coldSequence.due).toBe(true);
    expect(d.leads[1].skeemStage).toBe('NOT_SET');
    expect(d.leads[1].draftsPending).toBe(1);
    expect(d.totals.overdueColdTouches).toBe(1);
  });
  it('routes SKEEM language to the SKEEM context', () => {
    expect(isSkeemRelated('Who is due a follow-up today?')).toBe(true);
    expect(isSkeemRelated('what is a concept for Alpha')).toBe(true);
    expect(isSkeemRelated('tell me a joke')).toBe(false);
    expect(isSkeemRelated('anything', 'OUTREACH')).toBe(true);
  });
});

describe('pricebook and commission (confirmed by the owner)', () => {
  it('has the three regional price points', () => {
    expect(PRICEBOOK.SOUTH_AFRICA).toMatchObject({ currency: 'ZAR', amount: 1600 });
    expect(PRICEBOOK.AFRICA).toMatchObject({ currency: 'USD', amount: 100 });
    expect(PRICEBOOK.INTERNATIONAL).toMatchObject({ currency: 'USD', amount: 1000 });
    expect(COMMISSION_RATE).toBe(0.15);
  });
  it('only suggests a region from clear location text and never assumes one', () => {
    expect(suggestPriceRegion('Johannesburg, Gauteng')).toBe('SOUTH_AFRICA');
    expect(suggestPriceRegion('Harare, Zimbabwe')).toBe('AFRICA');
    expect(suggestPriceRegion('London, UK')).toBe('INTERNATIONAL');
    expect(suggestPriceRegion('Somewhere')).toBeNull();
    expect(priceFor(undefined)).toBeNull();
  });
  it('tells the AI the confirmed prices and that scope and billing are unrecorded', () => {
    const text = skeemSystemInstructions();
    expect(text).toMatch(/R1,600/); expect(text).toMatch(/\$1,000/); expect(text).toMatch(/15%/);
    expect(text).toMatch(/Monday to Saturday/); expect(text).toMatch(/super admin approves every concept/);
  });
});

describe('draft linting', () => {
  const base = { id: 'L' };
  it('blocks any draft for an opted-out lead', () => {
    expect(lintDraft('Hi', { ...base, contactRestriction: 'OPT_OUT' }).some((l) => l.level === 'block')).toBe(true);
  });
  it('blocks claiming a concept exists when none is checked and linked', () => {
    expect(lintDraft('Here is the concept for you', base).some((l) => l.level === 'block')).toBe(true);
    const ok = { ...base, conceptStatus: 'DELIVERED' as const, conceptUrl: 'https://c.co/x' };
    expect(lintDraft('Here is the concept: https://c.co/x', ok)).toEqual([]);
  });
  it('flags a price that does not match the lead\'s region, or an unset region', () => {
    expect(lintDraft('It is R1,600', { ...base, priceRegion: 'SOUTH_AFRICA' })).toEqual([]);
    expect(lintDraft('It is R2,000', { ...base, priceRegion: 'SOUTH_AFRICA' }).length).toBe(1);
    expect(lintDraft('It is $100', base)[0].message).toMatch(/region is not set/);
    expect(lintDraft('It is $1,000', { ...base, priceRegion: 'INTERNATIONAL' })).toEqual([]);
  });
  it('flags a free finished website and unknown links', () => {
    expect(lintDraft('We build a free website for you', base).length).toBe(1);
    expect(lintDraft('See https://other.co', base).length).toBe(1);
  });
});

describe('concept approval belongs to the super admin', () => {
  it('lets anyone request a concept but not approve it', () => {
    expect(conceptChangeAllowed({ conceptStatus: 'NONE' }, { conceptStatus: 'REQUESTED' }, false).ok).toBe(true);
    expect(conceptChangeAllowed({ conceptStatus: 'REQUESTED' }, { conceptStatus: 'APPROVED' }, false).ok).toBe(false);
    expect(conceptChangeAllowed({ conceptStatus: 'REQUESTED' }, { conceptStatus: 'DELIVERED' }, false).ok).toBe(false);
  });
  it('lets the super admin approve and set a turnaround', () => {
    expect(conceptChangeAllowed({ conceptStatus: 'REQUESTED' }, { conceptStatus: 'APPROVED', conceptDueDate: '2026-12-01' }, true).ok).toBe(true);
  });
  it('blocks a non-admin from setting or changing a turnaround, but not from keeping it', () => {
    expect(conceptChangeAllowed({ conceptStatus: 'APPROVED' }, { conceptStatus: 'APPROVED', conceptDueDate: '2026-12-09' }, false).ok).toBe(false);
    const prev = { conceptStatus: 'APPROVED' as const, conceptDueDate: '2026-12-01' };
    expect(conceptChangeAllowed(prev, { ...prev }, false).ok).toBe(true);
  });
  it('lets a non-admin move an already-approved concept forward', () => {
    expect(conceptChangeAllowed({ conceptStatus: 'APPROVED' }, { conceptStatus: 'IN_CREATION' }, false).ok).toBe(true);
  });
  it('does not affect leads that have no concept data (existing leads keep saving)', () => {
    expect(conceptChangeAllowed(undefined, {}, false).ok).toBe(true);
  });
});
