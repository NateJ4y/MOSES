import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, Users, Plus, Globe, Instagram, Sparkles, ExternalLink,
  Send, Mail, Phone, Clock, X, ChevronDown, ChevronUp, CalendarDays,
  AlertTriangle, CheckCircle2, CircleHelp, Target, FileText
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface BusinessDevViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onUpdateLead: (lead: Lead) => void;
  onAddLead: (newLead: Lead) => void;
  onNavigateToOutreach: (lead: Lead) => void;
}

const PIPELINE_STAGES: { id: LeadStatus; label: string }[] = [
  { id: 'NEW', label: 'NEW' },
  { id: 'QUALIFIED', label: 'QUALIFIED' },
  { id: 'CONTACTED', label: 'CONTACTED' },
  { id: 'CONVERSATION', label: 'CONVERSATION' },
  { id: 'OPPORTUNITY', label: 'OPPORTUNITY' },
  { id: 'PROPOSAL', label: 'PROPOSAL' },
  { id: 'WON', label: 'WON' },
  { id: 'LOST', label: 'LOST' }
];

type EvidenceItem = { label: string; points: number; max: number; detail: string; present: boolean };

function meaningful(value?: string) {
  const text = (value || '').trim();
  return !!text && !/^(unknown|not set|none|n\/a|requires discovery|not recorded)/i.test(text);
}

function scoreEvidence(lead: Lead) {
  const items: EvidenceItem[] = [
    { label: 'Business identified', points: meaningful(lead.business) ? 15 : 0, max: 15, detail: meaningful(lead.business) ? 'Business name is recorded.' : 'Add a business name.', present: meaningful(lead.business) },
    { label: 'Contact channels', points: (meaningful(lead.email) ? 10 : 0) + (meaningful(lead.phone) ? 10 : 0), max: 20, detail: [meaningful(lead.email) ? 'Email recorded' : 'Email missing', meaningful(lead.phone) ? 'Phone recorded' : 'Phone missing'].join(' · '), present: meaningful(lead.email) || meaningful(lead.phone) },
    { label: 'Digital footprint', points: (meaningful(lead.website) ? 8 : 0) + (meaningful(lead.social) ? 7 : 0), max: 15, detail: [meaningful(lead.website) ? 'Website recorded' : 'Website not recorded', meaningful(lead.social) ? 'Social profile recorded' : 'Social profile not recorded'].join(' · '), present: meaningful(lead.website) || meaningful(lead.social) },
    { label: 'Documented business need', points: meaningful(lead.problem) ? 25 : 0, max: 25, detail: meaningful(lead.problem) ? 'A problem or opportunity has been documented.' : 'No specific business problem has been documented yet.', present: meaningful(lead.problem) },
    { label: 'Service hypothesis', points: meaningful(lead.potentialService) ? 15 : 0, max: 15, detail: meaningful(lead.potentialService) ? 'A potential service is selected; validate it in discovery.' : 'Select a possible service, then validate it with the prospect.', present: meaningful(lead.potentialService) },
    { label: 'Next action', points: meaningful(lead.nextAction) ? 10 : 0, max: 10, detail: meaningful(lead.nextAction) ? 'A next step is recorded.' : 'Record a clear next action.', present: meaningful(lead.nextAction) }
  ];
  const score = items.reduce((sum, item) => sum + item.points, 0);
  return { score, items, tier: score >= 80 ? 'WELL DOCUMENTED' : score >= 50 ? 'PARTIALLY DOCUMENTED' : 'INSUFFICIENT EVIDENCE' };
}

function followUpState(value?: string) {
  const raw = (value || '').trim();
  if (!raw || /^(not set|none|n\/a)$/i.test(raw)) return 'unset';
  if (/today/i.test(raw)) return 'due';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'unknown';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime() < today.getTime() ? 'overdue' : parsed.getTime() === today.getTime() ? 'due' : 'scheduled';
}

