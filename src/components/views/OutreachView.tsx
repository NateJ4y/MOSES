import React, { useEffect, useMemo, useState } from 'react';
import {
  Send, Instagram, Mail, Linkedin, MessageSquare, Sparkles, Copy, Check,
  ChevronDown, ChevronUp, ShieldCheck, Target, ClipboardList, AlertCircle,
  UserRound, MessageCircle, CheckCircle2, Save, Ban, Clock, History, Phone
} from 'lucide-react';
import {
  ActivityRecord, ActivityType, Lead, OutreachChannel, OutreachRecord, OutreachSequence, SkeemStageId
} from '../../types';
import {
  SKEEM_PRINCIPLE, SKEEM_STAGES, canContact, coldSequenceStatus, conceptCanBeShared, getSkeemStage,
  isUnknownText, stageAdvanceCheck, type ColdTouchName
} from '../../lib/skeem';
import { playCyberSound } from '../../utils/audio';

interface OutreachViewProps {
  leads: Lead[];
  initialLead?: Lead | null;
  outreach: OutreachRecord[];
  activities: ActivityRecord[];
  onUpdateLead: (lead: Lead) => void;
  onUpdateOutreach: React.Dispatch<React.SetStateAction<OutreachRecord[]>>;
  onUpdateActivities: React.Dispatch<React.SetStateAction<ActivityRecord[]>>;
  canPersist: boolean;
  writeError?: string | null;
  userName?: string;
}

type Tone = 'NATURAL' | 'FRIENDLY' | 'DIRECT' | 'PROFESSIONAL';
type Preference = 'compliment' | 'lowPressure' | 'short' | 'question';
type DraftKind = 'RESEARCH' | 'BLOCKED' | 'STOPPED' | 'ENGAGE' | 'CONVERSATION' | 'NUDGE' | 'FINAL' | 'PROBLEM_ID' | 'CONNECT' | 'NOT_READY' | 'DELIVER' | 'CLOSE' | 'FOLLOW_UP';

const CHANNELS: { id: OutreachChannel; label: string; icon: React.ElementType; hint: string }[] = [
  { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, hint: 'Personal, conversational and easy to reply to.' },
  { id: 'INSTAGRAM', label: 'Instagram DM', icon: Instagram, hint: 'Short, casual and anchored to their profile/content.' },
  { id: 'LINKEDIN', label: 'LinkedIn', icon: Linkedin, hint: 'Professional, relevant and respectful of their role.' },
  { id: 'EMAIL', label: 'Email', icon: Mail, hint: 'One complete direct message with a subject and clear CTA.' }
];
const TONES: { id: Tone; label: string; description: string }[] = [
  { id: 'NATURAL', label: 'Natural', description: 'Human, clear and not overly polished.' },
  { id: 'FRIENDLY', label: 'Friendly', description: 'Warm and approachable, without forced slang.' },
  { id: 'DIRECT', label: 'Direct', description: 'Concise, confident and straight to the point.' },
  { id: 'PROFESSIONAL', label: 'Professional', description: 'Structured and businesslike, still personable.' }
];
const SEQUENCES: { id: OutreachSequence; label: string }[] = [
  { id: 'COLD', label: 'Cold outreach cadence' },
  { id: 'POST_CONCEPT', label: 'Post-concept cadence' },
  { id: 'OTHER', label: 'Other / ongoing conversation' }
];
const CONCEPT_STATES = ['NONE', 'REQUESTED', 'APPROVED', 'IN_CREATION', 'QUALITY_CHECKED', 'DELIVERED'] as const;
const PROPOSAL_STATES = ['NONE', 'DRAFTED', 'PRESENTED', 'ACCEPTED_VERBALLY', 'DECLINED'] as const;
const PAYMENT_STATES = ['NOT_REQUESTED', 'AWAITING_PAYMENT', 'VERIFIED'] as const;
const TOUCH_LABEL: Record<ColdTouchName, string> = { FIRST_OUTREACH: 'First outreach (Day 1)', SOFT_NUDGE: 'Soft nudge (Day 4)', FINAL_TOUCH: 'Final touch (Day 10)' };

