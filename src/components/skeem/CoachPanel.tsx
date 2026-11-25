import React, { useRef, useState } from 'react';
import { AlertCircle, Ban, Check, Clock, Copy, Loader2, MessageCircle, Save, Send, Sparkles } from 'lucide-react';
import type { Lead, OutreachChannel, OutreachRecord, OutreachSequence, SkeemStageId } from '../../types';
import { getSkeemStage, lintDraft, stageAdvanceCheck, type ColdSequenceStatus } from '../../lib/skeem';
import type { AssistDraft, AssistResult } from '../../lib/ai/skeem-assist';
import { quickDraft, type Tone } from './quickDraft';
import { CHANNELS, TONES, nice, sequenceFor, shortDate } from './util';

export interface SaveDraftInput { content: string; subject?: string; channel: OutreachChannel; stage: SkeemStageId; sequence: OutreachSequence }

interface Props {
  lead: Lead;
  cold: ColdSequenceStatus;
  records: OutreachRecord[];
  allowed: boolean;
  canPersist: boolean;
  userName?: string;
  onSaveDraft: (d: SaveDraftInput) => void;
  onRecordReply: (text: string, channel: OutreachChannel) => void;
  onSetStage: (stage: SkeemStageId) => void;
  onSetNextAction: (text: string, dueInDays?: number) => void;
  onRecordOptOut: () => void;
}

interface Turn {
  id: number; ask: string; isReply: boolean; status: 'loading' | 'done' | 'error';
  result?: AssistResult; quick?: { subject: string; body: string; sendable: boolean }; error?: string;
}

const LABEL: Record<string, string> = { POSITIVE: 'Positive', NEUTRAL: 'Neutral', NEGATIVE: 'Negative', NONE: 'No response', UNKNOWN: 'Unclear' };

function nextMove(lead: Lead, cold: ColdSequenceStatus): { title: string; detail: string; ask: string; tone: 'red' | 'amber' | 'grey' | 'green' } {
  if (lead.contactRestriction === 'OPT_OUT') return { title: 'Opted out — do not contact', detail: 'Everything is blocked until the prospect themselves re-opens the conversation.', ask: '', tone: 'red' };
  switch (cold.state) {
    case 'NOT_STARTED': return { title: 'No outreach yet', detail: 'Start with research, then a short, honest opener.', ask: 'Draft my first outreach message to this prospect.', tone: 'amber' };
    case 'REPLIED': return { title: 'They replied — keep the conversation going', detail: 'The cold sequence has ended. Reply at their pace.', ask: 'What should I do next in this conversation, and what should I say?', tone: 'green' };
    case 'EXHAUSTED': return { title: 'Three touches, no reply — stop here', detail: `Move this lead to Lost or Nurture. Re-engagement can be considered from ${shortDate(cold.reengagementEligibleFrom)}.`, ask: 'The cold sequence is finished with no reply. What should I do with this lead?', tone: 'amber' };
    default: {
      const label = cold.next === 'SOFT_NUDGE' ? 'Soft nudge (Day 4)' : 'Final touch (Day 10)';
      return cold.due
        ? { title: `${label} is due${cold.overdueDays ? ` — ${cold.overdueDays} day${cold.overdueDays > 1 ? 's' : ''} overdue` : ' now'}`, detail: 'Days count Monday to Saturday.', ask: `Draft the ${label.toLowerCase()} for this prospect.`, tone: 'red' }
        : { title: `${label} is due ${shortDate(cold.dueAt)}`, detail: 'Nothing to send yet. Days count Monday to Saturday.', ask: '', tone: 'grey' };
    }
  }
}

