import type { Lead, OutreachChannel, SkeemStageId } from '../../types';
import { conceptCanBeShared, isUnknownText, type ColdSequenceStatus } from '../../lib/skeem';

export type Tone = 'NATURAL' | 'FRIENDLY' | 'DIRECT' | 'PROFESSIONAL';
export type Preference = 'compliment' | 'lowPressure' | 'short' | 'question';
export type DraftKind = 'RESEARCH' | 'BLOCKED' | 'STOPPED' | 'ENGAGE' | 'CONVERSATION' | 'NUDGE' | 'FINAL' | 'PROBLEM_ID' | 'CONNECT' | 'NOT_READY' | 'DELIVER' | 'CLOSE' | 'FOLLOW_UP';

const known = (value?: string) => !isUnknownText(value);
const cleanName = (value?: string) => (known(value) ? value!.trim() : '');

export function createDraft(args: {
  kind: DraftKind; channel: OutreachChannel; lead: Lead | null; tone: Tone; problem: string; problemVerified: boolean;
  lastResponse: string; context: string; preferences: Record<Preference, boolean>; senderName: string; notReadyReason?: string;
}) {
  const { kind, channel, lead, tone, problem, problemVerified, lastResponse, context, preferences, senderName, notReadyReason } = args;
  if (!lead) return { subject: '', body: 'Select a real prospect from your lead records before drafting.' };
  if (kind === 'BLOCKED') return { subject: '', body: `DO NOT CONTACT — ${lead.business} has opted out or asked to stop contact.\n\nNo outreach or scheduled follow-up may be drafted or sent. Clear the restriction only if the prospect themselves re-opens the conversation.` };
  if (kind === 'STOPPED') return { subject: '', body: `COLD SEQUENCE COMPLETE — STOP\n\n${lead.business} has had three cold touches recorded as sent with no reply. The cadence says to stop here and move the lead to Lost or Nurture. Do not send a fourth cold message.\n\nA Lost lead may be considered for re-engagement after 60 days, provided no opt-out applies.` };
  if (kind === 'RESEARCH') return { subject: '', body: `RESEARCH FIRST — no message yet.\n\nBefore contacting ${lead.business}, verify:\n• The business is active and the details belong to the correct business.\n• The person or channel you plan to contact is relevant.\n• One specific, factual observation about their website, social presence or customer journey.\n• Whether Coalesce Digital can genuinely help with the opportunity.\n\nRecord the source and date of each observation. Do not turn a guess into a problem statement. Move to Opening the Conversation only when you have a genuine reason to make contact.` };
  if (kind === 'NOT_READY') return { subject: '', body: `NOT READY TO SHARE A CONCEPT\n\n${notReadyReason || 'No concept is recorded as quality-checked with a delivery link.'}\n\nA concept request is not a completed concept. Record the concept as quality-checked and add its link in the Commercial state panel first. MOSES will not draft a delivery message for something that does not exist.` };

  const business = lead.business || 'your business';
  const contact = cleanName(lead.contactPerson);
  const greeting = contact ? `Hi ${contact},` : 'Hi there,';
  const service = known(lead.potentialService) ? lead.potentialService : '';
  const verifiedProblem = problemVerified && problem.trim() ? problem.trim() : '';
  const response = lastResponse.trim();
  const detail = context.trim();
  const lowPressure = preferences.lowPressure;
  const compliment = preferences.compliment && detail ? detail : '';
  const signature = senderName.trim() || 'Coalesce Digital';
  const link = (lead.conceptUrl || '').trim();

  const responseLead = response ? (tone === 'DIRECT' ? 'Thanks for getting back to me.' : 'Thanks for the reply.') : '';
  const responseAware = response ? `You mentioned: “${response.slice(0, 220)}”.` : '';
  const problemLine = verifiedProblem ? `The issue identified is: ${verifiedProblem}.` : '';
  const serviceLine = service ? `One area we work in is ${service}.` : 'We help businesses improve their digital presence and business systems.';
  const softExit = lowPressure ? 'No pressure either way.' : 'If it is relevant, we can take it from there.';
  const permission = `Would you like me to prepare a short, no-obligation concept so you can see what this could look like? It would be a preview of an idea, not a finished website.`;
  const opening = tone === 'DIRECT' ? (contact ? `Hi ${contact},` : 'Hi,') : greeting;

  let body = '';
  let subject = '';

  if (channel === 'EMAIL') {
    subject = kind === 'FOLLOW_UP' ? `Following up — ${business}`
      : kind === 'NUDGE' ? `Quick follow-up — ${business}`
      : kind === 'FINAL' ? `Last note — ${business}`
      : kind === 'PROBLEM_ID' ? `A question about ${business}`
      : kind === 'DELIVER' ? `Your concept for ${business}`
      : kind === 'CONNECT' ? `A possible next step for ${business}`
      : kind === 'CLOSE' ? `Next steps for ${business}`
      : `A quick introduction — Coalesce Digital`;
    const p: string[] = [opening, ''];
    if (kind === 'ENGAGE') p.push(compliment || `I came across ${business} and wanted to reach out directly.`, 'I’m with Coalesce Digital. We work with businesses on websites, digital marketing and automation.', 'I would be interested to hear what you are currently focused on improving.');
    else if (kind === 'CONVERSATION') p.push(responseLead, responseAware, `I wanted to understand a little more about how ${business} currently handles its online enquiries and customer journey.`, 'What is working well for you at the moment, and what would you most like to improve?');
    else if (kind === 'NUDGE') p.push(`A quick nudge on my earlier message about ${business}. I know things get busy.`, 'Is this something you would like to talk about, or is the timing off?');
    else if (kind === 'FINAL') p.push(`I don’t want to clutter your inbox, so this is my last note about ${business}.`, 'If improving your online presence ever becomes a priority, you are welcome to reply any time.');
    else if (kind === 'PROBLEM_ID') p.push(responseLead, responseAware, verifiedProblem ? problemLine : 'I do not want to assume what the challenge is on your side.', verifiedProblem ? 'Could you tell me how this affects the business and what you have tried so far?' : 'What is the biggest challenge you are experiencing with your website, marketing or handling enquiries?');
    else if (kind === 'CONNECT') p.push(responseLead, responseAware, problemLine, `${serviceLine} Based on what you have shared, this may be a practical area to explore for ${business}.`, permission);
    else if (kind === 'DELIVER') p.push(`As discussed, here is the concept for ${business}: ${link}`, 'This is a concept to react to, not a finished website. Tell me what works, what doesn’t and what you would change.');
    else if (kind === 'CLOSE') p.push(responseLead, responseAware, 'To make sure we are aligned, could we confirm the outcome you want, the scope that makes sense and who will approve the work?', 'If something is still uncertain, tell me what you need clarified before we agree on the next step.');
    else p.push(responseLead, responseAware, detail || 'I wanted to follow up on the next step we discussed.', 'Would you still like to explore this, or has the priority changed?');
    p.push('', softExit, '', 'Kind regards,', signature, 'Coalesce Digital');
    body = p.filter((x, i) => x !== '' || (i > 0 && p[i - 1] !== '')).join('\n');
  } else {
    const compact = preferences.short || tone === 'DIRECT';
    if (kind === 'ENGAGE') body = compliment
      ? `Hey${contact ? ` ${contact}` : ''} 👋 ${compliment} I’m with Coalesce Digital. Thought I’d connect — what are you currently focused on growing at ${business}?`
      : `Hey${contact ? ` ${contact}` : ''} 👋 Came across ${business} and wanted to connect. What are you currently focused on improving in the business?`;
    else if (kind === 'CONVERSATION') body = response
      ? `${responseLead} ${responseAware} What does that process currently look like for you at ${business}?`
      : `Hey${contact ? ` ${contact}` : ''}, quick question about ${business}: what are you currently doing to bring in and manage new customer enquiries?`;
    else if (kind === 'NUDGE') body = `Hey${contact ? ` ${contact}` : ''}, just a quick nudge on my earlier message. Is this something you’d like to chat about, or is the timing off?`;
    else if (kind === 'FINAL') body = `Hey${contact ? ` ${contact}` : ''}, I’ll leave it here so I don’t clutter your chat. If improving ${business}’s online presence becomes a priority, message me any time.`;
    else if (kind === 'PROBLEM_ID') body = response
      ? `${responseLead} ${responseAware} I want to make sure I understand properly — what has been the biggest challenge with that, and how is it affecting the business?`
      : verifiedProblem
        ? `The issue identified is ${verifiedProblem}. How is that affecting ${business} day-to-day, and what have you tried so far?`
        : `I don’t want to assume where the problem is. What is the biggest challenge you’re facing with your website, marketing or customer enquiries at the moment?`;
    else if (kind === 'CONNECT') body = `${responseLead ? responseLead + ' ' : ''}Based on what you’ve shared, ${serviceLine.charAt(0).toLowerCase() + serviceLine.slice(1)} ${permission}`;
    else if (kind === 'DELIVER') body = `Here’s the concept for ${business}: ${link}\n\nIt’s a concept to react to, not a finished website. Tell me what works and what you’d change.`;
    else if (kind === 'CLOSE') body = response
      ? `${responseLead} Just so we can move this forward clearly: are you comfortable with the proposed direction, or is there anything you’d like me to clarify before we agree on the next step?`
      : `If the approach makes sense, the next step is to confirm the scope, timing and who needs to approve it. What would you need from me to make a decision?`;
    else body = response
      ? `${responseLead} ${responseAware} Just following up on the next step we discussed. Is this still something you’d like to explore, or should I check back another time?`
      : `Hey${contact ? ` ${contact}` : ''}, following up on our earlier conversation about ${business}. Has this moved up the priority list, or would another time be better?`;
    if (detail && ['CONNECT', 'CLOSE', 'FOLLOW_UP', 'PROBLEM_ID'].includes(kind) && !body.includes(detail)) body += `\n\n${detail}`;
    if (compact && body.length > 550 && kind !== 'DELIVER') body = body.slice(0, 545).trimEnd() + '…';
    if (channel === 'INSTAGRAM' && body.length > 420 && kind !== 'DELIVER') body = body.slice(0, 415).trimEnd() + '…';
    if (channel === 'LINKEDIN') body = body.replace(/^Hey/g, 'Hi').replace(/ 👋| 😊/g, '');
    if (tone === 'PROFESSIONAL') body = body.replace(/^Hey/g, 'Hi').replace(' 👋', '');
    if (tone === 'FRIENDLY' && !body.includes('😊') && body.length < 400) body += ' 😊';
    if (tone === 'NATURAL') body = body.replace(/[ \t]{2,}/g, ' ');
    if (lowPressure && !body.includes('No pressure') && kind !== 'DELIVER') body += ' No pressure either way.';
    if (!preferences.question && body.endsWith('?')) body = body.slice(0, -1) + '.';
  }
  return { subject, body };
}


