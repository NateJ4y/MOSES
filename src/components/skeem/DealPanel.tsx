import React, { useState } from 'react';
import { Ban, Check } from 'lucide-react';
import type { ActivityRecord, ActivityType, Lead, SkeemStageId } from '../../types';
import {
  PRICEBOOK, PRICE_REGIONS, PRICE_SCOPE_RECORDED, addCountingDays, canContact, isUnknownText, suggestPriceRegion, type PriceRegion
} from '../../lib/skeem';
import { day, nice, when } from './util';

export type Commit = (patch: Partial<Lead>, activity?: { type: ActivityType; summary: string; detail?: string; stage?: SkeemStageId }) => void;

interface Props {
  lead: Lead; isAdmin: boolean; canPersist: boolean; activities: ActivityRecord[]; actor?: string;
  commit: Commit; onRecordOptOut: () => void; onClearOptOut: () => void;
}

const CONCEPT = ['NONE', 'REQUESTED', 'APPROVED', 'IN_CREATION', 'QUALITY_CHECKED', 'DELIVERED'] as const;
const AFTER_APPROVAL = ['APPROVED', 'IN_CREATION', 'QUALITY_CHECKED', 'DELIVERED'];
const PROPOSAL = ['NONE', 'DRAFTED', 'PRESENTED', 'ACCEPTED_VERBALLY', 'DECLINED'] as const;
const PAYMENT = ['NOT_REQUESTED', 'AWAITING_PAYMENT', 'VERIFIED'] as const;

const box = 'rounded-xl border border-zinc-200 p-3 space-y-2';
const head = 'text-[10px] font-bold uppercase tracking-wider text-zinc-500';
const sel = 'w-full p-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs disabled:opacity-50';

