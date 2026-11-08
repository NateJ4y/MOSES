import React, { useEffect, useState } from 'react';
import {
  Send, Instagram, Mail, Linkedin, MessageSquare, Sparkles, Copy, Check,
  ChevronDown, ChevronUp, ShieldCheck, Target, ClipboardList, AlertCircle,
  UserRound, MessageCircle, CheckCircle2
} from 'lucide-react';
import { Lead } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface OutreachViewProps {
  leads: Lead[];
  initialLead?: Lead | null;
}

type OutreachChannel = 'EMAIL' | 'WHATSAPP' | 'INSTAGRAM' | 'LINKEDIN';
type OutreachStage = 'IDENTIFY' | 'ENGAGE' | 'CONVERSATION' | 'PROBLEM_ID' | 'CONNECT' | 'OFFER' | 'CLOSE' | 'FOLLOW_UP';
type Tone = 'NATURAL' | 'FRIENDLY' | 'DIRECT' | 'PROFESSIONAL';
type Preference = 'compliment' | 'preview' | 'lowPressure' | 'short' | 'question';

const STAGES: { id: OutreachStage; label: string; objective: string; action: string; advance: string }[] = [
  { id: 'IDENTIFY', label: '1 · Identify', objective: 'Research and qualify the business before contacting anyone.', action: 'Check the business, decision-maker, digital presence and a specific opportunity. Separate observed facts from assumptions.', advance: 'You have a real business, a relevant contact route and a defensible reason to reach out.' },
  { id: 'ENGAGE', label: '2 · Engage', objective: 'Make a genuine, relevant first impression.', action: 'Engage with something real: a recent post, product, service, milestone or visible detail. Do not force a compliment.', advance: 'There is a natural opening for a direct conversation. An engagement action is not the same as sending a pitch.' },
  { id: 'CONVERSATION', label: '3 · Conversation', objective: 'Open a human conversation and earn permission to ask.', action: 'Use a short, personal opener. Ask one easy question. Avoid prices, long explanations and service dumping.', advance: 'The prospect replies or gives you a natural opening to understand their business.' },
  { id: 'PROBLEM_ID', label: '4 · Discover the problem', objective: 'Understand the prospect’s actual challenge, goal or missed opportunity.', action: 'Ask open questions. Listen for impact, current process, urgency and what they have already tried. Record their words accurately.', advance: 'The prospect confirms a specific need, challenge or goal. Do not promote a guessed problem as a fact.' },
  { id: 'CONNECT', label: '5 · Connect the opportunity', objective: 'Show how a relevant Coalesce service could address the stated need.', action: 'Reflect the need back, connect one suitable service to it and explain the practical outcome. Keep the recommendation proportionate.', advance: 'The prospect agrees the solution is relevant or wants to understand what it could look like.' },
  { id: 'OFFER', label: '6 · Offer a low-risk next step', objective: 'Make it easy for the prospect to evaluate the idea.', action: 'Offer a short walkthrough, concept preview or discussion only when it can genuinely be provided. Be clear about what exists and what is still to be created.', advance: 'The prospect accepts a next step, asks for details or raises a concern you can address.' },
  { id: 'CLOSE', label: '7 · Qualify and close', objective: 'Resolve questions and agree on a clear decision or next action.', action: 'Clarify scope, decision-maker, timing, budget where appropriate and the next commitment. Address objections honestly; never manufacture urgency.', advance: 'A clear outcome is recorded: proceed, follow up on an agreed date, nurture, or respectfully close the opportunity.' },
  { id: 'FOLLOW_UP', label: '8 · Follow up', objective: 'Continue with context and a useful reason—not a generic “just checking in”.', action: 'Refer to the actual last exchange, add relevant value or ask about the agreed next step. Respect a no or a request to stop.', advance: 'The prospect responds, an agreed next step is booked, the opportunity is nurtured, or the record is closed.' }
];

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

function known(value?: string) {
  const v = (value || '').trim();
  return !!v && !/^(unknown|not recorded|not set|none|n\/a|requires discovery|not documented)/i.test(v);
}