/** Template-based draft used only when the AI coach is unavailable or the user asks for a quick draft. */
export function quickDraft(args: {
  lead: Lead; channel: OutreachChannel; tone: Tone; stage: SkeemStageId; cold: ColdSequenceStatus | null; lastResponse?: string; senderName?: string;
}) {
  const { lead, stage, cold } = args;
  const restricted = lead.contactRestriction === 'OPT_OUT';
  let kind: DraftKind;
  if (restricted) kind = 'BLOCKED';
  else if (cold?.shouldStop && stage === 'OPENING') kind = 'STOPPED';
  else if (stage === 'RESEARCH_PREP') kind = 'RESEARCH';
  else if (stage === 'OPENING') kind = cold?.next === 'SOFT_NUDGE' ? 'NUDGE' : cold?.next === 'FINAL_TOUCH' ? 'FINAL' : args.lastResponse?.trim() ? 'CONVERSATION' : 'ENGAGE';
  else if (stage === 'DISCOVERY') kind = 'PROBLEM_ID';
  else if (stage === 'CONNECTING') kind = 'CONNECT';
  else if (stage === 'THE_SKEEM') kind = conceptCanBeShared(lead) ? 'DELIVER' : 'NOT_READY';
  else if (stage === 'PRESENTATION_CLOSING') kind = 'CLOSE';
  else kind = 'FOLLOW_UP';
  const result = createDraft({
    kind, channel: args.channel, lead, tone: args.tone,
    problem: lead.problem && !isUnknownText(lead.problem) ? lead.problem : '', problemVerified: !!lead.problemVerified,
    lastResponse: args.lastResponse || '', context: '', preferences: { compliment: false, lowPressure: true, short: false, question: true },
    senderName: args.senderName || 'Coalesce Digital'
  });
  const sendable = !['RESEARCH', 'BLOCKED', 'STOPPED', 'NOT_READY'].includes(kind);
  return { ...result, sendable };
}