const TONE_BG = { red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200', green: 'bg-emerald-50 border-emerald-200', grey: 'bg-zinc-50 border-zinc-200' } as const;

const DraftCard: React.FC<{
  lead: Lead; draft: AssistDraft | { label: string; channel: OutreachChannel; subject?: string; body: string }; stage: SkeemStageId; cold: ColdSequenceStatus;
  canSave: boolean; sendable: boolean; onSave: (d: SaveDraftInput) => void;
}> = ({ lead, draft, stage, cold, canSave, sendable, onSave }) => {
  const [body, setBody] = useState(draft.body);
  const [subject, setSubject] = useState(draft.subject || '');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const lint = lintDraft(body, lead);
  const blocked = lint.some((l) => l.level === 'block');
  const sequence = sequenceFor(lead, cold);
  const copy = async () => { try { await navigator.clipboard.writeText(draft.channel === 'EMAIL' && subject ? `Subject: ${subject}\n\n${body}` : body); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ } };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-zinc-500"><span className="font-bold uppercase tracking-wider text-zinc-700">{draft.label} · {nice(draft.channel)}</span><span>{sendable ? `Counts as: ${nice(sequence)} once sent` : 'Guidance, not a message'}</span></div>
      {draft.channel === 'EMAIL' && sendable && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs" />}
      <textarea value={body} onChange={(e) => { setBody(e.target.value); setSaved(false); }} rows={Math.min(14, Math.max(4, body.split('\n').length + 1))} className="w-full p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-xs sm:text-[13px] leading-relaxed resize-y" />
      {lint.map((l) => <p key={l.message} className={`text-[10px] flex items-start gap-1 ${l.level === 'block' ? 'text-red-700' : 'text-amber-700'}`}><AlertCircle size={11} className="mt-0.5 shrink-0" />{l.message}</p>)}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={copy} className="px-3 py-1.5 rounded-full bg-zinc-100 text-[11px] font-semibold flex items-center gap-1">{copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copied' : 'Copy'}</button>
        {sendable && <button type="button" disabled={!canSave || blocked || saved} onClick={() => { onSave({ content: body, subject: draft.channel === 'EMAIL' ? subject : undefined, channel: draft.channel, stage, sequence }); setSaved(true); }}
          className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"><Save size={11} />{saved ? 'Saved to history' : 'Save as draft'}</button>}
        <span className="text-[9px] text-zinc-400">Nothing is sent for you. Copying does not mark it as sent.</span>
      </div>
    </div>
  );
};

export const CoachPanel: React.FC<Props> = ({ lead, cold, allowed, canPersist, onSaveDraft, onRecordReply, onSetStage, onSetNextAction, onRecordOptOut, userName }) => {
  const [input, setInput] = useState('');
  const [replyMode, setReplyMode] = useState(false);
  const [channel, setChannel] = useState<OutreachChannel>('WHATSAPP');
  const [tone, setTone] = useState<Tone>('NATURAL');
  const [turns, setTurns] = useState<Turn[]>([]);
  const idRef = useRef(1);
  const busy = turns.some((t) => t.status === 'loading');
  const move = nextMove(lead, cold);
  const stageNow: SkeemStageId = lead.skeemStage || 'OPENING';

  const ask = async (message: string, isReply = false) => {
    const id = idRef.current++;
    setTurns((p) => [...p, { id, ask: message, isReply, status: 'loading' }]);
    try {
      const response = await fetch('/api/skeem/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, message, channel, tone, sequence: sequenceFor(lead, cold) })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error || `The coach returned an error (${response.status}).`);
      setTurns((p) => p.map((t) => t.id === id ? { ...t, status: 'done', result: body as AssistResult } : t));
    } catch (error) {
      setTurns((p) => p.map((t) => t.id === id ? { ...t, status: 'error', error: error instanceof Error ? error.message : 'The coach could not answer.' } : t));
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || busy || !allowed) return;
    setInput('');
    if (replyMode) {
      onRecordReply(text, channel);
      setReplyMode(false);
      void ask(`The prospect just replied on ${nice(channel)}. Their words (pasted by the user): "${text}"\n\nTell me where this leaves us and what to send back.`, true);
    } else void ask(text);
  };

  const quickFallback = () => {
    const id = idRef.current++;
    const q = quickDraft({ lead, channel, tone, stage: stageNow, cold, senderName: userName });
    setTurns((p) => [...p, { id, ask: 'Quick draft (no AI)', isReply: false, status: 'done', quick: { subject: q.subject, body: q.body, sendable: q.sendable } }]);
  };

  return (
    <section className="space-y-4">
      <div className={`rounded-2xl border p-4 ${TONE_BG[move.tone]}`}>
        <div className="flex items-start gap-3">
          <Clock size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{move.title}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{move.detail}</p>
            {move.ask && allowed && (
              <button type="button" disabled={busy} onClick={() => void ask(move.ask)} className="mt-3 px-4 py-2 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50"><Sparkles size={12} /> Ask SKEEM to do this</button>
            )}
          </div>
        </div>
      </div>

      {turns.length > 0 && (
        <div className="space-y-4">
          {turns.map((t) => (
            <div key={t.id} className="space-y-2">
              <div className="flex justify-end"><div className="max-w-[88%] rounded-2xl bg-zinc-900 text-white px-4 py-2.5 text-xs whitespace-pre-wrap">{t.isReply ? '↩ Their reply was recorded. Asking the coach…' : t.ask}</div></div>
              {t.status === 'loading' && <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 size={13} className="animate-spin" /> SKEEM is reading the history and thinking…</div>}
              {t.status === 'error' && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{t.error} <button type="button" onClick={quickFallback} className="underline font-semibold ml-1">Use a quick draft instead</button></div>}
              {t.quick && (
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-500">Template draft — no AI was used.</p>
                  <DraftCard lead={lead} draft={{ label: 'Quick draft', channel, subject: t.quick.subject, body: t.quick.body }} stage={stageNow} cold={cold} canSave={canPersist && allowed} sendable={t.quick.sendable} onSave={onSaveDraft} />
                </div>
              )}
              {t.result && <ResultCard key={t.id} lead={lead} cold={cold} result={t.result} canPersist={canPersist} allowed={allowed} onSaveDraft={onSaveDraft} onSetStage={onSetStage} onSetNextAction={onSetNextAction} onRecordOptOut={onRecordOptOut} onQuick={quickFallback} />}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 p-3 space-y-3 bg-white">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" disabled={busy || !allowed} onClick={() => void ask('Draft the next message I should send to this prospect, based on where we are.')} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-50 disabled:opacity-40">Draft my next message</button>
          <button type="button" disabled={busy || !allowed} onClick={() => setReplyMode((v) => !v)} className={`px-3 py-1.5 rounded-full border text-[11px] font-semibold disabled:opacity-40 ${replyMode ? 'bg-sky-100 border-sky-300 text-sky-900' : 'border-zinc-300 hover:bg-zinc-50'}`}>They replied…</button>
          <button type="button" disabled={busy || !allowed} onClick={() => { setReplyMode(false); setInput('They pushed back: '); }} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-50 disabled:opacity-40">Handle an objection</button>
          <button type="button" disabled={busy || !allowed} onClick={() => void ask('Plan my follow-up: when should I follow up, and what should I say?')} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-50 disabled:opacity-40">Plan my follow-up</button>
        </div>
        {replyMode && <p className="text-[10px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">Paste exactly what they said. Sending will record it in the history and the cold sequence will end.</p>}
        <textarea value={input} disabled={!allowed} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} rows={replyMode ? 4 : 3}
          placeholder={!allowed ? 'This prospect has opted out.' : replyMode ? 'Paste their reply here…' : 'Ask SKEEM anything about this prospect, or describe what happened…'}
          className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-[13px] leading-relaxed resize-y disabled:opacity-60" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">{CHANNELS.map((c) => <button key={c.id} type="button" onClick={() => setChannel(c.id)} className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${channel === c.id ? 'bg-black text-white border-black' : 'border-zinc-200 text-zinc-600'}`}>{c.label}</button>)}</div>
          <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="p-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px]">{TONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
          <div className="flex-1" />
          <button type="button" onClick={quickFallback} disabled={!allowed} className="text-[10px] underline text-zinc-500 disabled:opacity-40">Quick draft (no AI)</button>
          <button type="button" onClick={send} disabled={!input.trim() || busy || !allowed} className="px-4 py-2 rounded-full bg-black text-white text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-40">{busy ? <Loader2 size={12} className="animate-spin" /> : replyMode ? <MessageCircle size={12} /> : <Send size={12} />}{replyMode ? 'Log reply & get advice' : 'Send'}</button>
        </div>
      </div>
    </section>
  );
};

const ResultCard: React.FC<{
  lead: Lead; cold: ColdSequenceStatus; result: AssistResult; canPersist: boolean; allowed: boolean;
  onSaveDraft: (d: SaveDraftInput) => void; onSetStage: (s: SkeemStageId) => void; onSetNextAction: (t: string, d?: number) => void; onRecordOptOut: () => void; onQuick: () => void;
}> = ({ lead, cold, result, canPersist, allowed, onSaveDraft, onSetStage, onSetNextAction, onRecordOptOut, onQuick }) => {
  if (result.status === 'BLOCKED' || result.status === 'NOT_CONNECTED' || result.status === 'ERROR') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs space-y-1.5">
        <p className="font-bold">{result.headline}</p><p className="text-zinc-700">{result.advice}</p>
        {result.status !== 'BLOCKED' && <button type="button" onClick={onQuick} className="underline font-semibold">Use a quick draft instead</button>}
      </div>
    );
  }
  const stage = result.stage;
  const check = stage ? stageAdvanceCheck(lead, stage.id) : { blockers: [], warnings: [] };
  const stageSet = !!stage && lead.skeemStage === stage.id;
  const draftStage: SkeemStageId = stage?.id || lead.skeemStage || 'OPENING';
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
      <p className="text-sm font-bold leading-snug">{result.headline}</p>
      {stage && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white font-bold">Stage {getSkeemStage(stage.id).number} · {stage.name}</span>
          <span className="text-zinc-500">{stage.reason}</span>
          {!stageSet && <button type="button" disabled={!canPersist || check.blockers.length > 0} onClick={() => onSetStage(stage.id)} className="px-2.5 py-1 rounded-full border border-zinc-300 font-semibold disabled:opacity-40">Record on lead</button>}
          {stageSet && <span className="text-emerald-700 font-semibold">Recorded</span>}
        </div>
      )}
      {check.blockers.map((b) => <p key={b} className="text-[10px] text-red-700 flex items-start gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0" />{b}</p>)}
      {result.advice && <p className="text-xs sm:text-[13px] leading-relaxed text-zinc-800 whitespace-pre-wrap">{result.advice}</p>}
      {(result.signals.sentiment !== 'UNKNOWN' || result.signals.objection) && (
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          {result.signals.sentiment !== 'UNKNOWN' && <span className="px-2 py-0.5 rounded-full bg-zinc-100 font-semibold">Mood: {LABEL[result.signals.sentiment]}</span>}
          {result.signals.objection && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">Objection: {result.signals.objection}</span>}
        </div>
      )}
      {result.signals.optOutDetected && allowed && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs space-y-2">
          <p className="font-bold text-red-800">This sounds like a request to stop contact.</p>
          <p className="text-red-800">Respect it. Recording an opt-out cancels drafts and blocks all follow-ups.</p>
          <button type="button" onClick={onRecordOptOut} disabled={!canPersist} className="px-3 py-1.5 rounded-full bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-40"><Ban size={11} /> Record opt-out</button>
        </div>
      )}
      {result.warnings.map((w) => <p key={w} className="text-[10px] text-amber-800 flex items-start gap-1"><AlertCircle size={11} className="mt-0.5 shrink-0" />{w}</p>)}
      {result.needsFromYou.length > 0 && (
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">SKEEM needs from you</p><ul className="list-disc pl-4 text-xs text-zinc-700 space-y-0.5">{result.needsFromYou.map((n) => <li key={n}>{n}</li>)}</ul></div>
      )}
      {result.drafts.map((d, i) => <DraftCard key={i} lead={lead} draft={d} stage={draftStage} cold={cold} canSave={canPersist && allowed} sendable onSave={onSaveDraft} />)}
      {result.nextAction && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-xs">
          <span className="font-bold">Next move:</span><span className="flex-1 min-w-0">{result.nextAction.text}{result.nextAction.dueInDays != null ? ` (in ${result.nextAction.dueInDays} counting day${result.nextAction.dueInDays === 1 ? '' : 's'})` : ''}</span>
          <button type="button" disabled={!canPersist} onClick={() => onSetNextAction(result.nextAction!.text, result.nextAction!.dueInDays)} className="px-2.5 py-1 rounded-full border border-zinc-300 text-[10px] font-semibold disabled:opacity-40">Save as next action</button>
        </div>
      )}
    </div>
  );
};
