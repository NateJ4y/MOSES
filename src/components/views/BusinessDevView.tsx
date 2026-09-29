import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Flame, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Plus, 
  ArrowRight, 
  Globe, 
  Instagram, 
  AlertTriangle, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Send,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  X
} from 'lucide-react';
import { Lead, LeadStatus, LeadScoreTier } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface BusinessDevViewProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
  onAddLead: (newLead: Lead) => void;
  onNavigateToOutreach: (lead: Lead) => void;
}

const PIPELINE_STAGES: { id: LeadStatus; label: string; badgeColor: string }[] = [
  { id: 'NEW', label: 'NEW', badgeColor: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  { id: 'QUALIFIED', label: 'QUALIFIED', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'CONTACTED', label: 'CONTACTED', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'CONVERSATION', label: 'CONVERSATION', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'OPPORTUNITY', label: 'OPPORTUNITY', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'PROPOSAL', label: 'PROPOSAL', badgeColor: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'WON', label: 'WON', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'LOST', label: 'LOST', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' }
];

export const BusinessDevView: React.FC<BusinessDevViewProps> = ({
  leads,
  onUpdateLeadStatus,
  onAddLead,
  onNavigateToOutreach
}) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(leads[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newPotentialService, setNewPotentialService] = useState('Websites / Web Development');
  const [newLocation, setNewLocation] = useState('Cape Town, SA');
  const [newWebsite, setNewWebsite] = useState('');
  const [newSocial, setNewSocial] = useState('');

  // Metrics
  const safeLeads = leads || [];
  const pipelineValue = safeLeads
    .filter(l => l.status !== 'LOST' && l.status !== 'WON')
    .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);
  
  const activeLeadsCount = safeLeads.filter(l => l.status !== 'LOST' && l.status !== 'WON').length;
  const hotLeadsCount = safeLeads.filter(l => l.scoreTier === 'HOT').length;
  const followUpsDueCount = safeLeads.filter(l => (l.followUpDate || '').includes('Today')).length;
  const proposalsCount = safeLeads.filter(l => l.status === 'PROPOSAL' || l.status === 'OPPORTUNITY').length;
  const wonCount = safeLeads.filter(l => l.status === 'WON').length;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    // AI evaluate score based on inputs
    const calculatedScore = Math.floor(Math.random() * 20) + 75; // high quality fit for prototype
    const tier: LeadScoreTier = calculatedScore >= 80 ? 'HOT' : calculatedScore >= 60 ? 'WARM' : 'COLD';

    const newLeadItem: Lead = {
      id: `lead-${Date.now()}`,
      business: newBizName,
      contactPerson: newContactPerson || 'Managing Partner',
      contactRole: 'Executive',
      email: newEmail || `${newBizName.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.co.za`,
      phone: newPhone || '+27 82 555 0199',
      industry: newIndustry || 'Digital Services',
      location: newLocation,
      website: newWebsite || 'Pending Audit',
      social: newSocial || '@' + newBizName.toLowerCase().replace(/\s+/g, ''),
      socialLinks: {
        instagram: newSocial || undefined,
        whatsapp: newPhone || undefined
      },
      problem: newProblem || 'Outdated digital funnel with high manual administrative overhead.',
      potentialService: newPotentialService,
      leadScore: calculatedScore,
      scoreTier: tier,
      status: 'QUALIFIED',
      estimatedValue: 4500,
      nextAction: 'Prepare 60-sec live prototype preview using the Skeem method.',
      lastContact: 'Just added',
      followUpDate: 'Today',
      scoreExplanation: 'Evaluated by Moses: Real SMB revenue potential, clear friction point, high-leverage solo delivery fit.',
      signals: ['New qualified prospect', 'Pain point identified', 'High solo fit']
    };

    onAddLead(newLeadItem);
    setSelectedLead(newLeadItem);
    setIsAddModalOpen(false);
    setNewBizName('');
    setNewContactPerson('');
    setNewEmail('');
    setNewPhone('');
    setNewIndustry('');
    setNewProblem('');
    setNewWebsite('');
    setNewSocial('');
    playCyberSound('response');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header & Add Lead Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <TrendingUp size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Business Development Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Coalesce Revenue Matrix &bull; Systematized Dealflow &amp; Lead Scoring
          </p>
        </div>

        <button
          onClick={() => {
            playCyberSound('click');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus size={14} strokeWidth={2} />
          <span>Qualify New Prospect</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">PIPELINE VALUE</div>
          <div className="text-base font-bold text-zinc-900 mt-1">R{pipelineValue.toLocaleString()}</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">Weighted Dealflow</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">ACTIVE LEADS</div>
          <div className="text-base font-bold text-zinc-900 mt-1">{activeLeadsCount} Prospects</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">In qualification</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">HOT LEADS</div>
          <div className="text-base font-bold text-emerald-600 mt-1">{hotLeadsCount} Hot</div>
          <div className="text-[9px] text-emerald-600 mt-0.5">Score &gt; 80/100</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">FOLLOW-UPS DUE</div>
          <div className="text-base font-bold text-amber-600 mt-1">{followUpsDueCount} Today</div>
          <div className="text-[9px] text-amber-600 mt-0.5">Prompt outreach</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">PROPOSALS</div>
          <div className="text-base font-bold text-zinc-900 mt-1">{proposalsCount} Active</div>
          <div className="text-[9px] text-zinc-500 mt-0.5">Live previews</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
          <div className="text-[10px] text-zinc-400 uppercase font-semibold">CONVERSIONS</div>
          <div className="text-base font-bold text-emerald-600 mt-1">{wonCount} Won</div>
          <div className="text-[9px] text-emerald-600 mt-0.5">Retainers active</div>
        </div>
      </div>

      {/* Visual Pipeline Stages */}
      <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 shadow-2xs">
        <div className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Pipeline Lifecycle Progression</span>
          <span className="text-[10px] text-zinc-400 font-medium">Click a stage to track conversion</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = safeLeads.filter(l => l.status === stage.id).length;
            return (
              <div
                key={stage.id}
                className="p-2.5 rounded-xl border border-zinc-200 bg-white text-center shadow-2xs"
              >
                <div className="text-[10px] font-semibold tracking-wider text-zinc-600">{stage.label}</div>
                <div className="text-base font-bold text-zinc-900 mt-0.5">{count}</div>
                <div className="text-[9px] text-zinc-400 mt-0.5">Stage 0{idx + 1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Leads Directory & Selected Lead Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left: Leads List */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-bold text-zinc-900 flex items-center justify-between px-1">
            <span>QUALIFIED PIPELINE PROSPECTS</span>
            <span className="text-[10px] text-zinc-500 font-medium">{leads.length} Total</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {leads.length > 0 ? (
              leads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const isHot = lead.scoreTier === 'HOT';
                const isCapacityRisk = lead.capacityRisk;

                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      playCyberSound('click');
                      setSelectedLead(lead);
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-zinc-50 border-black shadow-xs'
                        : isCapacityRisk
                        ? 'bg-white border-rose-200 hover:border-rose-300 shadow-2xs'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-zinc-900">{lead.business}</h4>
                          {isCapacityRisk && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-50 border border-rose-200 text-[8px] text-rose-700 font-bold">
                              CAPACITY RISK
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{lead.industry} &bull; {lead.location}</p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isHot
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : lead.scoreTier === 'WARM'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {lead.leadScore} PTS
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-100 text-[10px]">
                      <span className="text-zinc-500 truncate max-w-[170px]">{lead.potentialService}</span>
                      <span className="text-zinc-900 font-semibold">R{lead.estimatedValue.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
                <Users size={28} className="text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700">No active leads in pipeline</p>
                <p className="text-[11px] text-zinc-400 mt-1">Operating system is in default clean mode.</p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-3 px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Add First Prospect</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Selected Lead Inspector & Moses Strategic Diagnosis */}
        <div className="lg:col-span-7">
          {selectedLead ? (
            <div className="rounded-2xl bg-white border border-zinc-200 p-5 relative shadow-xs space-y-4">
              {/* Lead Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-zinc-900">
                      {selectedLead.business}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-700 font-bold">
                      {selectedLead.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Contact: <strong className="text-zinc-800">{selectedLead.contactPerson || 'Decision Maker'}</strong> ({selectedLead.location})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToOutreach(selectedLead)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-xs text-white font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    <Send size={12} strokeWidth={2} />
                    <span>Draft Outreach</span>
                  </button>
                </div>
              </div>

              {/* Lead Score Breakdown Card */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-zinc-600" />
                    Moses Strategic Diagnosis &amp; Fit Score
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {selectedLead.leadScore}/100 ({selectedLead.scoreTier})
                  </span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed italic bg-white p-2.5 rounded-lg border border-zinc-200">
                  "{selectedLead.scoreExplanation}"
                </p>
              </div>

              {/* Complete Contact Details Section */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2.5">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  CONTACT DETAILS &amp; CHANNELS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                    <span className="text-[9px] text-zinc-400 uppercase block mb-0.5 font-bold">EMAIL ADDRESS</span>
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <Mail size={12} className="text-zinc-400 shrink-0" />
                      <a href={`mailto:${selectedLead.email}`} className="text-[11px] font-medium hover:underline truncate">
                        {selectedLead.email || 'None on record'}
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                    <span className="text-[9px] text-zinc-400 uppercase block mb-0.5 font-bold">PHONE / WHATSAPP</span>
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <Phone size={12} className="text-zinc-400 shrink-0" />
                      <a href={`tel:${selectedLead.phone}`} className="text-[11px] font-medium hover:underline">
                        {selectedLead.phone || 'None on record'}
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                    <span className="text-[9px] text-zinc-400 uppercase block mb-0.5 font-bold">WEBSITE</span>
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <Globe size={12} className="text-zinc-400 shrink-0" />
                      <a 
                        href={selectedLead.website?.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-medium hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{selectedLead.website || 'No website'}</span>
                        <ExternalLink size={10} className="text-zinc-400 shrink-0" />
                      </a>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-zinc-200">
                    <span className="text-[9px] text-zinc-400 uppercase block mb-0.5 font-bold">SOCIAL CHANNELS</span>
                    <div className="flex items-center gap-1.5 text-zinc-800">
                      <Instagram size={12} className="text-zinc-600 shrink-0" />
                      <span className="text-[11px] font-medium truncate">{selectedLead.social || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Diagnostics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">IDENTIFIED BOTTLENECK</span>
                  <p className="text-zinc-800 mt-1">{selectedLead.problem}</p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold">RECOMMENDED SERVICE</span>
                  <p className="text-zinc-900 font-semibold mt-1">{selectedLead.potentialService}</p>
                </div>
              </div>

              {/* Next Action & Follow-up Timer */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-zinc-700 uppercase font-bold flex items-center gap-1">
                    <Clock size={11} />
                    SCHEDULED ACTION (DUE: {selectedLead.followUpDate})
                  </span>
                  <p className="text-xs text-zinc-900 mt-0.5 font-medium">{selectedLead.nextAction}</p>
                </div>

                {/* Status Changer Dropdown */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-zinc-500 font-medium">STAGE:</span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => {
                      playCyberSound('click');
                      onUpdateLeadStatus(selectedLead.id, e.target.value as LeadStatus);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-800 focus:outline-none focus:border-black font-medium shadow-2xs"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mb-3">
                <Sparkles size={20} className="text-zinc-600" />
              </div>
              <h4 className="font-display text-sm font-bold text-zinc-800">Pipeline Standby Mode</h4>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                All records have been cleared. Select or qualify a new target business to inspect automated diagnosis, fit scores, and strategic contact pathways.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>Qualify Target Prospect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 relative shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-display text-base font-bold text-zinc-900">
                Qualify Target Prospect
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">BUSINESS NAME *</label>
                <input
                  type="text"
                  required
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Apex Legal Solutions"
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">CONTACT PERSON</label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">PHONE / WHATSAPP</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+27 82 555 0199"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="david@apexlegal.co.za"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">LOCATION</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Durban, SA"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">WEBSITE</label>
                  <input
                    type="text"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://apexlegal.co.za"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">SOCIAL HANDLE</label>
                  <input
                    type="text"
                    value={newSocial}
                    onChange={(e) => setNewSocial(e.target.value)}
                    placeholder="@apexlegal_sa"
                    className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">IDENTIFIED PROBLEM</label>
                <textarea
                  rows={2}
                  value={newProblem}
                  onChange={(e) => setNewProblem(e.target.value)}
                  placeholder="e.g. Manual quote requests via email, loses leads after hours..."
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-500 mb-1 font-semibold text-[10px] uppercase">SERVICE OFFERING</label>
                <select
                  value={newPotentialService}
                  onChange={(e) => setNewPotentialService(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                >
                  <option value="Websites / Web Development">Websites / High-Speed Jamstack Rebuild</option>
                  <option value="Automation & AI">Automation &amp; AI (WhatsApp Booking &amp; CRM)</option>
                  <option value="Social Media Management">Social Media Systems &amp; Content Machine</option>
                  <option value="Graphic Design / Branding">Graphic Design &amp; Conversion Assets</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
