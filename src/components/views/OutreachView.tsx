import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Info, Send, ShieldCheck } from 'lucide-react';
import type { ActivityRecord, ActivityType, Lead, OutreachChannel, OutreachRecord, SkeemStageId } from '../../types';
import { SKEEM_PRINCIPLE, SKEEM_STAGES, addCountingDays, canContact, coldSequenceStatus, getSkeemStage, stageAdvanceCheck } from '../../lib/skeem';
import { useAccess } from '../AccessContext';
import { LeadRail, useLeadRows } from '../skeem/LeadRail';
import { CoachPanel, type SaveDraftInput } from '../skeem/CoachPanel';
import { Conversation } from '../skeem/Conversation';
import { DealPanel, type Commit } from '../skeem/DealPanel';
import { PRICEBOOK } from '../../lib/skeem';
import { nice, newId } from '../skeem/util';

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

export const OutreachView: React.FC<OutreachViewProps> = ({
  leads, initialLead, outreach, activities, onUpdateLead, onUpdateOutreach, onUpdateActivities, canPersist, writeError, userName
}) => {
  const { isPlatformAdmin, email } = useAccess();
  const [selectedId, setSelectedId] = useState(initialLead?.id || '');
  const [notice, setNotice] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStage, setGuideStage] = useState<SkeemStageId>('OPENING');
  const rows = useLeadRows(leads, outreach);

  // Open the most urgent prospect by default so the first screen already says who needs you.
  const activeId = selectedId && leads.some((l) => l.id === selectedId) ? selectedId : rows[0]?.lead.id || '';
  const lead = leads.find((l) => l.id === activeId) || null;
  const records = useMemo(() => outreach.filter((r) => r.leadId === activeId), [outreach, activeId]);
  const leadActivities = useMemo(() => activities.filter((a) => a.leadId === activeId).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15), [activities, activeId]);
  const cold = useMemo(() => (lead ? coldSequenceStatus(lead, records) : null), [lead, records]);
  const allowed = !!lead && canContact(lead);
  const actor = (userName || '').trim() || email || undefined;

  useEffect(() => { setNotice(''); if (lead?.skeemStage) setGuideStage(lead.skeemStage); }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const guard = () => {
    if (!canPersist) { setNotice('Saving is unavailable: MOSES has not finished loading your records. Nothing was saved.'); return false; }
    return true;
  };
  const log = (type: ActivityType, summary: string, detail?: string, stage?: SkeemStageId) => {
    if (!lead) return;
    onUpdateActivities((prev) => [{ id: newId('act'), leadId: lead.id, type, summary, detail, stage, at: new Date().toISOString(), actor }, ...prev]);
  };
  const patchLead = (patch: Partial<Lead>) => { if (lead) onUpdateLead({ ...lead, ...patch }); };
  const commit: Commit = (patch, activity) => {
    if (!guard()) return;
    patchLead(patch);
    if (activity) log(activity.type, activity.summary, activity.detail, activity.stage);
  };

  const saveDraft = (d: SaveDraftInput) => {
    if (!lead || !allowed || !guard()) return;
    onUpdateOutreach((prev) => [{ id: newId('out'), leadId: lead.id, stage: d.stage, channel: d.channel, direction: 'OUTBOUND', sequence: d.sequence, content: d.content, subject: d.subject, status: 'DRAFT', createdAt: new Date().toISOString(), createdBy: actor }, ...prev]);
    log('DRAFT_SAVED', `Saved a ${nice(d.channel)} draft`, undefined, d.stage);
    setNotice('Draft saved to the history below. It has NOT been sent. Send it yourself, then tap “I sent this”.');
  };
  const markSent = (r: OutreachRecord) => {
    if (!lead || !guard()) return;
    if (!canContact(lead)) { setNotice('This prospect has opted out. Nothing can be recorded as sent.'); return; }
    if (!window.confirm('Confirm you have actually sent this message yourself. MOSES never sends it for you.')) return;
    const now = new Date().toISOString();
    onUpdateOutreach((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'SENT', sentAt: now, updatedAt: now } : x)));
    patchLead({ lastContact: now.slice(0, 10) });
    log('OUTREACH_SENT', `Recorded a ${nice(r.channel)} message as sent`, undefined, r.stage);
    setNotice('Recorded as sent.');
  };
  const discard = (r: OutreachRecord) => {
    if (!guard()) return;
    onUpdateOutreach((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: 'CANCELLED', updatedAt: new Date().toISOString() } : x)));
    log('DRAFT_CANCELLED', `Discarded a ${nice(r.channel)} draft`, undefined, r.stage);
  };
  const recordReply = (text: string, channel: OutreachChannel) => {
    if (!lead || !guard()) return;
    const now = new Date().toISOString();
    onUpdateOutreach((prev) => [{ id: newId('out'), leadId: lead.id, stage: lead.skeemStage || 'OPENING', channel, direction: 'INBOUND', sequence: 'OTHER', content: text, status: 'RECEIVED', createdAt: now, sentAt: now, createdBy: actor }, ...prev]);
    patchLead({ lastContact: now.slice(0, 10) });
    log('REPLY_RECEIVED', `Prospect replied on ${nice(channel)}`, text.slice(0, 300), lead.skeemStage);
  };
  const setStage = (stage: SkeemStageId) => {
    if (!lead || !guard()) return;
    const check = stageAdvanceCheck(lead, stage);
    if (check.blockers.length) return;
    if (check.warnings.length && !window.confirm(check.warnings.join('\n\n') + '\n\nRecord this stage anyway?')) return;
    patchLead({ skeemStage: stage });
    log('STAGE_CHANGED', `SKEEM stage: ${lead.skeemStage ? getSkeemStage(lead.skeemStage).name : 'not set'} → ${getSkeemStage(stage).name}`, undefined, stage);
    setNotice(`Recorded: ${lead.business} is at stage ${getSkeemStage(stage).number} (${getSkeemStage(stage).name}). The CRM status is unchanged.`);
  };
  const setNextAction = (text: string, dueInDays?: number) => {
    if (!lead || !guard()) return;
    const patch: Partial<Lead> = { nextAction: text };
    if (dueInDays != null) patch.followUpDate = new Date(addCountingDays(Date.now(), dueInDays)).toISOString().slice(0, 10);
    patchLead(patch);
    log('FOLLOW_UP_SET', `Next action: ${text}`, patch.followUpDate ? `Follow-up ${patch.followUpDate}` : undefined);
    setNotice('Next action saved on the lead.');
  };
  const recordOptOut = () => {
    if (!lead || !guard()) return;
    if (!window.confirm('Record that this prospect has opted out or asked to stop contact? This cancels draft messages and clears the follow-up date.')) return;
    const now = new Date().toISOString();
    onUpdateOutreach((prev) => prev.map((r) => (r.leadId === lead.id && r.status === 'DRAFT' ? { ...r, status: 'CANCELLED', updatedAt: now } : r)));
    patchLead({ contactRestriction: 'OPT_OUT', followUpDate: '', nextAction: 'Do not contact — opt-out recorded' });
    log('OPT_OUT_RECORDED', 'Opt-out / request to stop contact recorded');
    setNotice('Opt-out recorded. Drafts were cancelled and all follow-ups are blocked.');
  };
  const clearOptOut = () => {
    if (!lead || !guard()) return;
    if (!window.confirm('Only clear this if the prospect themselves has re-opened the conversation. Clear the opt-out?')) return;
    patchLead({ contactRestriction: 'NONE' });
    log('OPT_OUT_CLEARED', 'Opt-out cleared');
  };

  const stage = getSkeemStage(guideStage);
  const recorded = lead?.skeemStage;

  return (
    <div className="h-full flex flex-col lg:flex-row bg-white text-zinc-900 font-sans overflow-hidden">
      <aside className="hidden lg:block w-72 shrink-0 border-r border-zinc-200"><LeadRail leads={leads} outreach={outreach} selectedId={activeId} onSelect={setSelectedId} /></aside>

      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div><div className="flex items-center gap-2"><Send size={16} /><h2 className="font-display text-lg font-bold tracking-tight">SKEEM Coach</h2></div><p className="text-xs text-zinc-500 mt-0.5">{SKEEM_PRINCIPLE} Every interaction has a next move, and every next move is recorded.</p></div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-semibold"><ShieldCheck size={13} /> Nothing is ever sent for you</span>
          </header>

          <div className="lg:hidden">
            <select value={activeId} onChange={(e) => setSelectedId(e.target.value)} className="w-full p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 text-sm">
              {rows.map(({ lead: l, badge }) => <option key={l.id} value={l.id}>{l.business} — {badge.text}</option>)}
            </select>
          </div>

          {(writeError || !canPersist || notice) && (
            <div className="space-y-2">
              {writeError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">Could not save: {writeError}</p>}
              {!canPersist && <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Your records are still loading, or could not be loaded. Saving is switched off so nothing is lost or overwritten. The coach still works.</p>}
              {notice && <p className="text-xs text-zinc-800 bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2">{notice}</p>}
            </div>
          )}

          {!lead || !cold ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">No prospects yet. Add a real prospect in Leads first. MOSES will not invent one.</div>
          ) : (
            <>
              <section className="rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div><h3 className="text-base font-bold">{lead.business}</h3><p className="text-xs text-zinc-500">{lead.contactPerson || 'Contact not recorded'}{lead.location ? ` · ${lead.location}` : ''}</p></div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 font-semibold">CRM: {nice(lead.status)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 font-semibold">{lead.priceRegion ? `${PRICEBOOK[lead.priceRegion].label} · ${PRICEBOOK[lead.priceRegion].display}` : 'Price region not set'}</span>
                    {!allowed && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">OPTED OUT</span>}
                  </div>
                </div>
                <ol className="flex items-center gap-1 overflow-x-auto pb-1">
                  {SKEEM_STAGES.map((s) => (
                    <li key={s.id} className="flex items-center gap-1 shrink-0">
                      <button type="button" title={s.intent} onClick={() => { setGuideStage(s.id); setGuideOpen(true); }}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${recorded === s.id ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'}`}>
                        {s.number} · {s.name.split(' ')[0]}
                      </button>
                      {s.number < 7 && <span className="text-zinc-300 text-[10px]">›</span>}
                    </li>
                  ))}
                </ol>
                {!recorded && <p className="text-[10px] text-zinc-500">No stage recorded yet. Ask the coach where this prospect is, then record it.</p>}
                <button type="button" onClick={() => setGuideOpen((v) => !v)} className="text-[11px] font-semibold flex items-center gap-1 text-zinc-600"><Info size={12} /> Stage guide {guideOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</button>
                {guideOpen && (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 space-y-2">
                    <p className="text-xs font-bold">{stage.number}. {stage.name}</p>
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
                      <div><span className="text-[9px] font-bold uppercase text-zinc-400">Objective</span><p className="mt-0.5">{stage.intent}</p></div>
                      <div><span className="text-[9px] font-bold uppercase text-zinc-400">Your move</span><p className="mt-0.5">{stage.yourMove}</p></div>
                      <div><span className="text-[9px] font-bold uppercase text-zinc-400">Move forward when</span><p className="mt-0.5">{stage.advanceWhen}</p></div>
                    </div>
                    <ul className="list-disc pl-4 text-[10px] text-zinc-600 space-y-0.5">{stage.guardrails.map((g) => <li key={g}>{g}</li>)}</ul>
                  </div>
                )}
              </section>

              <CoachPanel key={lead.id} lead={lead} cold={cold} records={records} allowed={allowed} canPersist={canPersist} userName={userName}
                onSaveDraft={saveDraft} onRecordReply={recordReply} onSetStage={setStage} onSetNextAction={setNextAction} onRecordOptOut={recordOptOut} />

              <section className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Conversation</h3>
                <Conversation records={records} canAct={allowed} onMarkSent={markSent} onCancel={discard} />
              </section>

              <section className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Deal details</h3>
                <DealPanel key={lead.id} lead={lead} isAdmin={isPlatformAdmin} canPersist={canPersist} activities={leadActivities} actor={actor} commit={commit} onRecordOptOut={recordOptOut} onClearOptOut={clearOptOut} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutreachView;
