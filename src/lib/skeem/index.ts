/**
 * SKEEM — Coalesce Digital's seven-stage sales methodology.
 *
 * This module is the single source of truth shared by the Outreach UI and the
 * AI. It is pure TypeScript (no React, no Node APIs) so it can run in the
 * browser, in API routes and in tests.
 *
 * Source: COALESCE-SKEEM-Script-Sheet.pptx as summarised in the MOSES handoff.
 * Anything the product owner has NOT confirmed (prices, commission on
 * recurring payments, concept approval owner, turnaround, regional pricebooks)
 * is deliberately NOT encoded here. See OPEN_POLICIES.
 */

export const SKEEM_VERSION = 1;
export const SKEEM_PRINCIPLE = 'Claim, contact, update.';

// ---------------------------------------------------------------- stages ----

export type SkeemStageId =
  | 'RESEARCH_PREP'
  | 'OPENING'
  | 'DISCOVERY'
  | 'CONNECTING'
  | 'THE_SKEEM'
  | 'PRESENTATION_CLOSING'
  | 'FOLLOW_UP_HANDOVER';

export interface SkeemStage {
  number: number;
  id: SkeemStageId;
  name: string;
  intent: string;
  yourMove: string;
  advanceWhen: string;
  guardrails: string[];
  nextActions: string[];
}

export const SKEEM_STAGES: readonly SkeemStage[] = [
  {
    number: 1, id: 'RESEARCH_PREP', name: 'Research & Preparation',
    intent: 'Research, qualify, and claim a lead.',
    yourMove: 'Check the business is real and active, find the right contact route, and note one specific, factual observation with its source and date.',
    advanceWhen: 'You have a qualified lead, a relevant contact route and an honest reason to reach out.',
    guardrails: [
      'Research before contacting; qualify rather than contact indiscriminately.',
      'Separate observed facts from assumptions. Never turn a guess into a problem statement.'
    ],
    nextActions: ['Verify the business and contact route', 'Record one sourced observation', 'Claim the lead and set the first outreach date']
  },
  {
    number: 2, id: 'OPENING', name: 'Opening the Conversation',
    intent: 'Start a genuine, personalised conversation.',
    yourMove: 'Send a short, personal opener anchored to something you actually checked. Ask one easy question. No prices, no service dump.',
    advanceWhen: 'The prospect replies or gives a natural opening to learn about their business.',
    guardrails: [
      'Personalise honestly; never fabricate a compliment or imply research you did not do.',
      'Respect a clear no or any request to stop contact.'
    ],
    nextActions: ['Save the opener as a draft', 'Send it yourself, then record it as sent', 'Follow the cold-outreach cadence if there is no reply']
  },
  {
    number: 3, id: 'DISCOVERY', name: 'Discovery & Understanding',
    intent: 'Understand actual business needs, pain points and goals.',
    yourMove: 'Ask open questions. Listen for impact, current process, urgency and what they have tried. Record their words accurately.',
    advanceWhen: 'The prospect has described a specific need, challenge or goal, and you have recorded it as verified.',
    guardrails: [
      'Discovery comes before pitching.',
      'Only state a business problem when it is verified or the prospect described it.'
    ],
    nextActions: ['Record the prospect\'s own words', 'Mark the problem as verified', 'Note urgency and decision-maker']
  },
  {
    number: 4, id: 'CONNECTING', name: 'Connecting the Opportunity',
    intent: 'Connect a verified need to a relevant Coalesce solution and offer a concept.',
    yourMove: 'Reflect the need back, connect one proportionate service to it, and ask whether they would like a concept prepared.',
    advanceWhen: 'The prospect agrees the solution is relevant and gives permission to prepare a concept.',
    guardrails: [
      'Only connect a need that is verified.',
      'Ask permission before preparing a concept where the process requires it.',
      'Do not quote prices: there is no validated pricebook in MOSES yet.'
    ],
    nextActions: ['Reflect the stated need', 'Ask for permission to prepare a concept', 'Record the answer']
  },
  {
    number: 5, id: 'THE_SKEEM', name: 'The Skeem',
    intent: 'Request, create, quality-check and deliver a free, no-obligation concept. This is not a free finished website.',
    yourMove: 'Track the concept as separate states: requested, approved, in creation, quality-checked, delivered. Share it only when a usable link exists.',
    advanceWhen: 'The concept has been created, quality-checked and delivered with a working link, and the prospect has responded.',
    guardrails: [
      'A concept must actually exist, be checked and have a usable delivery link before MOSES says it is ready or delivered.',
      'Never describe a concept as a completed website or imply the finished service is free.',
      'A concept request is not a completed concept.'
    ],
    nextActions: ['Request the concept', 'Quality-check before sharing', 'Record the delivery link and delivery date']
  },
  {
    number: 6, id: 'PRESENTATION_CLOSING', name: 'Presentation & Closing',
    intent: 'Present a suitable package, handle objections, and work towards a decision.',
    yourMove: 'Present a package that fits the verified need, answer objections honestly, and agree a clear next step.',
    advanceWhen: 'The prospect gives a decision or agrees a dated next step.',
    guardrails: [
      'Handle objections honestly; never manufacture urgency.',
      'A verbal yes is not a confirmed sale.',
      'Quote only from a validated, versioned pricebook. None exists yet, so do not quote prices.'
    ],
    nextActions: ['Prepare the proposal', 'Record objections and answers', 'Agree and record the decision date']
  },
  {
    number: 7, id: 'FOLLOW_UP_HANDOVER', name: 'Follow-up & Client Handover',
    intent: 'Follow up systematically, verify payment, and hand the client into delivery.',
    yourMove: 'Follow up using the real last exchange. When they proceed, verify payment before treating the lead as won, then hand over to delivery.',
    advanceWhen: 'Payment is verified and the client is handed into delivery, or the lead is moved to Lost or Nurture.',
    guardrails: [
      'Do not mark a lead won until the payment or commercial confirmation has been verified.',
      'Do not merge the cold-outreach cadence with the post-concept cadence.',
      'An opt-out or clear no overrides every scheduled follow-up.'
    ],
    nextActions: ['Verify payment', 'Hand over to delivery', 'Record the outcome and what was learned']
  }
] as const;