export const BusinessDevView: React.FC<BusinessDevViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onUpdateLead,
  onAddLead,
  onNavigateToOutreach
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id || null);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedScore, setExpandedScore] = useState(true);
  const [stageFilter, setStageFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newPotentialService, setNewPotentialService] = useState('Websites / Web Development');
  const [newLocation, setNewLocation] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newSocial, setNewSocial] = useState('');

  useEffect(() => {
    if (selectedLeadId && !leads.some(lead => lead.id === selectedLeadId)) {
      setSelectedLeadId(leads[0]?.id || null);
    } else if (!selectedLeadId && leads.length) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leads, selectedLeadId]);

  const selectedLead = leads.find(lead => lead.id === selectedLeadId) || null;
  const activeLeads = leads.filter(lead => !['WON', 'LOST'].includes(lead.status));
  const pipelineValue = activeLeads.reduce((sum, lead) => sum + (Number.isFinite(lead.estimatedValue) ? lead.estimatedValue : 0), 0);
  const followUpCounts = useMemo(() => leads.reduce((counts, lead) => {
    const state = followUpState(lead.followUpDate);
    if (state === 'due') counts.due += 1;
    if (state === 'overdue') counts.overdue += 1;
    if (state === 'scheduled') counts.scheduled += 1;
    if (state === 'unset' || state === 'unknown') counts.unset += 1;
    return counts;
  }, { due: 0, overdue: 0, scheduled: 0, unset: 0 }), [leads]);
  const stageCounts = PIPELINE_STAGES.map(stage => ({ ...stage, count: leads.filter(lead => lead.status === stage.id).length }));
  const filteredLeads = stageFilter === 'ALL' ? leads : leads.filter(lead => lead.status === stageFilter);
  const scored = leads.map(lead => scoreEvidence(lead));
  const averageEvidence = scored.length ? Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length) : null;
  const missingNeeds = leads.filter(lead => !meaningful(lead.problem)).length;
  const missingNextSteps = leads.filter(lead => !meaningful(lead.nextAction)).length;
  const proposalCount = leads.filter(lead => ['OPPORTUNITY', 'PROPOSAL'].includes(lead.status)).length;
  const wonCount = leads.filter(lead => lead.status === 'WON').length;

  const handleCreateLead = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newBizName.trim()) return;
    const lead: Lead = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lead-${Date.now()}`,
      business: newBizName.trim(),
      contactPerson: newContactPerson.trim() || undefined,
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      industry: newIndustry.trim() || 'Not recorded',
      location: newLocation.trim() || 'Not recorded',
      website: newWebsite.trim(),
      social: newSocial.trim(),
      socialLinks: { instagram: newSocial.trim() || undefined, whatsapp: newPhone.trim() || undefined },
      problem: newProblem.trim() || 'Not recorded — discovery required.',
      potentialService: newPotentialService,
      leadScore: 0,
      scoreTier: 'UNSCORED',
      status: 'NEW',
      estimatedValue: 0,
      nextAction: 'Verify prospect details and conduct discovery.',
      lastContact: '',
      followUpDate: '',
      scoreExplanation: 'Not scored as buying intent. Evidence readiness is calculated from the recorded fields.',
      signals: ['New record — verification required']
    };
    onAddLead(lead);
    setSelectedLeadId(lead.id);
    setIsAddModalOpen(false);
    setNewBizName(''); setNewContactPerson(''); setNewEmail(''); setNewPhone('');
    setNewIndustry(''); setNewProblem(''); setNewLocation(''); setNewWebsite(''); setNewSocial('');
    playCyberSound('response');
  };

  const metric = (id: string, label: string, value: string | number, note: string, detail: React.ReactNode) => (
    <button type="button" key={id} onClick={() => setExpandedMetric(expandedMetric === id ? null : id)}
      className="text-left p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 transition-colors">
      <span className="block text-[10px] text-zinc-400 uppercase font-semibold">{label}</span>
      <span className="block text-base font-bold text-zinc-900 mt-1">{value}</span>
      <span className="block text-[9px] text-zinc-500 mt-0.5">{note}</span>
      {expandedMetric === id && <span className="block mt-3 pt-3 border-t border-zinc-100 text-[10px] leading-relaxed text-zinc-600">{detail}</span>}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200"><TrendingUp size={18} /></div>
            <h2 className="font-display text-xl font-bold tracking-tight">Business Development</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Evidence-led qualification · Pipeline visibility · Next actions</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold">
          <Plus size={14} /> Qualify New Prospect
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wider">Pipeline at a glance</h3>
          <span className="text-[10px] text-zinc-400">Select a metric to inspect its meaning</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metric('value', 'Recorded pipeline value', `R${pipelineValue.toLocaleString()}`, 'Unweighted estimates · active stages only', <>Sum of estimated values recorded on active leads. This is not probability-weighted revenue and excludes WON and LOST records.</>)}
          {metric('active', 'Active prospects', activeLeads.length, 'Excludes won and lost', <>Count of records currently in NEW through PROPOSAL stages. No records are created by this metric.</>)}
          {metric('evidence', 'Average evidence', averageEvidence === null ? '—' : `${averageEvidence}/100`, 'Documentation completeness, not intent', <>Average of the evidence-readiness rubric shown on each lead. An empty pipeline has no score.</>)}
          {metric('followups', 'Due / overdue', followUpCounts.due + followUpCounts.overdue, `${followUpCounts.due} due · ${followUpCounts.overdue} overdue`, <>Uses the follow-up date stored on each lead. Unrecognised or missing dates are not counted as due.</>)}
          {metric('proposals', 'Opportunities / proposals', proposalCount, 'Current stage count', <>Records in OPPORTUNITY or PROPOSAL. This is a stage count, not a forecast.</>)}
          {metric('won', 'Won', wonCount, 'Closed-won records', <>Count of leads explicitly moved to WON. It does not infer revenue or active retainers.</>)}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h3 className="text-[11px] font-bold uppercase tracking-wider">Pipeline stages</h3><p className="text-[10px] text-zinc-500 mt-1">Choose a stage to filter the prospect list.</p></div>
          <button type="button" onClick={() => setStageFilter('ALL')} className="text-[10px] font-semibold underline">Show all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {stageCounts.map(stage => (
            <button key={stage.id} type="button" onClick={() => setStageFilter(stageFilter === stage.id ? 'ALL' : stage.id)}
              className={`p-2.5 rounded-xl border text-center ${stageFilter === stage.id ? 'border-black bg-white' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
              <span className="block text-[9px] font-semibold tracking-wider text-zinc-500">{stage.label}</span>
              <span className="block text-base font-bold mt-0.5">{stage.count}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <div className="flex items-center gap-2"><Target size={15} /><h3 className="text-[11px] font-bold uppercase tracking-wider">What needs attention</h3></div>
        {leads.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-zinc-50 p-3"><strong className="block text-lg">{followUpCounts.overdue}</strong><span className="text-zinc-600">Overdue follow-ups</span></div>
            <div className="rounded-xl bg-zinc-50 p-3"><strong className="block text-lg">{followUpCounts.unset}</strong><span className="text-zinc-600">Missing / unclear follow-up dates</span></div>
            <div className="rounded-xl bg-zinc-50 p-3"><strong className="block text-lg">{missingNeeds}</strong><span className="text-zinc-600">No documented business need</span></div>
            <div className="rounded-xl bg-zinc-50 p-3"><strong className="block text-lg">{missingNextSteps}</strong><span className="text-zinc-600">No clear next action</span></div>
          </div>
        ) : <p className="text-xs text-zinc-500">No prospect records yet. Attention summaries will appear when real records are added.</p>}
        {leads.length > 0 && <p className="text-[10px] text-zinc-500">Also scheduled: {followUpCounts.scheduled} · Due today: {followUpCounts.due} · These counts are derived from saved lead fields.</p>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        <section className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold">PROSPECT RECORDS</h3>
            <span className="text-[10px] text-zinc-500">{filteredLeads.length} shown · {leads.length} total</span>
          </div>
          {filteredLeads.length ? filteredLeads.map(lead => {
            const evidence = scoreEvidence(lead);
            return <button key={lead.id} type="button" onClick={() => setSelectedLeadId(lead.id)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all ${selectedLeadId === lead.id ? 'bg-zinc-50 border-black' : 'bg-white border-zinc-200 hover:border-zinc-400'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><strong className="block text-xs truncate">{lead.business}</strong><span className="block text-[10px] text-zinc-500 mt-1">{lead.industry} · {lead.location}</span></div>
                <span className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-full border border-zinc-200">{evidence.score}/100</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 text-[10px]">
                <span className="text-zinc-500">{lead.status} · {evidence.tier}</span>
                <span className="font-semibold">R{(lead.estimatedValue || 0).toLocaleString()} recorded</span>
              </div>
            </button>;
          }) : <div className="p-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
            <Users size={28} className="text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">No prospect records {stageFilter === 'ALL' ? 'yet' : `in ${stageFilter}`}</p>
            <p className="text-[11px] text-zinc-500 mt-1">{stageFilter === 'ALL' ? 'The pipeline is empty. Add a real prospect to begin.' : 'Try another stage or show all records.'}</p>
            {stageFilter === 'ALL' && <button type="button" onClick={() => setIsAddModalOpen(true)} className="mt-3 px-3.5 py-1.5 rounded-full bg-black text-white text-xs">Add first prospect</button>}
          </div>}
        </section>

        <section className="lg:col-span-7 min-w-0">
          {selectedLead ? (() => {
            const evidence = scoreEvidence(selectedLead);
            const followUp = followUpState(selectedLead.followUpDate);
            return <div className="rounded-2xl bg-white border border-zinc-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-200 pb-3">
                <div><h3 className="font-display text-base font-bold">{selectedLead.business}</h3><p className="text-xs text-zinc-500 mt-1">{selectedLead.contactPerson || 'Contact person not recorded'} · {selectedLead.location}</p>
                  <span className="inline-block mt-2 px-2 py-1 rounded-full bg-zinc-100 text-[10px] font-bold">{selectedLead.status}</span>
                </div>
                <button onClick={() => onNavigateToOutreach(selectedLead)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black text-white text-xs font-semibold"><Send size={12} /> Draft outreach</button>
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5">
                <button type="button" onClick={() => setExpandedScore(!expandedScore)} className="w-full flex items-center justify-between text-left">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase"><Sparkles size={14} /> Evidence readiness score</span>
                  <span className="flex items-center gap-2"><strong className="text-sm">{evidence.score}/100</strong>{expandedScore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                </button>
                <p className="text-[10px] text-zinc-600 mt-1">{evidence.tier}. This measures record completeness—not buying intent, budget, or probability of closing.</p>
                {expandedScore && <div className="mt-3 space-y-3">
                  {evidence.items.map(item => <div key={item.label}>
                    <div className="flex items-center justify-between text-[10px]"><strong>{item.label}</strong><span>{item.points}/{item.max}</span></div>
                    <div className="h-1.5 bg-zinc-200 rounded-full mt-1 overflow-hidden"><div className="h-full bg-zinc-800 rounded-full" style={{ width: `${item.points / item.max * 100}%` }} /></div>
                    <p className="text-[10px] text-zinc-500 mt-1">{item.detail}</p>
                  </div>)}
                  <p className="text-[9px] text-zinc-400 border-t border-zinc-200 pt-2">Scoring rubric: business identity 15 · contact channels 20 · digital footprint 15 · documented need 25 · service hypothesis 15 · next action 10. Missing fields earn zero; they are not assumed to be negative traits.</p>
                </div>}
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200"><span className="text-[9px] text-zinc-500 uppercase font-bold">Contact details</span>
                  <p className="mt-2 flex gap-2 items-center"><Mail size={12} />{selectedLead.email || 'Email not recorded'}</p>
                  <p className="mt-1 flex gap-2 items-center"><Phone size={12} />{selectedLead.phone || 'Phone not recorded'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200"><span className="text-[9px] text-zinc-500 uppercase font-bold">Digital footprint</span>
                  {meaningful(selectedLead.website) ? <a className="mt-2 flex items-center gap-2 underline break-all" href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noreferrer"><Globe size={12} />{selectedLead.website}<ExternalLink size={10} /></a> : <p className="mt-2">Website not recorded</p>}
                  <p className="mt-1 flex items-center gap-2"><Instagram size={12} />{selectedLead.social || 'Social profile not recorded'}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200"><span className="text-[9px] text-zinc-500 uppercase font-bold">Business need</span><p className="mt-1">{selectedLead.problem || 'Not documented'}</p></div>
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200"><span className="text-[9px] text-zinc-500 uppercase font-bold">Service hypothesis</span><p className="mt-1">{selectedLead.potentialService || 'Not selected'}</p></div>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 space-y-3">
                <div className="flex items-center gap-2"><CalendarDays size={13} /><span className="text-[10px] font-bold uppercase">Next action & follow-up</span></div>
                <p className="text-xs">{selectedLead.nextAction || 'No next action recorded.'}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span className={`font-semibold ${followUp === 'overdue' ? 'text-red-600' : followUp === 'due' ? 'text-amber-700' : 'text-zinc-500'}`}>Follow-up: {selectedLead.followUpDate || 'Not set'} · {followUp === 'overdue' ? 'OVERDUE' : followUp === 'due' ? 'DUE TODAY' : followUp === 'scheduled' ? 'SCHEDULED' : followUp === 'unknown' ? 'DATE NOT RECOGNISED' : 'NOT SET'}</span>
                  <label className="flex items-center gap-2">Pipeline stage
                    <select value={selectedLead.status} onChange={event => { playCyberSound('click'); onUpdateLeadStatus(selectedLead.id, event.target.value as LeadStatus); }} className="px-2 py-1 rounded-lg border border-zinc-300 bg-white text-xs">
                      {PIPELINE_STAGES.map(stage => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              {selectedLead.notes && <div className="rounded-xl bg-zinc-50 p-3 text-xs"><strong className="text-[10px] uppercase">Notes</strong><p className="mt-1 whitespace-pre-wrap">{selectedLead.notes}</p></div>}
            </div>;
          })() : <div className="min-h-[360px] rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center text-center p-8">
            <FileText size={24} className="text-zinc-400 mb-3" /><h3 className="text-sm font-bold">No prospect selected</h3><p className="text-xs text-zinc-500 mt-1">Add a real prospect or select a record to inspect its evidence and next steps.</p>
          </div>}
        </section>
      </div>

      {isAddModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-zinc-200 rounded-3xl p-6 relative shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-4"><h3 className="text-base font-bold">Add a real prospect</h3><button onClick={() => setIsAddModalOpen(false)}><X size={16} /></button></div>
          <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
            <label className="block">Business name *<input required value={newBizName} onChange={e => setNewBizName(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label>Contact person<input value={newContactPerson} onChange={e => setNewContactPerson(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
              <label>Industry<input value={newIndustry} onChange={e => setNewIndustry(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
              <label>Email<input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
              <label>Phone / WhatsApp<input value={newPhone} onChange={e => setNewPhone(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
              <label>Location<input value={newLocation} onChange={e => setNewLocation(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
              <label>Website<input value={newWebsite} onChange={e => setNewWebsite(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
            </div>
            <label className="block">Social profile<input value={newSocial} onChange={e => setNewSocial(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
            <label className="block">Observed business problem / opportunity<textarea rows={3} value={newProblem} onChange={e => setNewProblem(e.target.value)} placeholder="Record what you have actually observed or what the prospect told you." className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200" /></label>
            <label className="block">Potential service<select value={newPotentialService} onChange={e => setNewPotentialService(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200"><option>Websites / Web Development</option><option>Automation & AI</option><option>Social Media Management</option><option>Graphic Design / Branding</option></select></label>
            <p className="text-[10px] text-zinc-500">New prospects start at zero evidence points. The score updates as you record verifiable details; it does not estimate their willingness to buy.</p>
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200"><button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-full bg-zinc-100">Cancel</button><button type="submit" className="px-5 py-2 rounded-full bg-black text-white font-semibold">Save prospect</button></div>
          </form>
        </div>
      </div>}
    </div>
  );
};

export default BusinessDevView;