export const DealPanel: React.FC<Props> = ({ lead, isAdmin, canPersist, activities, actor, commit, onRecordOptOut, onClearOptOut }) => {
  const [problem, setProblem] = useState(!isUnknownText(lead.problem) ? lead.problem : '');
  const [verified, setVerified] = useState(!!lead.problemVerified);
  const [link, setLink] = useState(lead.conceptUrl || '');
  const [days, setDays] = useState(3);
  const [msg, setMsg] = useState('');
  const status = lead.conceptStatus || 'NONE';
  const suggested = suggestPriceRegion(lead.location);
  const price = lead.priceRegion ? PRICEBOOK[lead.priceRegion] : null;

  const setConcept = (value: (typeof CONCEPT)[number]) => {
    const url = link.trim();
    if ((value === 'QUALITY_CHECKED' || value === 'DELIVERED') && !url) { setMsg('Add the concept link first. A concept is only quality-checked or delivered when it exists and has a link.'); return; }
    setMsg('');
    commit({ conceptStatus: value, conceptUrl: url || lead.conceptUrl }, { type: 'CONCEPT_STATUS_CHANGED', summary: `Concept: ${nice(value)}`, detail: url || undefined, stage: 'THE_SKEEM' });
  };
  const approve = () => {
    const due = new Date(addCountingDays(Date.now(), Math.max(1, days))).toISOString().slice(0, 10);
    commit(
      { conceptStatus: 'APPROVED', conceptDueDate: due, conceptApprovedBy: actor || 'Super admin', conceptApprovedAt: new Date().toISOString() },
      { type: 'CONCEPT_STATUS_CHANGED', summary: `Concept approved by the super admin, due ${due}`, detail: `${days} counting day${days > 1 ? 's' : ''} (Monday to Saturday)`, stage: 'THE_SKEEM' }
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className={box}>
        <p className={head}>Price region</p>
        <select disabled={!canPersist} value={lead.priceRegion || ''} onChange={(e) => { const v = e.target.value as PriceRegion | ''; commit({ priceRegion: v || undefined }, { type: 'NOTE', summary: v ? `Price region set to ${PRICEBOOK[v].label}` : 'Price region cleared' }); }} className={sel}>
          <option value="">Not set</option>
          {PRICE_REGIONS.map((r) => <option key={r} value={r}>{PRICEBOOK[r].label} — {PRICEBOOK[r].display}</option>)}
        </select>
        {!lead.priceRegion && suggested && <p className="text-[10px] text-zinc-600">Based on “{lead.location}”, this looks like {PRICEBOOK[suggested].label}. <button type="button" className="underline font-semibold" disabled={!canPersist} onClick={() => commit({ priceRegion: suggested }, { type: 'NOTE', summary: `Price region set to ${PRICEBOOK[suggested].label}` })}>Use it</button></p>}
        {price && <p className="text-[10px] text-zinc-600">Standard price: <strong>{price.display}</strong>.{!PRICE_SCOPE_RECORDED && ' What it includes and whether it recurs is not recorded yet, so SKEEM states the amount only.'}</p>}
      </div>

      <div className={box}>
        <p className={head}>Verified need</p>
        <textarea rows={3} value={problem} onChange={(e) => { setProblem(e.target.value); setVerified(false); }} placeholder="What did they actually say, or what did you directly observe?" className={sel} />
        <label className="flex items-start gap-2 text-[10px] text-zinc-600"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="mt-0.5" />I verified this with the prospect or observed it myself.</label>
        <div className="flex items-center gap-2"><button type="button" disabled={!canPersist || !verified || !problem.trim()} onClick={() => commit({ problem: problem.trim(), problemVerified: true }, { type: 'PROBLEM_VERIFIED', summary: 'Recorded a verified need', detail: problem.trim().slice(0, 300) })} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold disabled:opacity-40">Save to lead</button>{lead.problemVerified && <span className="text-[10px] text-emerald-700 flex items-center gap-1"><Check size={11} /> Saved</span>}</div>
      </div>

      <div className={box + ' md:col-span-2'}>
        <p className={head}>Concept</p>
        <p className="text-[10px] text-zinc-500">Free, no-obligation, and not a finished website. The super admin approves each request and sets the turnaround.</p>
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="px-2 py-0.5 rounded-full bg-zinc-100 font-semibold">{nice(status)}</span>{lead.conceptDueDate && <span>Due <strong>{lead.conceptDueDate}</strong></span>}{lead.conceptApprovedBy && <span className="text-zinc-500">Approved by {lead.conceptApprovedBy}</span>}</div>
        {status === 'NONE' && !isAdmin && <button type="button" disabled={!canPersist} onClick={() => commit({ conceptStatus: 'REQUESTED' }, { type: 'CONCEPT_STATUS_CHANGED', summary: 'Concept requested', stage: 'THE_SKEEM' })} className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold disabled:opacity-40">Request a concept</button>}
        {status === 'REQUESTED' && !isAdmin && <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">Waiting for the super admin to approve this and set the turnaround.</p>}
        {isAdmin && (status === 'NONE' || status === 'REQUESTED') && (
          <div className="flex flex-wrap items-center gap-2"><label className="text-[11px]">Turnaround <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} className="w-14 mx-1 p-1 rounded border border-zinc-300 text-xs" /> counting days (Mon–Sat)</label><button type="button" disabled={!canPersist} onClick={approve} className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-bold disabled:opacity-40">Approve concept</button></div>
        )}
        {(isAdmin ? status !== 'NONE' : AFTER_APPROVAL.includes(status)) ? (
          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-[10px] text-zinc-500">Concept link<input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className={sel + ' mt-1'} /><span className="block mt-1 text-[9px] text-zinc-400">Saved when you change the status.</span></label>
            <label className="text-[10px] text-zinc-500">Status<select disabled={!canPersist} value={status} onChange={(e) => setConcept(e.target.value as (typeof CONCEPT)[number])} className={sel + ' mt-1'}>{CONCEPT.filter((c) => isAdmin || AFTER_APPROVAL.includes(c)).map((c) => <option key={c} value={c}>{nice(c)}</option>)}</select></label>
          </div>
        ) : null}
        {msg && <p className="text-[10px] text-red-700">{msg}</p>}
      </div>

      <div className={box}>
        <p className={head}>Proposal & payment</p>
        <label className="block text-[10px] text-zinc-500">Proposal<select disabled={!canPersist} value={lead.proposalStatus || 'NONE'} onChange={(e) => commit({ proposalStatus: e.target.value as Lead['proposalStatus'] }, { type: 'PROPOSAL_STATUS_CHANGED', summary: `Proposal: ${nice(e.target.value)}`, stage: 'PRESENTATION_CLOSING' })} className={sel + ' mt-1'}>{PROPOSAL.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
        <label className="block text-[10px] text-zinc-500">Payment<select disabled={!canPersist} value={lead.paymentVerificationStatus || 'NOT_REQUESTED'} onChange={(e) => { if (e.target.value === 'VERIFIED' && !window.confirm('Confirm payment has actually been received and checked.')) return; commit({ paymentVerificationStatus: e.target.value as Lead['paymentVerificationStatus'] }, { type: 'PAYMENT_STATUS_CHANGED', summary: `Payment: ${nice(e.target.value)}`, stage: 'FOLLOW_UP_HANDOVER' }); }} className={sel + ' mt-1'}>{PAYMENT.map((s) => <option key={s} value={s}>{nice(s)}</option>)}</select></label>
        <p className="text-[9px] text-zinc-400">A lead is only won once payment is verified.</p>
      </div>

      <div className={box}>
        <p className={head}>Follow-up & contact</p>
        <label className="block text-[10px] text-zinc-500">Next action<input disabled={!canPersist} defaultValue={!isUnknownText(lead.nextAction) ? lead.nextAction : ''} onBlur={(e) => { if (e.target.value !== (lead.nextAction || '')) commit({ nextAction: e.target.value }, { type: 'FOLLOW_UP_SET', summary: `Next action: ${e.target.value || 'cleared'}` }); }} className={sel + ' mt-1'} /></label>
        <label className="block text-[10px] text-zinc-500">Follow-up date<input type="date" disabled={!canPersist} defaultValue={!isUnknownText(lead.followUpDate) ? day(lead.followUpDate) : ''} onBlur={(e) => { if (e.target.value && e.target.value !== lead.followUpDate) commit({ followUpDate: e.target.value }, { type: 'FOLLOW_UP_SET', summary: `Follow-up set for ${e.target.value}` }); }} className={sel + ' mt-1'} /></label>
        {canContact(lead)
          ? <button type="button" disabled={!canPersist} onClick={onRecordOptOut} className="px-3 py-1.5 rounded-full border border-red-200 text-red-700 text-[11px] font-semibold hover:bg-red-50 flex items-center gap-1 disabled:opacity-40"><Ban size={11} /> Record opt-out / “no”</button>
          : <button type="button" disabled={!canPersist} onClick={onClearOptOut} className="px-3 py-1.5 rounded-full border border-zinc-300 text-[11px] font-semibold hover:bg-zinc-100">Clear opt-out</button>}
      </div>

      <div className={box + ' md:col-span-2'}>
        <p className={head}>Activity</p>
        {activities.length === 0 ? <p className="text-xs text-zinc-500">No activity yet.</p> : <ul className="space-y-1">{activities.map((a) => <li key={a.id} className="text-[11px] text-zinc-700 flex gap-2"><span className="text-zinc-400 shrink-0 w-32">{when(a.at)}</span><span>{a.summary}{a.actor ? <span className="text-zinc-400"> · {a.actor}</span> : null}</span></li>)}</ul>}
      </div>
    </div>
  );
};