export const SKEEM_GLOBAL_GUARDRAILS: readonly string[] = [
  'Research before contacting.',
  'Qualify leads rather than contacting indiscriminately.',
  'Personalise honestly; never fabricate compliments or pretend to have researched something that was not checked.',
  'Discovery comes before pitching.',
  'Only state a business problem when it has been verified or the prospect has described it.',
  'Respect objections, a clear no, and any request to stop contact.',
  'No automatic sending of WhatsApp, email or other outreach. A draft is not a sent message and copying a draft does not mark it as sent.',
  'Do not mark a lead won until the relevant payment or commercial confirmation has been verified.',
  'Every interaction has a clear next move, and every next move is recorded.'
];

/** Items the product owner has not confirmed. MOSES must not guess these. */
export const OPEN_POLICIES: readonly string[] = [
  'Prices and packages: no validated, versioned pricebook exists in MOSES. Do not quote prices.',
  'Commission: 15% on closed sales was the earlier plan, but commission on recurring payments is not confirmed. Do not calculate or promise it.',
  'Who approves concept requests, concept turnaround, onboarding and deposit terms, hosting/domain terms, and regional pricebooks are not confirmed.',
  'The cold-outreach day numbering (Day 1, Day 4, Day 10) is treated as calendar days counted from the first outreach (Day 1). Confirm this with the product owner.'
];

const STAGE_ORDER: SkeemStageId[] = SKEEM_STAGES.map((s) => s.id);

export function isSkeemStageId(value: unknown): value is SkeemStageId {
  return typeof value === 'string' && (STAGE_ORDER as string[]).includes(value);
}
export function getSkeemStage(id: SkeemStageId): SkeemStage {
  return SKEEM_STAGES[STAGE_ORDER.indexOf(id)];
}
export function skeemStageIndex(id: SkeemStageId): number {
  return STAGE_ORDER.indexOf(id);
}

// ----------------------------------------------------------- shared types ----

export type ContactRestriction = 'NONE' | 'OPT_OUT';
export type ConceptStatus = 'NONE' | 'REQUESTED' | 'APPROVED' | 'IN_CREATION' | 'QUALITY_CHECKED' | 'DELIVERED';
export type ProposalStatus = 'NONE' | 'DRAFTED' | 'PRESENTED' | 'ACCEPTED_VERBALLY' | 'DECLINED';
export type PaymentVerificationStatus = 'NOT_REQUESTED' | 'AWAITING_PAYMENT' | 'VERIFIED';

