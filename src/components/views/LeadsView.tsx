import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Globe, 
  Instagram, 
  Linkedin,
  Twitter,
  Facebook,
  Mail, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink,
  Send, 
  Sparkles, 
  ShieldAlert,
  ArrowRight,
  User,
  Plus,
  X,
  FileText,
  Building2,
  MapPin,
  Flame,
  Clock,
  MessageCircle
} from 'lucide-react';
import { Lead, LeadScoreTier, LeadStatus } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface LeadsViewProps {
  leads: Lead[];
  onNavigateToOutreach: (lead: Lead) => void;
  onNavigateToBD: () => void;
  onAddLead?: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onNavigateToOutreach,
  onNavigateToBD,
  onAddLead
}) => {
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedDossierLead, setSelectedDossierLead] = useState<Lead | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New Lead Form State
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    business: '',
    contactPerson: '',
    contactRole: '',
    email: '',
    phone: '',
    website: '',
    social: '',
    industry: '',
    location: 'Cape Town, South Africa',
    problem: '',
    potentialService: 'Websites + AI Automation',
    estimatedValue: 5000,
    status: 'NEW',
    scoreTier: 'HOT',
    leadScore: 85,
    signals: ['Fast growing', 'Digital bottlenecks'],
    scoreExplanation: 'Evaluated prospect with clear automation and web optimization potential.'
  });

  const safeLeads = leads || [];
  const filteredLeads = safeLeads.filter((lead) => {
    const matchesTier = 
      filterTier === 'ALL' || 
      lead.scoreTier === filterTier || 
      (filterTier === 'CAPACITY_RISK' && lead.capacityRisk);
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      (lead.business || '').toLowerCase().includes(q) ||
      (lead.contactPerson || '').toLowerCase().includes(q) ||
      (lead.email || '').toLowerCase().includes(q) ||
      (lead.phone || '').toLowerCase().includes(q) ||
      (lead.website || '').toLowerCase().includes(q) ||
      (lead.industry || '').toLowerCase().includes(q) ||
      (lead.problem || '').toLowerCase().includes(q) ||
      (lead.potentialService || '').toLowerCase().includes(q);
    return matchesTier && matchesQuery;
  });

  const copyToClipboard = (text: string, fieldId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    playCyberSound('click');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.business?.trim()) return;

    const created: Lead = {
      id: `lead-${Date.now()}`,
      business: newLead.business || 'Untitled Lead',
      contactPerson: newLead.contactPerson || 'Decision Maker',
      contactRole: newLead.contactRole || 'Owner / Director',
      email: newLead.email || '',
      phone: newLead.phone || '',
      website: newLead.website?.startsWith('http') ? newLead.website : newLead.website ? `https://${newLead.website}` : '',
      social: newLead.social || '',
      socialLinks: {
        instagram: newLead.social?.includes('instagram') || newLead.social?.includes('@') ? newLead.social : undefined,
        whatsapp: newLead.phone || undefined
      },
      industry: newLead.industry || 'General Business',
      location: newLead.location || 'Cape Town, South Africa',
      problem: newLead.problem || 'Needs web development and process automation.',
      potentialService: newLead.potentialService || 'Websites + AI Automation',
      leadScore: newLead.leadScore || 85,
      scoreTier: newLead.scoreTier || 'HOT',
      status: (newLead.status as LeadStatus) || 'NEW',
      estimatedValue: Number(newLead.estimatedValue) || 5000,
      nextAction: 'Qualify and draft personalized outreach.',
      lastContact: 'Just added',
      followUpDate: 'Today',
      scoreExplanation: newLead.scoreExplanation || 'Direct alignment with Coalesce digital services.',
      signals: newLead.signals || ['High intent', 'Automation fit']
    };

    if (onAddLead) {
      onAddLead(created);
    }
    setIsAddModalOpen(false);
    playCyberSound('boot');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Users size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Prospect Intelligence Directory
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Direct executive contacts, verified email addresses, phone &amp; WhatsApp, live websites, and social channels.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              playCyberSound('click');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>New Prospect</span>
          </button>

          <button
            onClick={() => {
              playCyberSound('click');
              onNavigateToBD();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 transition-all cursor-pointer font-semibold shadow-2xs"
          >
            <span>Pipeline View</span>
            <ArrowRight size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
        <div className="relative flex-1">
          <Search size={15} strokeWidth={1.75} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, phone number, website, or service..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors font-medium shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 md:pb-0">
          <span className="text-[10px] text-zinc-400 uppercase shrink-0 font-bold tracking-wider">FILTER:</span>
          {['ALL', 'HOT', 'WARM', 'COLD', 'POOR_FIT', 'CAPACITY_RISK'].map((t) => (
            <button
              key={t}
              onClick={() => {
                playCyberSound('click');
                setFilterTier(t);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                filterTier === t
                  ? 'bg-black text-white font-semibold shadow-2xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Cards Grid */}
      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.map((lead) => {
          const isHot = lead.scoreTier === 'HOT';
          const isCapacityRisk = lead.capacityRisk;

          return (
            <div
              key={lead.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between relative transition-all bg-white shadow-xs hover:shadow-md ${
                isCapacityRisk
                  ? 'border-rose-200 hover:border-rose-300'
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <div className="space-y-3.5">
                {/* Header & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold text-zinc-900 tracking-tight truncate">
                      {lead.business}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5">
                      <MapPin size={11} strokeWidth={1.5} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{lead.location}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 tracking-wide ${
                    isHot
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : lead.scoreTier === 'WARM'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {lead.leadScore}/100 {lead.scoreTier}
                  </span>
                </div>

                {isCapacityRisk && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-2">
                    <ShieldAlert size={14} strokeWidth={1.75} className="shrink-0 text-rose-500" />
                    <span>Capacity notice: Requires high development bandwidth.</span>
                  </div>
                )}

                {/* Contact Dossier Section (Luxury Minimal White Card) */}
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {lead.contactPerson ? lead.contactPerson[0] : 'C'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-900 block truncate">
                          {lead.contactPerson || 'Primary Contact'}
                        </span>
                        {lead.contactRole && (
                          <span className="text-[10px] text-zinc-500 block truncate font-medium">
                            {lead.contactRole}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDossierLead(lead)}
                      className="text-[10px] text-zinc-500 hover:text-black font-semibold underline shrink-0 cursor-pointer"
                    >
                      Dossier
                    </button>
                  </div>

                  {/* Contact Row: Email */}
                  {lead.email ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail size={12} strokeWidth={1.5} className="text-zinc-400 shrink-0" />
                        <a 
                          href={`mailto:${lead.email}`}
                          className="text-[11px] text-zinc-800 hover:text-black hover:underline truncate font-medium"
                          title="Send Email"
                        >
                          {lead.email}
                        </a>
                      </div>
                      <button
                        onClick={(e) => copyToClipboard(lead.email!, `email-${lead.id}`, e)}
                        className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors shrink-0 cursor-pointer"
                        title="Copy Email"
                      >
                        {copiedField === `email-${lead.id}` ? (
                          <Check size={11} className="text-emerald-600" />
                        ) : (
                          <Copy size={11} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Mail size={12} strokeWidth={1.5} />
                      <span>No email on record</span>
                    </div>
                  )}

                  {/* Contact Row: Phone / WhatsApp */}
                  {lead.phone ? (
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone size={12} strokeWidth={1.5} className="text-zinc-400 shrink-0" />
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-[11px] text-zinc-800 hover:text-black hover:underline truncate font-medium"
                          title="Call Phone Number"
                        >
                          {lead.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-[9px] font-bold text-emerald-800 hover:bg-emerald-200"
                          title="Open WhatsApp Direct"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={(e) => copyToClipboard(lead.phone!, `phone-${lead.id}`, e)}
                          className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedField === `phone-${lead.id}` ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Phone size={12} strokeWidth={1.5} />
                      <span>No phone on record</span>
                    </div>
                  )}

                  {/* Contact Row: Website */}
                  {lead.website && (
                    <div className="flex items-center justify-between gap-2 text-xs text-zinc-700">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe size={12} strokeWidth={1.5} className="text-zinc-400 shrink-0" />
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] text-zinc-800 hover:text-black hover:underline truncate flex items-center gap-1 font-medium"
                        >
                          <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink size={10} strokeWidth={1.5} className="shrink-0 text-zinc-400" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Contact Row: Social Media Links */}
                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">CHANNELS:</span>
                    <div className="flex items-center gap-1.5">
                      {lead.socialLinks?.instagram || lead.social.toLowerCase().includes('ig') || lead.social.includes('@') ? (
                        <a
                          href={lead.socialLinks?.instagram || `https://instagram.com/${lead.social.replace(/[^a-zA-Z0-9_.]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-full bg-white hover:bg-black hover:text-white text-zinc-600 border border-zinc-200 transition-colors shadow-2xs"
                          title={`Instagram: ${lead.social}`}
                        >
                          <Instagram size={11} strokeWidth={1.5} />
                        </a>
                      ) : null}

                      {lead.socialLinks?.linkedin || lead.social.toLowerCase().includes('linkedin') ? (
                        <a
                          href={lead.socialLinks?.linkedin || 'https://linkedin.com'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-full bg-white hover:bg-black hover:text-white text-zinc-600 border border-zinc-200 transition-colors shadow-2xs"
                          title="LinkedIn Profile"
                        >
                          <Linkedin size={11} strokeWidth={1.5} />
                        </a>
                      ) : null}

                      {lead.socialLinks?.twitter ? (
                        <a
                          href={lead.socialLinks.twitter}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-full bg-white hover:bg-black hover:text-white text-zinc-600 border border-zinc-200 transition-colors shadow-2xs"
                          title="Twitter / X Profile"
                        >
                          <Twitter size={11} strokeWidth={1.5} />
                        </a>
                      ) : null}

                      {lead.socialLinks?.facebook ? (
                        <a
                          href={lead.socialLinks.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-full bg-white hover:bg-black hover:text-white text-zinc-600 border border-zinc-200 transition-colors shadow-2xs"
                          title="Facebook Page"
                        >
                          <Facebook size={11} strokeWidth={1.5} />
                        </a>
                      ) : null}

                      <span className="text-[10px] text-zinc-500 truncate max-w-[120px] font-medium">
                        {lead.social}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem & Solution */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-400 uppercase block mb-0.5 font-bold tracking-wider">
                      PRIMARY BOTTLENECK
                    </span>
                    <p className="text-zinc-700 text-[11px] leading-relaxed">{lead.problem}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
                    <span className="text-[9px] text-zinc-900 uppercase block mb-0.5 font-bold tracking-wider">
                      COALESCE SOLUTION
                    </span>
                    <p className="text-zinc-900 text-[11px] font-semibold leading-relaxed">{lead.potentialService}</p>
                  </div>
                </div>

                {/* Signals */}
                <div className="flex flex-wrap gap-1.5">
                  {lead.signals.map((sig, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-[9px] text-zinc-600 border border-zinc-200 font-medium">
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3.5 border-t border-zinc-200 mt-4 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-semibold block">EST. VALUE</span>
                  <span className="text-sm font-bold text-zinc-900 font-display">R{lead.estimatedValue.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => {
                    playCyberSound('click');
                    onNavigateToOutreach(lead);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Send size={11} strokeWidth={2} />
                  <span>Draft Outreach</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center my-6">
          <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mb-3">
            <Users size={22} className="text-zinc-500" />
          </div>
          <h3 className="font-display text-base font-bold text-zinc-900">
            {searchQuery || filterTier !== 'ALL' ? 'No Matching Prospects Found' : 'Prospect Directory Is Clear'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mt-1 leading-relaxed">
            {searchQuery || filterTier !== 'ALL'
              ? 'Try adjusting your search query or filter criteria.'
              : 'The OS is operating in default clean mode. Qualify a new target lead or prompt Moses to conduct automated outreach radar scanning.'}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={13} />
              <span>Qualify New Prospect</span>
            </button>
            {(searchQuery || filterTier !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterTier('ALL');
                }}
                className="px-4 py-2 rounded-full bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-semibold transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Dossier Modal */}
      {selectedDossierLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-zinc-200 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-xl font-bold text-zinc-900">
                    {selectedDossierLead.business}
                  </h3>
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                    {selectedDossierLead.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  {selectedDossierLead.industry} • {selectedDossierLead.location}
                </p>
              </div>

              <button
                onClick={() => setSelectedDossierLead(null)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            {/* Complete Contact Card in Modal */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3.5">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User size={14} strokeWidth={1.75} />
                <span>Executive Contact &amp; Communication Channels</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold">CONTACT PERSON &amp; ROLE</span>
                  <p className="text-zinc-900 font-bold text-sm">{selectedDossierLead.contactPerson || 'Not specified'}</p>
                  <p className="text-zinc-500 text-xs font-medium mt-0.5">{selectedDossierLead.contactRole || 'Decision Maker'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold">DIRECT EMAIL</span>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-800 font-mono text-xs truncate max-w-[150px]">{selectedDossierLead.email || 'N/A'}</p>
                    {selectedDossierLead.email && (
                      <button
                        onClick={() => copyToClipboard(selectedDossierLead.email!, 'modal-email')}
                        className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-black hover:text-white text-[10px] text-zinc-700 font-semibold cursor-pointer transition-colors"
                      >
                        {copiedField === 'modal-email' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold">PHONE / WHATSAPP</span>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-800 font-mono text-xs">{selectedDossierLead.phone || 'N/A'}</p>
                    {selectedDossierLead.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${selectedDossierLead.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[10px] font-bold text-emerald-800"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => copyToClipboard(selectedDossierLead.phone!, 'modal-phone')}
                          className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-black hover:text-white text-[10px] text-zinc-700 font-semibold cursor-pointer transition-colors"
                        >
                          {copiedField === 'modal-phone' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-zinc-200">
                  <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold">WEBSITE &amp; SOCIAL</span>
                  <div className="flex items-center gap-2">
                    {selectedDossierLead.website && (
                      <a
                        href={selectedDossierLead.website.startsWith('http') ? selectedDossierLead.website : `https://${selectedDossierLead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-zinc-800 hover:text-black underline flex items-center gap-1 font-medium"
                      >
                        <Globe size={12} />
                        <span>Website</span>
                      </a>
                    )}
                    <span className="text-zinc-300">|</span>
                    <span className="text-zinc-600 text-xs font-medium">{selectedDossierLead.social}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Analysis */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold tracking-wider">STRATEGIC EVALUATION</span>
                <p className="text-zinc-700 leading-relaxed font-normal">{selectedDossierLead.scoreExplanation}</p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] text-zinc-400 uppercase block mb-1 font-bold tracking-wider">NEXT RECOMMENDED MOVE</span>
                <p className="text-zinc-900 font-semibold">{selectedDossierLead.nextAction}</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
              <button
                onClick={() => setSelectedDossierLead(null)}
                className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-700 font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const leadToOutreach = selectedDossierLead;
                  setSelectedDossierLead(null);
                  onNavigateToOutreach(leadToOutreach);
                }}
                className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Send size={13} strokeWidth={2} />
                <span>Launch Outreach Workflow</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 relative shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-full bg-black text-white">
                  <Plus size={16} strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-bold text-zinc-900">
                  Add New Prospect Lead
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLead.business || ''}
                    onChange={(e) => setNewLead({ ...newLead, business: e.target.value })}
                    placeholder="e.g. Atlantic Roastery"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={newLead.industry || ''}
                    onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                    placeholder="e.g. Specialty Coffee / E-Commerce"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Contact Information Fields */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <span className="text-[10px] text-zinc-900 uppercase font-bold block tracking-wider">
                  Contact Details &amp; Communication Channels
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={newLead.contactPerson || ''}
                      onChange={(e) => setNewLead({ ...newLead, contactPerson: e.target.value })}
                      placeholder="e.g. David Miller"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Contact Role / Title
                    </label>
                    <input
                      type="text"
                      value={newLead.contactRole || ''}
                      onChange={(e) => setNewLead({ ...newLead, contactRole: e.target.value })}
                      placeholder="e.g. Managing Director"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newLead.email || ''}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      placeholder="david@example.co.za"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={newLead.phone || ''}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      placeholder="+27 82 123 4567"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={newLead.website || ''}
                      onChange={(e) => setNewLead({ ...newLead, website: e.target.value })}
                      placeholder="https://example.co.za"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase block mb-1 font-semibold">
                      Social Media Handle
                    </label>
                    <input
                      type="text"
                      value={newLead.social || ''}
                      onChange={(e) => setNewLead({ ...newLead, social: e.target.value })}
                      placeholder="@company_sa (Instagram / LinkedIn)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Problem and Service */}
              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                  Observed Problem / Digital Bottleneck
                </label>
                <textarea
                  rows={2}
                  value={newLead.problem || ''}
                  onChange={(e) => setNewLead({ ...newLead, problem: e.target.value })}
                  placeholder="e.g. Website has high cart drop-off and manual EFT payment confirmation."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                    Potential Coalesce Service
                  </label>
                  <input
                    type="text"
                    value={newLead.potentialService || ''}
                    onChange={(e) => setNewLead({ ...newLead, potentialService: e.target.value })}
                    placeholder="e.g. Custom Shopify + WhatsApp Checkout Bot"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1.5">
                    Estimated Deal Value (ZAR)
                  </label>
                  <input
                    type="number"
                    value={newLead.estimatedValue || 5000}
                    onChange={(e) => setNewLead({ ...newLead, estimatedValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Save Lead to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