function cleanName(value?: string) {
  if (!known(value)) return '';
  return value!.trim();
}

function createDraft(args: {
  channel: OutreachChannel; stage: OutreachStage; lead: Lead | null; tone: Tone;
  problem: string; problemVerified: boolean; lastResponse: string; context: string;
  preferences: Record<Preference, boolean>; previewDetails: string; senderName: string;
}) {
  const { channel, stage, lead, tone, problem, problemVerified, lastResponse, context, preferences, previewDetails, senderName } = args;
  if (!lead) return { subject: '', body: 'Select a real prospect from your lead records before drafting.' };
  if (stage === 'IDENTIFY') return {
    subject: '',
    body: `RESEARCH FIRST — no message yet.

Before contacting ${lead.business}, verify:
• The business is active and the details belong to the correct business.
• The person or channel you plan to contact is relevant.
• One specific, factual observation about their website, social presence or customer journey.
• Whether Coalesce Digital can genuinely help with the opportunity.

Record the source and date of each observation. Do not turn a guess into a problem statement. Move to Engage only when you have a genuine reason to make contact.`
  };
  const business = lead.business || 'your business';
  const contact = cleanName(lead.contactPerson);
  const greeting = contact ? `Hi ${contact},` : 'Hi there,';
  const service = known(lead.potentialService) ? lead.potentialService : '';
  const verifiedProblem = problemVerified && problem.trim() ? problem.trim() : '';
  const response = lastResponse.trim();
  const detail = context.trim();
  const preview = preferences.preview && previewDetails.trim() ? previewDetails.trim() : '';
  const lowPressure = preferences.lowPressure;
  const compliment = preferences.compliment && detail ? detail : '';
  const signature = senderName.trim() || 'Coalesce Digital';

  const responseLead = response
    ? (tone === 'DIRECT' ? 'Thanks for getting back to me.' : 'Thanks for the reply.')
    : '';
  const responseAware = response ? `You mentioned: “${response.slice(0, 220)}”.` : '';
  const problemLine = verifiedProblem ? `The issue identified is: ${verifiedProblem}.` : '';
  const serviceLine = service ? `One area we work in is ${service}.` : 'We help businesses improve their digital presence and business systems.';
  const softExit = lowPressure ? 'No pressure either way.' : 'If it is relevant, we can take it from there.';
  const opening = tone === 'PROFESSIONAL' ? greeting : tone === 'DIRECT' ? (contact ? `Hi ${contact},` : 'Hi,') : greeting;

  let body = '';
  let subject = '';

  if (channel === 'EMAIL') {
    subject = stage === 'FOLLOW_UP' ? `Following up — ${business}`
      : stage === 'PROBLEM_ID' ? `A question about ${business}`
      : stage === 'OFFER' ? `A possible next step for ${business}`
      : `A quick introduction — Coalesce Digital`;
    const paragraphs: string[] = [opening, ''];
    if (stage === 'IDENTIFY') paragraphs.push(
      `I’m reaching out because I came across ${business} and wanted to introduce myself.`,
      detail ? detail : 'I’m taking a closer look at how businesses present and support their services online, and I wanted to understand your current priorities.',
      'Are you the right person to speak with about your website and digital operations?'
    );
    else if (stage === 'ENGAGE') paragraphs.push(
      compliment || `I came across ${business} and wanted to reach out directly.`,
      'I’m with Coalesce Digital. We work with businesses on websites, digital marketing and automation.',
      'I would be interested to hear what you are currently focused on improving.'
    );
    else if (stage === 'CONVERSATION') paragraphs.push(
      responseLead, responseAware,
      `I wanted to understand a little more about how ${business} currently handles its online enquiries and customer journey.`,
      'What is working well for you at the moment, and what would you most like to improve?'
    );
    else if (stage === 'PROBLEM_ID') paragraphs.push(
      responseLead, responseAware,
      verifiedProblem ? problemLine : 'I do not want to assume what the challenge is on your side.',
      verifiedProblem ? 'Could you tell me how this affects the business and what you have tried so far?' : 'What is the biggest challenge you are experiencing with your website, marketing or handling enquiries?'
    );
    else if (stage === 'CONNECT') paragraphs.push(
      responseLead, responseAware, problemLine,
      `${serviceLine} Based on what you have shared, this may be a practical area to explore for ${business}.`,
      'Would it be useful if I outlined what I would recommend and why?'
    );
    else if (stage === 'OFFER') paragraphs.push(
      responseLead, responseAware, problemLine,
      preview ? `The next step I can offer is: ${preview}.` : 'If helpful, I can put together a short outline of an approach for you to review. I will confirm what is included before preparing anything.',
      `${softExit} Would you prefer a brief call or for me to send the outline by email?`
    );
    else if (stage === 'CLOSE') paragraphs.push(
      responseLead, responseAware,
      'To make sure we are aligned, could we confirm the outcome you want, the scope that makes sense and who will approve the work?',
      'If everything is clear, we can agree on the next step and timing. If something is still uncertain, tell me what you need clarified.'
    );
    else paragraphs.push(
      responseLead, responseAware,
      detail || 'I wanted to follow up on the next step we discussed.',
      'Would you still like to explore this, or has the priority changed?'
    );
    paragraphs.push('', softExit, '', 'Kind regards,', signature, 'Coalesce Digital');
    body = paragraphs.filter((p, i) => p !== '' || (i > 0 && paragraphs[i - 1] !== '')).join('\n');
  } else {
    const compact = preferences.short || tone === 'DIRECT';
    if (stage === 'IDENTIFY') body = `Hi${contact ? ` ${contact}` : ''} — I came across ${business} and wanted to check: are you the right person to speak with about the business’s website and digital presence?`;
    else if (stage === 'ENGAGE') body = compliment
      ? `Hey${contact ? ` ${contact}` : ''} 👋 ${compliment} I’m with Coalesce Digital. Thought I’d connect — what are you currently focused on growing at ${business}?`
      : `Hey${contact ? ` ${contact}` : ''} 👋 Came across ${business} and wanted to connect. What are you currently focused on improving in the business?`;
    else if (stage === 'CONVERSATION') body = response
      ? `${responseLead} ${responseAware} What does that process currently look like for you at ${business}?`
      : `Hey${contact ? ` ${contact}` : ''}, quick question about ${business}: what are you currently doing to bring in and manage new customer enquiries?`;
    else if (stage === 'PROBLEM_ID') body = response
      ? `${responseLead} ${responseAware} I want to make sure I understand properly — what has been the biggest challenge with that, and how is it affecting the business?`
      : verifiedProblem
        ? `You mentioned ${verifiedProblem}. How is that affecting ${business} day-to-day, and what have you tried so far?`
        : `I don’t want to assume where the problem is. What is the biggest challenge you’re facing with your website, marketing or customer enquiries at the moment?`;
    else if (stage === 'CONNECT') body = response
      ? `${responseLead} Based on what you’ve shared, ${serviceLine.toLowerCase()} Would it be useful if I explained how that could address the issue?`
      : `From what you’ve described, there may be a fit for ${service || 'one of our digital services'}. Is improving this something you’re actively looking at?`;
    else if (stage === 'OFFER') body = preview
      ? `Based on what we discussed, I can share this next step: ${preview}. Would you like me to send it through?`
      : `Would it help if I put together a short outline / concept for ${business}, based on what you told me? I’ll confirm the scope before preparing it. ${softExit}`;
    else if (stage === 'CLOSE') body = response
      ? `${responseLead} Just so we can move this forward clearly: are you comfortable with the proposed direction, or is there anything you’d like me to clarify before we agree on the next step?`
      : `If the approach makes sense, the next step is to confirm the scope, timing and who needs to approve it. What would you need from me to make a decision?`;
    else body = response
      ? `${responseLead} ${responseAware} Just following up on the next step we discussed. Is this still something you’d like to explore, or should I check back another time?`
      : `Hey${contact ? ` ${contact}` : ''}, following up on our earlier conversation about ${business}. Has this moved up the priority list, or would another time be better?`;
    if (detail && !['IDENTIFY', 'ENGAGE'].includes(stage) && !body.includes(detail)) body += `\n\n${detail}`;
    if (compact && body.length > 550) body = body.slice(0, 545).trimEnd() + '…';
    if (tone === 'PROFESSIONAL') body = body.replace(/^Hey/g, 'Hi').replace(' 👋', '');
    if (tone === 'FRIENDLY' && !body.includes('😊') && body.length < 400) body += ' 😊';
    if (tone === 'NATURAL') body = body.replace(/\s{2,}/g, ' ');
    if (lowPressure && !body.includes('No pressure')) body += ' No pressure either way.';
    if (!preferences.question && body.endsWith('?')) body = body.slice(0, -1) + '.';
  }
  return { subject, body };
}