export type OutreachChannel = 'EMAIL' | 'WHATSAPP' | 'PHONE' | 'INSTAGRAM' | 'LINKEDIN' | 'OTHER';
export type OutreachDirection = 'OUTBOUND' | 'INBOUND';
export type OutreachStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';
/** COLD and POST_CONCEPT are different cadences and are never merged. */
export type OutreachSequence = 'COLD' | 'POST_CONCEPT' | 'OTHER';

export interface OutreachRecord {
  id: string;
  leadId: string;
  stage: SkeemStageId;
  channel: OutreachChannel;
  direction: OutreachDirection;
  sequence?: OutreachSequence;
  content: string;
  subject?: string;
  status: OutreachStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  sentAt?: string;
  notes?: string;
}

export type ActivityType =
  | 'STAGE_CHANGED'
  | 'DRAFT_SAVED'
  | 'OUTREACH_SENT'
  | 'REPLY_RECEIVED'
  | 'DRAFT_CANCELLED'
  | 'OPT_OUT_RECORDED'
  | 'OPT_OUT_CLEARED'
  | 'PROBLEM_VERIFIED'
  | 'CONCEPT_STATUS_CHANGED'
  | 'PROPOSAL_STATUS_CHANGED'
  | 'PAYMENT_STATUS_CHANGED'
  | 'FOLLOW_UP_SET'
  | 'NOTE';

export interface ActivityRecord {
  id: string;
  leadId: string;
  type: ActivityType;
  summary: string;
  detail?: string;
  stage?: SkeemStageId;
  at: string;
  actor?: string;
}

/** The minimum lead shape the SKEEM logic needs. The app's Lead satisfies it. */
export interface SkeemLeadLike {
  id: string;
  business?: string;
  status?: string;
  problem?: string;
  problemVerified?: boolean;
  skeemStage?: SkeemStageId;
  contactRestriction?: ContactRestriction;
  conceptStatus?: ConceptStatus;
  conceptUrl?: string;
  proposalStatus?: ProposalStatus;
  paymentVerificationStatus?: PaymentVerificationStatus;
  nextAction?: string;
  followUpDate?: string;
  lastContact?: string;
}

