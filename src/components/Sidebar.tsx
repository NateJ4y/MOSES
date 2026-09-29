import React from 'react';
import { 
  Home, 
  Terminal, 
  TrendingUp, 
  Users, 
  Send, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  GitBranch, 
  Layers, 
  BookOpen, 
  Database,
  Fingerprint, 
  Settings,
  Cpu,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { NavSection } from '../types';
import { playCyberSound } from '../utils/audio';

interface SidebarProps {
  currentSection?: NavSection;
  activeSection?: NavSection;
  onSelectSection?: (section: NavSection) => void;
  onNavigate?: (section: NavSection) => void;
  closeMobileMenu?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  leadsCount?: number;
  warningsCount?: number;
  emailsCount?: number;
  projectsCount?: number;
}

interface NavItem {
  id: NavSection;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'HOME', label: 'HOME', shortLabel: 'HOME', icon: Home },
  { id: 'COMMAND', label: 'COMMAND', shortLabel: 'CMD', icon: Terminal, badge: 'CORE' },
  { id: 'BUSINESS_DEVELOPMENT', label: 'BUSINESS DEVELOPMENT', shortLabel: 'BIZ DEV', icon: TrendingUp },
  { id: 'LEADS', label: 'LEADS', shortLabel: 'LEADS', icon: Users },
  { id: 'OUTREACH', label: 'OUTREACH', shortLabel: 'OUTREACH', icon: Send },
  { id: 'EMAIL', label: 'EMAIL', shortLabel: 'EMAIL', icon: Mail },
  { id: 'WHATSAPP', label: 'WHATSAPP', shortLabel: 'WHATSAPP', icon: MessageSquare },
  { id: 'RESEARCH', label: 'RESEARCH', shortLabel: 'RESEARCH', icon: Sparkles },
  { id: 'SYSTEMS', label: 'SYSTEMS', shortLabel: 'SYSTEMS', icon: GitBranch },
  { id: 'DIGITAL_OPERATIONS', label: 'DIGITAL OPERATIONS', shortLabel: 'OPS', icon: Layers },
  { id: 'KNOWLEDGE', label: 'KNOWLEDGE', shortLabel: 'DOCS', icon: BookOpen },
  { id: 'MEMORY', label: 'MEMORY', shortLabel: 'MEMORY', icon: Database },
  { id: 'CLIENT_DNA', label: 'CLIENT DNA', shortLabel: 'DNA', icon: Fingerprint },
  { id: 'SETTINGS', label: 'SETTINGS', shortLabel: 'CONFIG', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  activeSection,
  onSelectSection,
  onNavigate,
  closeMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
  leadsCount,
  warningsCount,
  emailsCount,
  projectsCount
}) => {
  const current = activeSection || currentSection || 'COMMAND';

  const handleNavClick = (id: NavSection) => {
    playCyberSound('click');
    if (onNavigate) {
      onNavigate(id);
    } else if (onSelectSection) {
      onSelectSection(id);
    }
    if (closeMobileMenu) closeMobileMenu();
  };

  return (
    <aside 
      className={`h-full bg-white border-r border-zinc-200/90 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300 ease-in-out font-sans ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Header */}
      <div className={`border-b border-zinc-100 relative ${isCollapsed ? 'p-3.5 flex justify-center items-center' : 'p-5'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-extrabold font-display text-sm tracking-wider shadow-sm">
                M
              </div>
              <div>
                <div className="flex items-center gap-2 leading-none">
                  <h1 className="font-display font-bold text-base tracking-tight text-zinc-900">
                    MOSES
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[9px] text-zinc-700 font-semibold tracking-wider">
                    STUDIO
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium tracking-wide mt-1 uppercase">
                  COALESCE DIGITAL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[9px] text-emerald-700 font-semibold tracking-wide">LIVE</span>
              </div>
              {closeMobileMenu && (
                <button
                  onClick={closeMobileMenu}
                  className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 rounded-full bg-zinc-100"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onToggleCollapse && onToggleCollapse()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white font-extrabold font-display text-sm tracking-wider cursor-pointer hover:bg-zinc-800 transition-colors shadow-sm"
            title="Expand Navigation"
          >
            M
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] uppercase font-semibold tracking-widest text-zinc-400 flex items-center justify-between">
            <span>WORKSPACE</span>
            <span className="text-zinc-400 font-mono-tech text-[9px]">v2.4</span>
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.id;
          
          let badgeValue = item.badge;
          if (item.id === 'BUSINESS_DEVELOPMENT' || item.id === 'LEADS') {
            if (leadsCount !== undefined && leadsCount > 0) badgeValue = String(leadsCount);
            else badgeValue = undefined;
          } else if (item.id === 'EMAIL') {
            if (emailsCount !== undefined && emailsCount > 0) badgeValue = String(emailsCount);
            else badgeValue = undefined;
          } else if (item.id === 'DIGITAL_OPERATIONS') {
            if (projectsCount !== undefined && projectsCount > 0) badgeValue = String(projectsCount);
            else badgeValue = undefined;
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full group relative flex items-center rounded-xl text-xs transition-all text-left cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-3 my-0.5'
                  : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-black text-white font-bold shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 border border-transparent'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                <Icon
                  size={isCollapsed ? 18 : 16}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-colors shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'text-zinc-400 group-hover:text-zinc-900'
                  }`}
                />
                {!isCollapsed && (
                  <span className="tracking-tight text-xs font-semibold truncate">
                    {item.label}
                  </span>
                )}
              </div>

              {!isCollapsed && badgeValue && (
                <span
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-full shrink-0 ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900 group-hover:bg-zinc-200'
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Telemetry & Collapse Control */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/60">
        {!isCollapsed ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <Cpu size={13} strokeWidth={1.75} className="text-zinc-900" />
                SYSTEM HEALTH
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-zinc-500">
                <span>AI CORE</span>
                <span className="text-emerald-600 font-semibold">ONLINE</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>INTEL</span>
                <span className="text-emerald-600 font-semibold">SYNCED</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>WEB PIPELINE</span>
                <span className="text-emerald-600 font-semibold">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>WHATSAPP</span>
                <span className="text-emerald-600 font-semibold">READY</span>
              </div>
            </div>

            {/* Micro Capacity Bar */}
            <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                <span>BANDWIDTH (SOLO)</span>
                <span className="text-zinc-900 font-bold">3/4 ACTIVE</span>
              </div>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-zinc-900 h-full w-[75%] rounded-full" />
              </div>
            </div>

            {/* Collapse Button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-[10px] text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer font-semibold"
                title="Collapse Sidebar"
              >
                <PanelLeftClose size={13} strokeWidth={1.5} />
                <span>COLLAPSE NAVIGATION</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2.5 rounded-full bg-zinc-100 hover:bg-black hover:text-white text-zinc-600 transition-colors cursor-pointer"
                title="Expand Sidebar"
              >
                <PanelLeftOpen size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