export const OutreachView: React.FC<OutreachViewProps> = ({ leads, initialLead }) => {
  const [activeChannel, setActiveChannel] = useState<OutreachChannel>('WHATSAPP');
  const [selectedLeadId, setSelectedLeadId] = useState(initialLead?.id || leads[0]?.id || '');
  const [selectedStage, setSelectedStage] = useState<OutreachStage>('CONVERSATION');
  const [tone, setTone] = useState<Tone>('NATURAL');
  const [lastResponse, setLastResponse] = useState('');
  const [problem, setProblem] = useState('');
  const [problemVerified, setProblemVerified] = useState(false);
  const [context, setContext] = useState('');
  const [previewDetails, setPreviewDetails] = useState('');
  const [senderName, setSenderName] = useState('Coalesce Digital');
  const [preferences, setPreferences] = useState<Record<Preference, boolean>>({
    compliment: true, preview: false, lowPressure: true, short: false, question: true
  });
  const [customDraft, setCustomDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [copied, setCopied] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  const currentLead = leads.find(lead => lead.id === selectedLeadId) || null;
  const stage = STAGES.find(item => item.id === selectedStage)!;
  const channel = CHANNELS.find(item => item.id === activeChannel)!;
  const usableLeadProblem = currentLead && known(currentLead.problem) ? currentLead.problem : '';

  useEffect(() => {
    setProblem(usableLeadProblem);
    setProblemVerified(false);
    setLastResponse('');
    setContext('');
    setCustomDraft('');
    setSubject('');
  }, [selectedLeadId, usableLeadProblem]);

  const canUseVerifiedProblem = problemVerified && problem.trim().length > 0;
  const generate = () => {
    if (!currentLead) return;
    const result = createDraft({
      channel: activeChannel, stage: selectedStage, lead: currentLead, tone,
      problem, problemVerified: canUseVerifiedProblem, lastResponse, context,
      preferences, previewDetails, senderName
    });
    setSubject(result.subject);
    setCustomDraft(result.body);
    setCopied(false);
    playCyberSound('response');
  };

  const copyDraft = async () => {
    if (!customDraft) return;
    const fullText = activeChannel === 'EMAIL' && subject ? `Subject: ${subject}\n\n${customDraft}` : customDraft;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      playCyberSound('click');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const togglePreference = (key: Preference) => setPreferences(previous => ({ ...previous, [key]: !previous[key] }));

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5"><div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200"><Send size={18} /></div><h2 className="font-display text-xl font-bold tracking-tight">SKEEM Sales Advisor</h2></div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">A conversation playbook and script generator — guide the next move, don't just generate copy.</p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-semibold"><ShieldCheck size={14} /> Evidence-led outreach</span>
      </header>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><h3 className="text-[11px] font-bold uppercase tracking-wider">SKEEM conversation stages</h3><span className="text-[10px] text-zinc-500">Select the stage you're actually in</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STAGES.map(item => <button key={item.id} type="button" onClick={() => { setSelectedStage(item.id); setCustomDraft(''); playCyberSound('click'); }}
            className={`p-3 rounded-xl border text-left transition-colors ${selectedStage === item.id ? 'bg-black border-black text-white' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}>
            <span className="block text-[11px] font-bold">{item.label}</span><span className={`block text-[9px] mt-1 leading-relaxed ${selectedStage === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{item.objective}</span>
          </button>)}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <button type="button" onClick={() => setAdvisorOpen(!advisorOpen)} className="w-full flex items-center justify-between text-left"><span className="flex items-center gap-2 text-xs font-bold uppercase"><Target size={14} /> Stage advisor · {stage.label}</span>{advisorOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
        {advisorOpen && <div className="grid md:grid-cols-3 gap-4 mt-3">
          <div><span className="text-[9px] font-bold uppercase text-zinc-400">Objective</span><p className="text-xs mt-1">{stage.objective}</p></div>
          <div><span className="text-[9px] font-bold uppercase text-zinc-400">Your move</span><p className="text-xs mt-1">{stage.action}</p></div>
          <div><span className="text-[9px] font-bold uppercase text-zinc-400">Move forward when</span><p className="text-xs mt-1">{stage.advance}</p></div>
        </div>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-zinc-200 p-4 space-y-4">
            <div className="flex items-center gap-2"><UserRound size={14} /><h3 className="text-[11px] font-bold uppercase">1. Prospect context</h3></div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Select a real lead
              <select value={selectedLeadId} onChange={e => setSelectedLeadId(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs normal-case">
                <option value="">Select prospect…</option>{leads.map(lead => <option key={lead.id} value={lead.id}>{lead.business}</option>)}
              </select>
            </label>
            {currentLead ? <div className="rounded-xl bg-zinc-50 p-3 text-xs space-y-1">
              <strong>{currentLead.business}</strong><p className="text-zinc-600">{currentLead.contactPerson || 'Contact name not recorded'} · {currentLead.industry || 'Industry not recorded'} · {currentLead.location || 'Location not recorded'}</p>
              <p className="text-zinc-600">Service hypothesis: {known(currentLead.potentialService) ? currentLead.potentialService : 'Not selected'}</p>
            </div> : <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-500">No prospect records available. Add a real prospect in Leads or Business Development first. MOSES will not invent one.</div>}

            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <div className="flex items-center justify-between"><label className="text-[10px] font-bold uppercase text-zinc-500">2. Problem / opportunity</label><span className="text-[9px] text-zinc-400">Only use when verified</span></div>
              <textarea rows={3} value={problem} onChange={e => { setProblem(e.target.value); setProblemVerified(false); }} placeholder="What did the prospect actually say, or what have you directly observed?" className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs" />
              <label className="flex items-start gap-2 text-[10px] text-zinc-600"><input type="checkbox" checked={problemVerified} onChange={e => setProblemVerified(e.target.checked)} className="mt-0.5" />I have verified this problem directly with the prospect or personally observed it. MOSES may reference it as a fact.</label>
              {!canUseVerifiedProblem && <p className="text-[9px] text-amber-700 flex items-center gap-1"><AlertCircle size={11} /> This information will not be stated as a confirmed problem until verified.</p>}
            </div>

            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500">3. Last response / conversation history</label>
              <textarea rows={4} value={lastResponse} onChange={e => { setLastResponse(e.target.value); setCustomDraft(''); }} placeholder="Paste the prospect's latest reply or the relevant part of the conversation. Leave blank for a first message." className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs" />
              <p className="text-[9px] text-zinc-400">MOSES uses this as context for the next reply. It does not assume the prospect said anything you haven't pasted.</p>
            </div>

            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Additional verified context</label>
              <textarea rows={2} value={context} onChange={e => { setContext(e.target.value); setCustomDraft(''); }} placeholder="Specific post, product, previous discussion, business goal or detail to reference…" className="w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div className="flex items-center gap-2"><MessageCircle size={14} /><h3 className="text-[11px] font-bold uppercase">4. Platform & tone</h3></div>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => { setActiveChannel(item.id); setCustomDraft(''); }}
                className={`p-2.5 rounded-xl border text-left ${activeChannel === item.id ? 'bg-black text-white border-black' : 'border-zinc-200 hover:border-zinc-400'}`}><span className="flex items-center gap-2 text-xs font-semibold"><Icon size={14} />{item.label}</span><span className={`block text-[9px] mt-1 ${activeChannel === item.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{item.hint}</span></button>; })}
            </div>
            <label className="block text-[10px] font-bold uppercase text-zinc-500">Message tone<select value={tone} onChange={e => { setTone(e.target.value as Tone); setCustomDraft(''); }} className="mt-1 w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs normal-case">{TONES.map(item => <option key={item.id} value={item.id}>{item.label} — {item.description}</option>)}</select></label>
            <div className="border-t border-zinc-100 pt-3 space-y-2">
              <h4 className="text-[10px] font-bold uppercase text-zinc-500">5. SKEEM preferences</h4>
              {([
                ['compliment', 'Use a genuine, context-based compliment'],
                ['preview', 'Include a preview / concept only when details exist'],
                ['lowPressure', 'Keep the next step low-pressure'],
                ['short', 'Keep social messages especially short'],
                ['question', 'End with one clear question']
              ] as [Preference, string][]).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[10px] text-zinc-700"><input type="checkbox" checked={preferences[key]} onChange={() => togglePreference(key)} />{label}</label>)}
              <label className="block text-[10px] text-zinc-500">Genuine compliment / relevant opener<input value={context} onChange={e => setContext(e.target.value)} placeholder="Only add a detail you can stand behind" className="mt-1 w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs" /></label>
              <label className="block text-[10px] text-zinc-500">Preview details (optional)<input value={previewDetails} onChange={e => setPreviewDetails(e.target.value)} placeholder="Actual preview URL or what is ready to share" className="mt-1 w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs" /></label>
              <label className="block text-[10px] text-zinc-500">Sign-off / sender name<input value={senderName} onChange={e => setSenderName(e.target.value)} className="mt-1 w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs" /></label>
            </div>
            <button type="button" disabled={!currentLead} onClick={generate} className="w-full py-3 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Sparkles size={14} /> Generate {activeChannel === 'EMAIL' ? 'direct email' : 'stage-aware conversation reply'}</button>
          </div>
        </section>

        <section className="lg:col-span-7 min-w-0">
          <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3"><div><h3 className="text-xs font-bold uppercase">Script workshop</h3><p className="text-[10px] text-zinc-500 mt-1">{activeChannel === 'EMAIL' ? 'One complete, direct email.' : `A ${activeChannel.toLowerCase()} reply for the selected conversation stage.`}</p></div><button type="button" onClick={copyDraft} disabled={!customDraft} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-100 text-xs font-semibold disabled:opacity-40">{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy draft'}</button></div>
            {customDraft ? <>
              {activeChannel === 'EMAIL' && <label className="block text-[10px] font-bold uppercase text-zinc-500">Subject<input value={subject} onChange={e => setSubject(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs normal-case" /></label>}
              <textarea rows={18} value={customDraft} onChange={e => setCustomDraft(e.target.value)} className="w-full p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm leading-relaxed resize-y min-h-[340px]" />
              <p className="text-[9px] text-zinc-400">Review every detail before sending. This creates a draft only; it does not send messages or claim a preview exists.</p>
            </> : <div className="min-h-[340px] flex flex-col items-center justify-center text-center p-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200"><ClipboardList size={28} className="text-zinc-300 mb-3" /><p className="text-sm font-semibold">Your script will appear here</p><p className="text-xs text-zinc-500 mt-1 max-w-sm">Select a prospect, choose the real conversation stage, paste the last reply if available, set your tone and generate the next move.</p></div>}
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-200 p-4 space-y-2">
            <div className="flex items-center gap-2"><CheckCircle2 size={14} /><h3 className="text-[10px] font-bold uppercase">SKEEM guardrails</h3></div>
            <ul className="text-[10px] text-zinc-600 space-y-1 list-disc pl-4">
              <li>Research before outreach; don't fabricate a compliment or observation.</li>
              <li>Discover the need before recommending a service.</li>
              <li>Never state an unverified problem as fact.</li>
              <li>Offer a preview only when you can genuinely provide it.</li>
              <li>Each conversation advances at the prospect's pace; stages are not eight consecutive messages.</li>
              <li>Respect objections, a clear no and requests to stop contacting.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OutreachView;