// --------------------------------------------------------------- helpers ----

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function toMs(value: Date | number | string | undefined | null): number | null {
  if (value == null || value === '') return null;
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function isUnknownText(value?: string): boolean {
  const v = (value || '').trim();
  return !v || /^(unknown|not recorded|not set|none|n\/a|requires discovery|not documented)/i.test(v);
}

export function canContact(lead: Pick<SkeemLeadLike, 'contactRestriction'>): boolean {
  return lead.contactRestriction !== 'OPT_OUT';
}

// ------------------------------------------------------- cold-out cadence ----

/** Calendar-day offsets from the first outreach: Day 1, Day 4, Day 10. */
export const COLD_TOUCH_OFFSET_DAYS = [0, 3, 9] as const;
export const COLD_TOUCH_NAMES = ['FIRST_OUTREACH', 'SOFT_NUDGE', 'FINAL_TOUCH'] as const;
export type ColdTouchName = (typeof COLD_TOUCH_NAMES)[number];
export const REENGAGEMENT_DAYS = 60;

export type ColdSequenceState =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'REPLIED'
  | 'EXHAUSTED'
  | 'BLOCKED_OPT_OUT';

export interface ColdSequenceStatus {
  state: ColdSequenceState;
  touchesSent: number;
  firstSentAt: string | null;
  lastSentAt: string | null;
  next: ColdTouchName | null;
  dueAt: string | null;
  due: boolean;
  overdueDays: number;
  /** After three unanswered touches the sequence stops: move to Lost or Nurture. */
  shouldStop: boolean;
  reengagementEligibleFrom: string | null;
  note: string;
}

function recordTime(r: OutreachRecord): number | null {
  return toMs(r.sentAt) ?? toMs(r.createdAt);
}

export function coldSequenceStatus(
  lead: Pick<SkeemLeadLike, 'contactRestriction'>,
  records: OutreachRecord[],
  now: Date | number = Date.now()
): ColdSequenceStatus {
  const nowMs = toMs(now) ?? Date.now();
  const base = {
    touchesSent: 0, firstSentAt: null, lastSentAt: null, next: null, dueAt: null,
    due: false, overdueDays: 0, shouldStop: false, reengagementEligibleFrom: null
  };

  const sent = records
    .filter((r) => r.sequence === 'COLD' && r.direction === 'OUTBOUND' && r.status === 'SENT')
    .map((r) => ({ r, t: recordTime(r) }))
    .filter((x): x is { r: OutreachRecord; t: number } => x.t != null)
    .sort((a, b) => a.t - b.t);

  const firstT = sent[0]?.t ?? null;
  const lastT = sent[sent.length - 1]?.t ?? null;
  const iso = (t: number | null) => (t == null ? null : new Date(t).toISOString());

  if (!canContact(lead)) {
    return { ...base, state: 'BLOCKED_OPT_OUT', touchesSent: sent.length, firstSentAt: iso(firstT), lastSentAt: iso(lastT),
      note: 'Contact restriction recorded. No outreach or scheduled follow-up may be sent.' };
  }
  if (!sent.length) {
    return { ...base, state: 'NOT_STARTED', next: 'FIRST_OUTREACH', due: true,
      note: 'No cold outreach has been recorded as sent.' };
  }

  const replied = records.some((r) => r.direction === 'INBOUND' && r.status === 'RECEIVED' && (recordTime(r) ?? 0) >= (firstT as number));
  if (replied) {
    return { ...base, state: 'REPLIED', touchesSent: sent.length, firstSentAt: iso(firstT), lastSentAt: iso(lastT),
      note: 'The prospect replied, so the cold sequence has ended. Continue the conversation by stage.' };
  }

  if (sent.length >= COLD_TOUCH_OFFSET_DAYS.length) {
    return { ...base, state: 'EXHAUSTED', touchesSent: sent.length, firstSentAt: iso(firstT), lastSentAt: iso(lastT),
      shouldStop: true,
      reengagementEligibleFrom: iso((lastT as number) + REENGAGEMENT_DAYS * DAY_MS),
      note: 'Three unanswered touches. Stop the sequence and move the lead to Lost or Nurture. Re-engagement may be considered after 60 days if no opt-out applies.' };
  }

  const index = sent.length;
  const dueMs = (firstT as number) + COLD_TOUCH_OFFSET_DAYS[index] * DAY_MS;
  const due = nowMs >= dueMs;
  return { ...base, state: 'IN_PROGRESS', touchesSent: sent.length, firstSentAt: iso(firstT), lastSentAt: iso(lastT),
    next: COLD_TOUCH_NAMES[index], dueAt: iso(dueMs), due,
    overdueDays: due ? Math.floor((nowMs - dueMs) / DAY_MS) : 0,
    note: due ? 'The next touch is due.' : 'The next touch is not due yet.' };
}

// ------------------------------------------------- post-concept cadence ----

export type ConceptResponse = 'POSITIVE' | 'NEUTRAL' | 'NONE';
export interface PostConceptFollowUp {
  action: 'PREPARE_PROPOSAL' | 'ASK_SPECIFIC_QUESTION' | 'SEND_YES_NO_FOLLOW_UP';
  earliestAt: string;
  latestAt: string | null;
  due: boolean;
  note: string;
}

/**
 * Post-concept cadence (separate from the cold cadence):
 *  - positive response: prepare the proposal within 24 hours
 *  - neutral response: ask a specific question after 48–72 hours
 *  - no response: send a short yes/no follow-up after 72 hours
 */
export function postConceptFollowUp(
  input: { deliveredAt: string | number | Date; response: ConceptResponse; respondedAt?: string | number | Date },
  now: Date | number = Date.now()
): PostConceptFollowUp | null {
  const nowMs = toMs(now) ?? Date.now();
  const delivered = toMs(input.deliveredAt);
  if (delivered == null) return null;
  const responded = toMs(input.respondedAt) ?? delivered;
  const iso = (t: number) => new Date(t).toISOString();

  if (input.response === 'POSITIVE') {
    const latest = responded + 24 * HOUR_MS;
    return { action: 'PREPARE_PROPOSAL', earliestAt: iso(responded), latestAt: iso(latest), due: true,
      note: 'Prepare the proposal within 24 hours of the positive response.' };
  }
  if (input.response === 'NEUTRAL') {
    const earliest = responded + 48 * HOUR_MS;
    return { action: 'ASK_SPECIFIC_QUESTION', earliestAt: iso(earliest), latestAt: iso(responded + 72 * HOUR_MS), due: nowMs >= earliest,
      note: 'Ask a specific question 48 to 72 hours after the neutral response.' };
  }
  const at = delivered + 72 * HOUR_MS;
  return { action: 'SEND_YES_NO_FOLLOW_UP', earliestAt: iso(at), latestAt: null, due: nowMs >= at,
    note: 'Send a short yes/no follow-up 72 hours after delivery if there is no response.' };
}

// -------------------------------------------------------- stage gating ----

export interface StageCheck { blockers: string[]; warnings: string[] }

/** Hard rules block the move; soft rules only warn. */
export function stageAdvanceCheck(lead: SkeemLeadLike, to: SkeemStageId): StageCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const idx = skeemStageIndex(to);

  if (!canContact(lead) && idx >= 1) {
    blockers.push('This lead has opted out or asked to stop contact. Do not move into a contact stage.');
  }
  if (to === 'THE_SKEEM' && !(lead.problemVerified && !isUnknownText(lead.problem))) {
    blockers.push('No verified need is recorded. Complete discovery and mark the problem as verified before offering a concept.');
  }
  if ((to === 'PRESENTATION_CLOSING') && lead.conceptStatus !== 'DELIVERED') {
    warnings.push('No delivered concept is recorded. Do not present as if a concept exists.');
  }
  if (to === 'FOLLOW_UP_HANDOVER' && lead.paymentVerificationStatus !== 'VERIFIED') {
    warnings.push('Payment is not verified. Do not treat the lead as won or hand over until it is.');
  }
  return { blockers, warnings };
}

