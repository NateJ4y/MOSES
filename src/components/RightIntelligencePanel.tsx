import React from 'react';
import { 
  Radio, 
  AlertTriangle, 
  Target, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Briefcase, 
  Flame, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  X
} from 'lucide-react';
import { Lead, StrategicWarning, DigitalOpsProject, NavSection } from '../types';
import { DIGITAL_OPS_PROJECTS } from '../data/initialData';
import { playCyberSound } from '../utils/audio';

interface RightIntelligencePanelProps {
  leads?: Lead[];
  warnings?: StrategicWarning[];
  projects?: DigitalOpsProject[];
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: (section: NavSection) => void;
  onSelectLead?: (lead: Lead) => void;
  onExecuteMoses?: (prompt: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const RightIntelligencePanel: React.FC<RightIntelligencePanelProps> = ({
  leads = [],
  warnings = [],
  projects = DIGITAL_OPS_PROJECTS,
  isOpen = true,
  onClose,
  onNavigate,
  onSelectLead,
  onExecuteMoses,
  collapsed = false,
  onToggleCollapse
}) => {
  if (isOpen === false) {
    return null;
  }

  const safeLeads = leads || [];
  const safeWarnings = warnings || [];
  const safeProjects = projects || [];

  const hotLeads = safeLeads.filter(l => l.scoreTier === 'HOT' || (l.followUpDate && l.followUpDate.includes('Today')));
  const activeProjects = safeProjects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'REVIEW');
  const topPriorityLead = hotLeads[0] || safeLeads[0] || null;

  const handleNav = (section: NavSection) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-zinc-200 flex flex-col justify-between overflow-y-auto select-none font-sans scrollbar-thin shadow-sm">
      {/* Top Header */}
      <div className="p-3.5 border-b border-zinc-200 bg-zinc-50/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-zinc-900 animate-pulse" />
            <h2 className="font-display font-bold text-sm tracking-wide text-zinc-900">
              LIVE INTELLIGENCE
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-800 font-semibold">
              AUTO-SYNC
            </span>
            {onClose && (
              <button
                onClick={() => {
                  playCyberSound('click');
                  onClose();
                }}
                className="p-1 rounded-full hover:bg-zinc-200 text-zinc-500 hover:text-black transition-colors"
                title="Close panel"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3.5">
        {/* CURRENT PRIORITY */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 relative shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-zinc-700 font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Target size={12} className="text-zinc-900" />
              CURRENT PRIORITY
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          {topPriorityLead ? (
            <>
              <p className="text-xs text-zinc-900 font-medium leading-relaxed">
                Follow up with {topPriorityLead.business} ({topPriorityLead.potentialService || 'Digital Systems'}).
              </p>
              <div className="mt-2.5 pt-2 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Tactical Impact:</span>
                <span className="text-[10px] font-bold text-emerald-600">R{topPriorityLead.estimatedValue.toLocaleString()} Pipeline</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                No verified priority is currently derived from the connected records.
              </p>
              <div className="mt-2.5 pt-2 border-t border-zinc-200 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">System State:</span>
                <span className="text-[10px] font-bold text-zinc-700">Standing By (Clean)</span>
              </div>
            </>
          )}
        </div>

        {/* NEXT BEST ACTION */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 relative shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold mb-1.5">
            <span className="flex items-center gap-1.5">
              <Zap size={12} className="text-emerald-600" />
              NEXT BEST ACTION
            </span>
            <span className="text-[9px] text-zinc-500">SKEEM METHOD</span>
          </div>
          {topPriorityLead ? (
            <>
              <p className="text-xs text-zinc-800 leading-relaxed">
                {topPriorityLead.nextAction || `Prepare a 60-second Skeem concept preview for ${topPriorityLead.business}.`}
              </p>
              <button
                onClick={() => {
                  playCyberSound('click');
                  handleNav('OUTREACH');
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <span>OPEN OUTREACH GENERATOR</span>
                <ArrowRight size={11} />
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Add a real prospect or connect a research source. MOSES will not invent targets.
              </p>
              <button
                onClick={() => {
                  playCyberSound('click');
                  handleNav('BUSINESS_DEVELOPMENT');
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 text-white text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                <span>QUALIFY NEW PROSPECT</span>
                <ArrowRight size={11} />
              </button>
            </>
          )}
        </div>

        {/* MOSES // WATCHLIST (Strategic Warnings) */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 relative">
          <div className="flex items-center justify-between text-[10px] text-amber-800 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-amber-700" />
              MOSES // WATCHLIST
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300/60 font-semibold">
              {safeWarnings.length} FLAGGED
            </span>
          </div>

          <div className="space-y-1.5">
            {safeWarnings.length > 0 ? (
              safeWarnings.slice(0, 3).map((w) => (
                <div key={w.id} className="p-2 rounded-lg bg-white border border-amber-200/80 text-[11px] shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-zinc-900 text-[10px]">
                    <span>{w.title}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
                      w.severity === 'HIGH' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {w.severity}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-[10px] mt-1 leading-snug">{w.description}</p>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-center text-[10px] text-zinc-500">
                <span className="font-semibold text-zinc-800 block">No Critical Warnings</span>
                <span>System capacity &amp; pipeline are clear.</span>
              </div>
            )}
          </div>
        </div>

        {/* LEADS REQUIRING ATTENTION */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-zinc-700 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Flame size={12} className="text-rose-500" />
              HOT LEADS REQUIRING ACTION
            </span>
            <button
              onClick={() => {
                playCyberSound('click');
                handleNav('BUSINESS_DEVELOPMENT');
              }}
              className="text-[9px] text-zinc-900 hover:text-zinc-600 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              ALL <ChevronRight size={10} />
            </button>
          </div>

          <div className="space-y-1.5">
            {hotLeads.length > 0 ? (
              hotLeads.slice(0, 3).map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => {
                    playCyberSound('click');
                    if (onSelectLead) onSelectLead(lead);
                    handleNav('BUSINESS_DEVELOPMENT');
                  }}
                  className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 cursor-pointer transition-all flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-900 truncate max-w-[170px]">
                      {lead.business}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <Clock size={9} />
                      <span>Follow-up: {lead.followUpDate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                      {lead.leadScore}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-center text-[10px] text-zinc-400">
                Zero hot leads requiring attention.
              </div>
            )}
          </div>
        </div>

        {/* ACTIVE PROJECTS */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-zinc-700 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Briefcase size={12} className="text-zinc-800" />
              ACTIVE CLIENT PROJECTS
            </span>
            <button
              onClick={() => {
                playCyberSound('click');
                handleNav('DIGITAL_OPERATIONS');
              }}
              className="text-[9px] text-zinc-900 hover:text-zinc-600 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              OPS <ChevronRight size={10} />
            </button>
          </div>

          <div className="space-y-2">
            {activeProjects.length > 0 ? (
              activeProjects.map((p) => (
                <div key={p.id} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-zinc-900">
                    <span className="truncate max-w-[150px]">{p.client}</span>
                    <span className="text-[9px] text-zinc-600 font-mono-tech">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-1">
                    <span>Deadline: {p.deadline}</span>
                    {p.monthlyRetainer && (
                      <span className="text-emerald-600 font-semibold">R{p.monthlyRetainer.toLocaleString()}/mo</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-center text-[10px] text-zinc-400">
                No active builds in delivery pipeline.
              </div>
            )}
          </div>
        </div>

        {/* SYSTEM STATUS MATRIX */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-[10px]">
          <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            INTEGRATION MATRIX
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                AI CORE
              </span>
              <span className="text-emerald-600 font-bold">ONLINE</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                MEMORY REPOSITORY
              </span>
              <span className="text-emerald-600 font-bold">READY</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                AUTOMATION PIPELINE
              </span>
              <span className="text-amber-700 font-medium">STANDBY (n8n READY)</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                EMAIL ENGINE
              </span>
              <span className="text-zinc-500">LOCAL REVIEW GATED</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                WHATSAPP BOT
              </span>
              <span className="text-zinc-500">SIMULATION MODE</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