const known = (value?: string) => !isUnknownText(value);
const cleanName = (value?: string) => (known(value) ? value!.trim() : '');
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const nice = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const day = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '—');
const when = (iso?: string) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d.getTime()) ? d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'; };

function createDraft(args: {
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

export const OutreachView: React.FC<OutreachViewProps> = ({
  leads, initialLead, outreach, activities, onUpdateLead, onUpdateOutreach, onUpdateActivities, canPersist, writeError, userName
}) => {
  const [activeChannel, setActiveChannel] = useState<OutreachChannel>('WHATSAPP');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLead?.id || leads[0]?.id || '');
  const [viewStage, setViewStage] = useState<SkeemStageId>('OPENING');
  const [sequence, setSequence] = useState<OutreachSequence>('COLD');
  const [tone, setTone] = useState<Tone>('NATURAL');
  const [lastResponse, setLastResponse] = useState('');
  const [problem, setProblem] = useState('');
  const [problemVerified, setProblemVerified] = useState(false);
  const [context, setContext] = useState('');
  const [senderName, setSenderName] = useState('Coalesce Digital');
  const [preferences, setPreferences] = useState<Record<Preference, boolean>>({ compliment: true, lowPressure: true, short: false, question: true });
  const [draftText, setDraftText] = useState('');
  const [subject, setSubject] = useState('');
  const [copied, setCopied] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);
  const [notice, setNotice] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyChannel, setReplyChannel] = useState<OutreachChannel>('WHATSAPP');
  const [conceptLink, setConceptLink] = useState('');

  const currentLead = leads.find(l => l.id === selectedLeadId) || null;
  const stage = getSkeemStage(viewStage);
  const channel = CHANNELS.find(c => c.id === activeChannel)!;
  const leadRecords = useMemo(() => outreach.filter(r => r.leadId === selectedLeadId).sort((a, b) => (b.sentAt || b.createdAt).localeCompare(a.sentAt || a.createdAt)), [outreach, selectedLeadId]);
  const leadActivities = useMemo(() => activities.filter(a => a.leadId === selectedLeadId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12), [activities, selectedLeadId]);
  const cold = useMemo(() => currentLead ? coldSequenceStatus(currentLead, leadRecords) : null, [currentLead, leadRecords]);
  const allowed = !!currentLead && canContact(currentLead);
  const check = currentLead ? stageAdvanceCheck(currentLead, viewStage) : { blockers: [], warnings: [] };
  const recordedStage = currentLead?.skeemStage;
  const actor = (userName || '').trim() || undefined;

  useEffect(() => {
    setProblem(currentLead && known(currentLead.problem) ? currentLead.problem : '');
    setProblemVerified(!!currentLead?.problemVerified);
    setLastResponse(''); setContext(''); setDraftText(''); setSubject(''); setNotice(''); setReplyText('');
    setConceptLink(currentLead?.conceptUrl || '');
    if (currentLead?.skeemStage) setViewStage(currentLead.skeemStage);
    setSequence(currentLead?.conceptStatus === 'DELIVERED' ? 'POST_CONCEPT' : 'COLD');
  }, [selectedLeadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const log = (type: ActivityType, summary: string, detail?: string, atStage?: SkeemStageId) => {
    if (!currentLead) return;
    onUpdateActivities(prev => [{ id: newId('act'), leadId: currentLead.id, type, summary, detail, stage: atStage, at: new Date().toISOString(), actor }, ...prev]);
  };
  const patchLead = (patch: Partial<Lead>) => { if (currentLead) onUpdateLead({ ...currentLead, ...patch }); };
  const guard = () => { if (!canPersist) { setNotice('Saving is unavailable: MOSES has not finished loading your records from the database. Nothing was saved.'); return false; } return true; };

  const draftKind = (): DraftKind => {
    if (!currentLead) return 'RESEARCH';
    if (!allowed) return 'BLOCKED';
    if (sequence === 'COLD' && cold?.shouldStop && viewStage !== 'RESEARCH_PREP') return 'STOPPED';
    switch (viewStage) {
      case 'RESEARCH_PREP': return 'RESEARCH';
      case 'OPENING':
        if (sequence === 'COLD' && cold?.next === 'SOFT_NUDGE') return 'NUDGE';
        if (sequence === 'COLD' && cold?.next === 'FINAL_TOUCH') return 'FINAL';
        return lastResponse.trim() ? 'CONVERSATION' : 'ENGAGE';
      case 'DISCOVERY': return 'PROBLEM_ID';
      case 'CONNECTING': return 'CONNECT';
      case 'THE_SKEEM': return conceptCanBeShared(currentLead) ? 'DELIVER' : 'NOT_READY';
      case 'PRESENTATION_CLOSING': return 'CLOSE';
      default: return 'FOLLOW_UP';
    }
  };
  const isMessageKind = !['RESEARCH', 'BLOCKED', 'STOPPED', 'NOT_READY'].includes(draftKind());

  const generate = () => {
    if (!currentLead) return;
    const kind = draftKind();
    const result = createDraft({
      kind, channel: activeChannel, lead: currentLead, tone, problem, problemVerified: problemVerified && problem.trim().length > 0,
      lastResponse, context, preferences, senderName,
      notReadyReason: currentLead.conceptStatus && currentLead.conceptStatus !== 'NONE'
        ? `The concept is recorded as "${nice(currentLead.conceptStatus)}"${known(currentLead.conceptUrl) ? '' : ' and has no delivery link'}.` : undefined
    });
    setSubject(result.subject); setDraftText(result.body); setCopied(false); setNotice('');
    playCyberSound('response');
  };

  const copyDraft = async () => {
    if (!draftText) return;
    try { await navigator.clipboard.writeText(activeChannel === 'EMAIL' && subject ? `Subject: ${subject}\n\n${draftText}` : draftText); setCopied(true); playCyberSound('click'); window.setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };

  const saveDraft = () => {
    if (!currentLead || !draftText || !isMessageKind || !allowed || !guard()) return;
    const now = new Date().toISOString();
    onUpdateOutreach(prev => [{
      id: newId('out'), leadId: currentLead.id, stage: viewStage, channel: activeChannel, direction: 'OUTBOUND', sequence,
      content: draftText, subject: activeChannel === 'EMAIL' ? subject : undefined, status: 'DRAFT', createdAt: now, createdBy: actor
    }, ...prev]);
    log('DRAFT_SAVED', `Saved a ${nice(activeChannel)} draft`, undefined, viewStage);
    setNotice('Draft saved. It has NOT been sent. After you send it yourself, mark it as sent below.');
  };

  const markSent = (record: OutreachRecord) => {
    if (!currentLead || !guard()) return;
    if (!canContact(currentLead)) { setNotice('This lead has opted out. Nothing can be recorded as sent.'); return; }
    if (!window.confirm('Confirm you have actually sent this message yourself. MOSES never sends it for you.')) return;
    const now = new Date().toISOString();
    onUpdateOutreach(prev => prev.map(r => r.id === record.id ? { ...r, status: 'SENT', sentAt: now, updatedAt: now } : r));
    patchLead({ lastContact: now.slice(0, 10) });
    log('OUTREACH_SENT', `Recorded a ${nice(record.channel)} message as sent`, undefined, record.stage);
    setNotice('Recorded as sent.');
  };

  const cancelDraft = (record: OutreachRecord) => {
    if (!guard()) return;
    onUpdateOutreach(prev => prev.map(r => r.id === record.id ? { ...r, status: 'CANCELLED', updatedAt: new Date().toISOString() } : r));
    log('DRAFT_CANCELLED', `Cancelled a ${nice(record.channel)} draft`, undefined, record.stage);
  };

  const logReply = () => {
    if (!currentLead || !replyText.trim() || !guard()) return;
    const now = new Date().toISOString();
    onUpdateOutreach(prev => [{
      id: newId('out'), leadId: currentLead.id, stage: recordedStage || viewStage, channel: replyChannel, direction: 'INBOUND', sequence: 'OTHER',
      content: replyText.trim(), status: 'RECEIVED', createdAt: now, sentAt: now, createdBy: actor
    }, ...prev]);
    patchLead({ lastContact: now.slice(0, 10) });
    log('REPLY_RECEIVED', `Prospect replied on ${nice(replyChannel)}`, replyText.trim().slice(0, 300), recordedStage || viewStage);
    setLastResponse(replyText.trim()); setReplyText(''); setNotice('Reply recorded. The cold sequence ends when a prospect replies.');
  };

  const setLeadStage = () => {
    if (!currentLead || !guard() || check.blockers.length) return;
    if (check.warnings.length && !window.confirm(check.warnings.join('\n\n') + '\n\nRecord this stage anyway?')) return;
    patchLead({ skeemStage: viewStage });
    log('STAGE_CHANGED', `SKEEM stage: ${recordedStage ? getSkeemStage(recordedStage).name : 'not set'} → ${stage.name}`, undefined, viewStage);
    setNotice(`Recorded: ${currentLead.business} is at stage ${stage.number} (${stage.name}). The CRM status is unchanged.`);
  };

  const saveVerifiedProblem = () => {
    if (!currentLead || !problem.trim() || !guard()) return;
    patchLead({ problem: problem.trim(), problemVerified: true });
    log('PROBLEM_VERIFIED', 'Recorded a verified problem', problem.trim().slice(0, 300), viewStage);
    setProblemVerified(true); setNotice('Verified problem saved to the lead.');
  };

  const recordOptOut = () => {
    if (!currentLead || !guard()) return;
    if (!window.confirm('Record that this prospect has opted out or asked to stop contact? This cancels draft messages and clears the follow-up date.')) return;
    const now = new Date().toISOString();
    onUpdateOutreach(prev => prev.map(r => r.leadId === currentLead.id && r.status === 'DRAFT' ? { ...r, status: 'CANCELLED', updatedAt: now } : r));
    patchLead({ contactRestriction: 'OPT_OUT', followUpDate: '', nextAction: 'Do not contact — opt-out recorded' });
    log('OPT_OUT_RECORDED', 'Opt-out / request to stop contact recorded');
    setDraftText(''); setNotice('Opt-out recorded. Drafts were cancelled and all follow-ups are blocked.');
  };
  const clearOptOut = () => {
    if (!currentLead || !guard()) return;
    if (!window.confirm('Only clear this if the prospect themselves has re-opened the conversation. Clear the opt-out?')) return;
    patchLead({ contactRestriction: 'NONE' });
    log('OPT_OUT_CLEARED', 'Opt-out cleared');
  };

  const setFollowUp = () => {
    if (!currentLead || !cold?.dueAt || !cold.next || !guard()) return;
    patchLead({ followUpDate: day(cold.dueAt), nextAction: `${TOUCH_LABEL[cold.next]} — ${currentLead.business}` });
    log('FOLLOW_UP_SET', `Follow-up set for ${day(cold.dueAt)}`, TOUCH_LABEL[cold.next]);
  };

  const changeConcept = (value: (typeof CONCEPT_STATES)[number]) => {
    if (!currentLead || !guard()) return;
    const link = conceptLink.trim();
    if ((value === 'QUALITY_CHECKED' || value === 'DELIVERED') && !link) { setNotice('Add the concept link first. A concept is only "quality-checked" or "delivered" when it exists and has a usable link.'); return; }
    patchLead({ conceptStatus: value, conceptUrl: link || currentLead.conceptUrl });
    log('CONCEPT_STATUS_CHANGED', `Concept: ${nice(value)}`, link || undefined, 'THE_SKEEM');
  };
  const changeProposal = (value: (typeof PROPOSAL_STATES)[number]) => {
    if (!currentLead || !guard()) return;
    patchLead({ proposalStatus: value }); log('PROPOSAL_STATUS_CHANGED', `Proposal: ${nice(value)}`, undefined, 'PRESENTATION_CLOSING');
  };
  const changePayment = (value: (typeof PAYMENT_STATES)[number]) => {
    if (!currentLead || !guard()) return;
    if (value === 'VERIFIED' && !window.confirm('Confirm payment has actually been received and checked.')) return;
    patchLead({ paymentVerificationStatus: value }); log('PAYMENT_STATUS_CHANGED', `Payment: ${nice(value)}`, undefined, 'FOLLOW_UP_HANDOVER');
  };

  const togglePreference = (key: Preference) => setPreferences(p => ({ ...p, [key]: !p[key] }));
  const sel = 'w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs';

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5"><div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200"><Send size={18} /></div><h2 className="font-display text-xl font-bold tracking-tight">SKEEM Sales Advisor</h2></div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">{SKEEM_PRINCIPLE} Every interaction has a next move, and every next move is recorded.</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold"><ShieldCheck size={14} /> Drafts are never auto-sent</span>
      </header>

      {(writeError || !canPersist || notice) && (
        <div className="space-y-2">
          {writeError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Could not save outreach history: {writeError}</p>}
          {!canPersist && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Outreach history is still loading or could not be loaded from the database. Saving is disabled so nothing is lost or overwritten.</p>}
          {notice && <p className="text-xs text-zinc-800 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2">{notice}</p>}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center gap-2"><UserRound size={14} /><h3 className="text-[11px] font-bold uppercase">Prospect</h3></div>
        <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className={sel}>
          <option value="">Select prospect…</option>{leads.map(l => <option key={l.id} value={l.id}>{l.business}</option>)}
        </select>
        {currentLead ? (
          <div className="rounded-xl bg-zinc-50 p-3 text-xs flex flex-wrap gap-x-6 gap-y-1">
            <span><strong>{currentLead.business}</strong> · {currentLead.contactPerson || 'Contact not recorded'}</span>
            <span>CRM status: <strong>{nice(currentLead.status)}</strong></span>
            <span>SKEEM stage: <strong>{recordedStage ? `${getSkeemStage(recordedStage).number} · ${getSkeemStage(recordedStage).name}` : 'Not set'}</strong></span>
            <span>Last contact: {known(currentLead.lastContact) ? currentLead.lastContact : 'Not recorded'}</span>
            <span>Follow-up: {known(currentLead.followUpDate) ? currentLead.followUpDate : 'Not set'}</span>
            {!allowed && <span className="font-bold text-red-700">OPTED OUT — DO NOT CONTACT</span>}
          </div>
        ) : <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">No prospect records available. Add a real prospect in Leads first. MOSES will not invent one.</div>}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold uppercase tracking-wider">The seven SKEEM stages</h3><span className="text-[10px] text-zinc-500">Pick a stage to work on, then record it on the lead</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKEEM_STAGES.map(item => (
            <button key={item.id} type="button" onClick={() => { setViewStage(item.id); setDraftText(''); playCyberSound('click'); }}
              className={`p-3 rounded-xl border text-left transition-colors ${viewStage === item.id ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}>
              <span className="block text-[11px] font-bold">{item.number} · {item.name}{recordedStage === item.id ? ' ●' : ''}</span>
              <span className={`block text-[9px] mt-1 leading-relaxed ${viewStage === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{item.intent}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400">● = the stage recorded on this lead. Stages follow the prospect’s pace; they are not seven consecutive messages.</p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <button type="button" onClick={() => setAdvisorOpen(!advisorOpen)} className="w-full flex items-center justify-between text-left"><span className="flex items-center gap-2 text-xs font-bold uppercase"><Target size={14} /> Stage advisor · {stage.number}. {stage.name}</span>{advisorOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
        {advisorOpen && <>
          <div className="grid md:grid-cols-3 gap-4 mt-3">
            <div><span className="text-[9px] font-bold uppercase text-zinc-400">Objective</span><p className="text-xs mt-1">{stage.intent}</p></div>
            <div><span className="text-[9px] font-bold uppercase text-zinc-400">Your move</span><p className="text-xs mt-1">{stage.yourMove}</p></div>
            <div><span className="text-[9px] font-bold uppercase text-zinc-400">Move forward when</span><p className="text-xs mt-1">{stage.advanceWhen}</p></div>
          </div>
          <ul className="mt-3 text-[10px] text-zinc-600 space-y-1 list-disc pl-4">{stage.guardrails.map(g => <li key={g}>{g}</li>)}</ul>
          {check.blockers.map(b => <p key={b} className="mt-2 text-[10px] text-red-700 flex items-start gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0" />{b}</p>)}
          {check.warnings.map(w => <p key={w} className="mt-2 text-[10px] text-amber-700 flex items-start gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0" />{w}</p>)}
          <button type="button" onClick={setLeadStage} disabled={!currentLead || recordedStage === viewStage || check.blockers.length > 0}
            className="mt-3 px-4 py-2 rounded-full bg-black text-white text-[11px] font-bold disabled:opacity-40">{recordedStage === viewStage ? 'Already recorded on this lead' : 'Record this as the lead’s stage'}</button>
        </>}
      </section>

      {currentLead && cold && (
        <section className="rounded-2xl border border-zinc-200 p-4 space-y-2">
          <div className="flex items-center gap-2"><Clock size={14} /><h3 className="text-[11px] font-bold uppercase">Cold-outreach cadence</h3></div>
          <p className="text-xs"><strong>{nice(cold.state)}</strong> · {cold.touchesSent} of 3 touches recorded as sent{cold.next ? <> · next: <strong>{TOUCH_LABEL[cold.next]}</strong>{cold.dueAt ? <> · {cold.due ? (cold.overdueDays ? `overdue by ${cold.overdueDays} day(s)` : 'due now') : `due ${day(cold.dueAt)}`}</> : null}</> : null}</p>
          <p className="text-[10px] text-zinc-500">{cold.note}{cold.reengagementEligibleFrom ? ` Eligible from ${day(cold.reengagementEligibleFrom)}.` : ''}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {cold.state === 'IN_PROGRESS' && cold.dueAt && <button type="button" onClick={setFollowUp} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-100">Set follow-up for {day(cold.dueAt)}</button>}
            {allowed ? <button type="button" onClick={recordOptOut} className="px-3 py-1.5 rounded-full border border-red-200 text-red-700 text-[11px] font-semibold hover:bg-red-50 flex items-center gap-1"><Ban size={11} /> Record opt-out / “no”</button>
              : <button type="button" onClick={clearOptOut} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-100">Clear opt-out</button>}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-4">
            <div className="border-t-0 space-y-2">
              <div className="flex items-center justify-between"><label className="text-[10px] font-bold uppercase text-zinc-500">1. Problem / opportunity</label><span className="text-[9px] text-zinc-400">Only use when verified</span></div>
              <textarea rows={3} value={problem} onChange={e => { setProblem(e.target.value); setProblemVerified(false); }} placeholder="What did the prospect actually say, or what have you directly observed?" className={sel} />
              <label className="flex items-start gap-2 text-[10px] text-zinc-600"><input type="checkbox" checked={problemVerified} onChange={e => setProblemVerified(e.target.checked)} className="mt-0.5" />I verified this with the prospect or observed it myself. MOSES may state it as a fact.</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={saveVerifiedProblem} disabled={!currentLead || !problemVerified || !problem.trim()} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold disabled:opacity-40">Save to lead</button>
                {currentLead?.problemVerified && <span className="text-[10px] text-emerald-700">Verified problem saved</span>}
              </div>
              {!(problemVerified && problem.trim()) && <p className="text-[9px] text-amber-700 flex items-center gap-1"><AlertCircle size={11} /> Not stated as a confirmed problem until verified.</p>}
            </div>
            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500">2. Last response / conversation</label>
              <textarea rows={3} value={lastResponse} onChange={e => { setLastResponse(e.target.value); setDraftText(''); }} placeholder="Paste the prospect’s latest reply. Leave blank for a first message." className={sel} />
              <label className="text-[10px] font-bold uppercase text-zinc-500">Additional verified context</label>
              <textarea rows={2} value={context} onChange={e => { setContext(e.target.value); setDraftText(''); }} placeholder="A specific post, product or detail you can stand behind…" className={sel} />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div className="flex items-center gap-2"><MessageCircle size={14} /><h3 className="text-[11px] font-bold uppercase">3. Platform, tone & sequence</h3></div>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setActiveChannel(item.id); setDraftText(''); }} className={`p-2.5 rounded-xl border text-left ${activeChannel === item.id ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-zinc-400'}`}><span className="flex items-center gap-2 text-xs font-semibold"><Icon size={14} />{item.label}</span><span className={`block text-[9px] mt-1 ${activeChannel === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{item.hint}</span></button>; })}
            </div>
            <label className="block text-[10px] font-bold uppercase text-zinc-500">Tone<select value={tone} onChange={e => { setTone(e.target.value as Tone); setDraftText(''); }} className={sel + ' mt-1 normal-case'}>{TONES.map(t => <option key={t.id} value={t.id}>{t.label} — {t.description}</option>)}</select></label>
            <label className="block text-[10px] font-bold uppercase text-zinc-500">Sequence this message belongs to<select value={sequence} onChange={e => { setSequence(e.target.value as OutreachSequence); setDraftText(''); }} className={sel + ' mt-1 normal-case'}>{SEQUENCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <div className="border-t border-zinc-100 pt-3 space-y-2">
              {([['compliment', 'Use a genuine, context-based compliment'], ['lowPressure', 'Keep the next step low-pressure'], ['short', 'Keep social messages especially short'], ['question', 'End with one clear question']] as [Preference, string][]).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[10px] text-zinc-700"><input type="checkbox" checked={preferences[key]} onChange={() => togglePreference(key)} />{label}</label>)}
              <label className="block text-[10px] text-zinc-500">Sign-off name<input value={senderName} onChange={e => setSenderName(e.target.value)} className={sel + ' mt-1'} /></label>
            </div>
            <button type="button" disabled={!currentLead} onClick={generate} className="w-full py-3 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Sparkles size={14} /> Generate for stage {stage.number}</button>
          </div>

          {currentLead && (
            <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} /><h3 className="text-[11px] font-bold uppercase">Commercial state</h3></div>
              <p className="text-[10px] text-zinc-500">Kept separate from the CRM status. MOSES only says a concept is ready or delivered when it is checked and linked, and only says a lead is won when payment is verified.</p>
              <label className="block text-[10px] text-zinc-500">Concept link<input value={conceptLink} onChange={e => setConceptLink(e.target.value)} placeholder="https://…" className={sel + ' mt-1'} /><span className="block mt-1 text-[9px] text-zinc-400">Saved when you set the concept status below.</span></label>
              <label className="block text-[10px] text-zinc-500">Concept<select value={currentLead.conceptStatus || 'NONE'} onChange={e => changeConcept(e.target.value as (typeof CONCEPT_STATES)[number])} className={sel + ' mt-1'}>{CONCEPT_STATES.map(s => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
              <label className="block text-[10px] text-zinc-500">Proposal<select value={currentLead.proposalStatus || 'NONE'} onChange={e => changeProposal(e.target.value as (typeof PROPOSAL_STATES)[number])} className={sel + ' mt-1'}>{PROPOSAL_STATES.map(s => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
              <label className="block text-[10px] text-zinc-500">Payment<select value={currentLead.paymentVerificationStatus || 'NOT_REQUESTED'} onChange={e => changePayment(e.target.value as (typeof PAYMENT_STATES)[number])} className={sel + ' mt-1'}>{PAYMENT_STATES.map(s => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
            </div>
          )}
        </section>

        <section className="lg:col-span-7 min-w-0 space-y-4">
          <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3 gap-2">
              <div><h3 className="text-xs font-bold uppercase">Script workshop</h3><p className="text-[10px] text-zinc-500 mt-1">{channel.label} · stage {stage.number}. A draft is not a sent message.</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={copyDraft} disabled={!draftText} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-100 text-xs font-semibold disabled:opacity-40">{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>
                <button type="button" onClick={saveDraft} disabled={!draftText || !isMessageKind || !allowed} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black text-white text-xs font-semibold disabled:opacity-40"><Save size={12} /> Save draft</button>
              </div>
            </div>
            {draftText ? <>
              {activeChannel === 'EMAIL' && isMessageKind && <label className="block text-[10px] font-bold uppercase text-zinc-500">Subject<input value={subject} onChange={e => setSubject(e.target.value)} className={sel + ' mt-1 normal-case'} /></label>}
              <textarea rows={16} value={draftText} onChange={e => setDraftText(e.target.value)} className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm leading-relaxed resize-y min-h-[300px]" />
              <p className="text-[9px] text-zinc-400">Copying does not mark anything as sent. Review every detail, send it yourself, then record it as sent in the history below.</p>
            </> : <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200"><ClipboardList size={28} className="text-zinc-300 mb-3" /><p className="text-sm font-semibold">Your script will appear here</p><p className="text-xs text-zinc-500 mt-1 max-w-sm">Select a prospect, choose the stage you are really in, add the last reply if there is one, and generate the next move.</p></div>}
          </div>

          {currentLead && (
            <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
              <div className="flex items-center gap-2"><History size={14} /><h3 className="text-[11px] font-bold uppercase">Outreach history · {currentLead.business}</h3></div>
              {leadRecords.length === 0 && <p className="text-xs text-zinc-500">Nothing recorded yet. Save a draft, then mark it sent once you have actually sent it.</p>}
              <ul className="space-y-2">
                {leadRecords.map(r => (
                  <li key={r.id} className="rounded-xl border border-zinc-200 p-3 text-xs space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${r.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : r.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : r.status === 'RECEIVED' ? 'bg-sky-100 text-sky-800' : 'bg-zinc-200 text-zinc-600'}`}>{r.status}</span>
                      <span>{r.direction === 'INBOUND' ? 'From prospect' : 'To prospect'} · {nice(r.channel)} · stage {getSkeemStage(r.stage).number}{r.sequence && r.sequence !== 'OTHER' ? ` · ${nice(r.sequence)}` : ''}</span>
                      <span className="text-zinc-400">{when(r.sentAt || r.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-zinc-700 line-clamp-4">{r.subject ? `${r.subject}\n` : ''}{r.content}</p>
                    {r.status === 'DRAFT' && <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => markSent(r)} className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold">I sent this</button>
                      <button type="button" onClick={() => cancelDraft(r)} className="px-3 py-1 rounded-full border border-zinc-300 text-[10px] font-semibold">Cancel draft</button>
                    </div>}
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-100 pt-3 space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Record a reply from the prospect</label>
                <div className="flex gap-2">
                  <select value={replyChannel} onChange={e => setReplyChannel(e.target.value as OutreachChannel)} className="p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs">{[...CHANNELS.map(c => c.id), 'PHONE' as OutreachChannel].map(c => <option key={c} value={c}>{nice(c)}</option>)}</select>
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="What did they say?" className={sel} />
                  <button type="button" onClick={logReply} disabled={!replyText.trim()} className="px-3 py-2 rounded-full bg-zinc-900 text-white text-[11px] font-bold disabled:opacity-40 flex items-center gap-1"><Phone size={11} /> Log</button>
                </div>
              </div>
            </div>
          )}

          {currentLead && leadActivities.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
              <h3 className="text-[11px] font-bold uppercase">Activity timeline</h3>
              <ul className="space-y-1.5">{leadActivities.map(a => <li key={a.id} className="text-[11px] text-zinc-700 flex gap-2"><span className="text-zinc-400 shrink-0">{when(a.at)}</span><span>{a.summary}{a.actor ? <span className="text-zinc-400"> · {a.actor}</span> : null}</span></li>)}</ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default OutreachView;