export function canMarkWon(lead: Pick<SkeemLeadLike, 'paymentVerificationStatus'>): { ok: boolean; reason: string } {
  return lead.paymentVerificationStatus === 'VERIFIED'
    ? { ok: true, reason: 'Payment verified.' }
    : { ok: false, reason: 'Payment or commercial confirmation has not been verified.' };
}

/** A concept is only "ready" or "delivered" when it is checked and has a link. */
export function conceptCanBeShared(lead: Pick<SkeemLeadLike, 'conceptStatus' | 'conceptUrl'>): boolean {
  return (lead.conceptStatus === 'QUALITY_CHECKED' || lead.conceptStatus === 'DELIVERED')
    && !isUnknownText(lead.conceptUrl);
}

// ----------------------------------------------------- AI-facing digest ----

export interface SkeemLeadDigest {
  leadId: string;
  business: string;
  crmStatus: string;
  skeemStage: SkeemStageId | 'NOT_SET';
  contactRestriction: ContactRestriction;
  coldSequence: Pick<ColdSequenceStatus, 'state' | 'touchesSent' | 'next' | 'dueAt' | 'due' | 'overdueDays' | 'shouldStop'>;
  lastOutreach: { status: OutreachStatus; direction: OutreachDirection; channel: OutreachChannel; at: string } | null;
  draftsPending: number;
  conceptStatus: ConceptStatus;
  proposalStatus: ProposalStatus;
  paymentVerification: PaymentVerificationStatus;
  followUpDate: string | null;
  nextAction: string | null;
}

export interface SkeemPipelineDigest {
  version: number;
  generatedAt: string;
  leadsConsidered: number;
  leadsShown: number;
  totals: { optedOut: number; overdueColdTouches: number; sequencesToStop: number; draftsPending: number };
  leads: SkeemLeadDigest[];
  note: string;
}

export function summariseSkeemPipeline(
  leads: SkeemLeadLike[],
  outreach: OutreachRecord[],
  now: Date | number = Date.now(),
  options: { maxLeads?: number } = {}
): SkeemPipelineDigest {
  const maxLeads = options.maxLeads ?? 10;
  const nowMs = toMs(now) ?? Date.now();
  const byLead = new Map<string, OutreachRecord[]>();
  for (const r of outreach) {
    const list = byLead.get(r.leadId);
    if (list) list.push(r); else byLead.set(r.leadId, [r]);
  }

  const open = leads.filter((l) => l.status !== 'WON' && l.status !== 'LOST');
  const rows: SkeemLeadDigest[] = open.map((lead) => {
    const records = byLead.get(lead.id) || [];
    const cold = coldSequenceStatus(lead, records, nowMs);
    const latest = [...records].sort((a, b) => (recordTime(b) ?? 0) - (recordTime(a) ?? 0))[0];
    return {
      leadId: lead.id,
      business: (lead.business || '').slice(0, 60),
      crmStatus: String(lead.status || 'UNKNOWN'),
      skeemStage: lead.skeemStage && isSkeemStageId(lead.skeemStage) ? lead.skeemStage : 'NOT_SET',
      contactRestriction: lead.contactRestriction === 'OPT_OUT' ? 'OPT_OUT' : 'NONE',
      coldSequence: {
        state: cold.state, touchesSent: cold.touchesSent, next: cold.next, dueAt: cold.dueAt,
        due: cold.due, overdueDays: cold.overdueDays, shouldStop: cold.shouldStop
      },
      lastOutreach: latest
        ? { status: latest.status, direction: latest.direction, channel: latest.channel, at: new Date(recordTime(latest) ?? nowMs).toISOString() }
        : null,
      draftsPending: records.filter((r) => r.status === 'DRAFT').length,
      conceptStatus: lead.conceptStatus || 'NONE',
      proposalStatus: lead.proposalStatus || 'NONE',
      paymentVerification: lead.paymentVerificationStatus || 'NOT_REQUESTED',
      followUpDate: isUnknownText(lead.followUpDate) ? null : String(lead.followUpDate),
      nextAction: isUnknownText(lead.nextAction) ? null : String(lead.nextAction).slice(0, 120)
    };
  });

  const urgency = (d: SkeemLeadDigest) =>
    d.coldSequence.shouldStop ? 0 : d.coldSequence.due && d.coldSequence.state === 'IN_PROGRESS' ? 1 : d.draftsPending ? 2 : 3;
  rows.sort((a, b) => urgency(a) - urgency(b) || b.coldSequence.overdueDays - a.coldSequence.overdueDays);

  return {
    version: SKEEM_VERSION,
    generatedAt: new Date(nowMs).toISOString(),
    leadsConsidered: open.length,
    leadsShown: Math.min(rows.length, maxLeads),
    totals: {
      optedOut: rows.filter((r) => r.contactRestriction === 'OPT_OUT').length,
      overdueColdTouches: rows.filter((r) => r.coldSequence.state === 'IN_PROGRESS' && r.coldSequence.due).length,
      sequencesToStop: rows.filter((r) => r.coldSequence.shouldStop).length,
      draftsPending: rows.reduce((n, r) => n + r.draftsPending, 0)
    },
    leads: rows.slice(0, maxLeads),
    note: 'Computed by MOSES from saved lead and outreach records. A draft is not sent. Only records marked SENT prove outreach occurred.'
  };
}

// --------------------------------------------------- AI term routing ----

export const SKEEM_TERMS = /\b(skeem|agents?|prospects?|leads?|follow.?ups?|nudge|touch(?:es)?|concepts?|proposals?|objections?|commissions?|handover|hand.?over|opt.?out|do not contact|cold (?:outreach|message)|outreach|stage)\b/i;

export function isSkeemRelated(message: string, activeSection = ''): boolean {
  return /OUTREACH|LEADS|BUSINESS_DEVELOPMENT/.test(activeSection) || SKEEM_TERMS.test(message);
}

/** The system-prompt block, generated from the same definitions the UI uses. */
export function skeemSystemInstructions(): string {
  const stages = SKEEM_STAGES.map((s) =>
    `${s.number}. ${s.name} — ${s.intent} Move forward when: ${s.advanceWhen}`
  ).join('\n');
  return [
    `SKEEM SALES METHODOLOGY (version ${SKEEM_VERSION}). Principle: ${SKEEM_PRINCIPLE}`,
    'Seven stages:',
    stages,
    'Guardrails:',
    ...SKEEM_GLOBAL_GUARDRAILS.map((g) => '- ' + g),
    'Cadence (cold outreach): first outreach Day 1, soft nudge Day 4, final touch Day 10, counted from the first outreach. After three unanswered touches stop and move the lead to Lost or Nurture. A Lost lead may be considered for re-engagement after 60 days if no opt-out applies. The post-concept cadence is separate: positive response, prepare the proposal within 24 hours; neutral, ask a specific question after 48 to 72 hours; no response, a short yes/no follow-up after 72 hours.',
    'State separation: CRM status (NEW, QUALIFIED, CONTACTED, ...) is not the SKEEM stage. A draft is not sent. A copied message is not sent. A concept request is not a delivered concept. A verbal yes is not a verified sale.',
    'Use the "skeem" pipeline digest in the context for stage, cadence and due dates. It is computed by MOSES from saved records; do not recompute dates from memory. If a lead has no SKEEM stage recorded, say it is not set rather than guessing one.',
    'Unconfirmed policies — never guess these:',
    ...OPEN_POLICIES.map((p) => '- ' + p)
  ].join('\n');
}
