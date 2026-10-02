import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Command as CommandIcon, 
  Menu, 
  PanelLeftClose,
  PanelLeftOpen,
  X, 
  Cpu, 
  Radio, 
  Zap,
  Mic,
  LayoutGrid
} from 'lucide-react';
import { playCyberSound, setAudioEnabled } from '../utils/audio';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  mobileMenuOpen?: boolean;
  onTriggerVoice?: () => void;
  onToggleVoice?: () => void;
  isListening: boolean;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
  onNavigateHome?: () => void;
  isOnline?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onToggleMobileMenu,
  onToggleSidebar,
  isSidebarCollapsed = false,
  mobileMenuOpen = false,
  onTriggerVoice,
  onToggleVoice,
  isListening,
  isRightPanelOpen,
  onToggleRightPanel,
  onNavigateHome,
  isOnline = false
}) => {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setAudioEnabled(next);
    if (next) playCyberSound('click');
  };

  const handleHamburgerClick = () => {
    playCyberSound('click');
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (onToggleMobileMenu) {
      onToggleMobileMenu();
    }
  };

  const handleVoiceClick = () => {
    playCyberSound('click');
    if (onToggleVoice) {
      onToggleVoice();
    } else if (onTriggerVoice) {
      onTriggerVoice();
    }
  };

  return (
    <header className="h-16 border-b border-zinc-200/90 bg-white/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 font-sans select-none">
      {/* Left branding & hamburger toggle */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger Icon - Responsive on both Desktop and Mobile */}
        <button
          onClick={handleHamburgerClick}
          className="p-2 rounded-full bg-zinc-100 hover:bg-black hover:text-white border border-zinc-200/80 text-zinc-800 transition-all shadow-sm flex items-center justify-center cursor-pointer group"
          aria-label="Toggle Sidebar Menu"
          title={isSidebarCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
        >
          {mobileMenuOpen ? (
            <X size={16} strokeWidth={1.75} className="text-zinc-800 group-hover:text-white transition-colors" />
          ) : isSidebarCollapsed ? (
            <PanelLeftOpen size={16} strokeWidth={1.75} className="text-zinc-800 group-hover:text-white transition-colors" />
          ) : (
            <Menu size={16} strokeWidth={1.75} className="text-zinc-800 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Moses / Coalesce Brand */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Moses Command Home"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black text-white font-extrabold font-display text-sm tracking-wider shadow-sm">
            M
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-display font-bold text-sm tracking-tight text-zinc-900 group-hover:text-zinc-600 transition-colors">
                MOSES
              </span>
              <span className="text-[10px] text-zinc-400 font-normal">/</span>
              <span className="text-[11px] text-zinc-600 font-medium tracking-wide">COALESCE OS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Online state — appears only after the full boot sequence and 2s settle delay */}
      <div className="hidden lg:flex items-center justify-center min-w-0">
        <button
          type="button"
          className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-semibold tracking-[0.14em] transition-all duration-700 ${
            isOnline
              ? 'opacity-100 translate-y-0 bg-zinc-50 border-zinc-200 text-zinc-800 shadow-sm'
              : 'opacity-0 translate-y-1 pointer-events-none bg-transparent border-transparent text-transparent'
          }`}
          aria-label={isOnline ? 'MOSES online' : 'MOSES loading'}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ONLINE
        </button>
      </div>

      {/* Right Controls & Time */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Voice Trigger */}
        <button
          onClick={handleVoiceClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all cursor-pointer font-medium tracking-wide ${
            isListening
              ? 'bg-black text-white border-black shadow-md font-bold animate-pulse'
              : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black hover:bg-zinc-200'
          }`}
          title="Voice Command"
        >
          <Mic size={13} strokeWidth={1.75} className={isListening ? 'text-white' : 'text-zinc-700'} />
          <span className="hidden sm:inline text-[11px]">{isListening ? 'LISTENING...' : 'VOICE'}</span>
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={() => {
            playCyberSound('click');
            onOpenCommandPalette();
          }}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-black hover:bg-zinc-200 transition-all text-xs cursor-pointer font-medium"
        >
          <CommandIcon size={12} strokeWidth={1.5} className="text-zinc-500" />
          <span className="text-[11px]">SEARCH</span>
          <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded-full text-[9px] text-zinc-700 font-semibold shadow-2xs">⌘K</kbd>
        </button>

        {/* Intelligence HUD Toggle if present */}
        {onToggleRightPanel && (
          <button
            onClick={() => {
              playCyberSound('click');
              onToggleRightPanel();
            }}
            className={`p-2 rounded-full border text-xs transition-all cursor-pointer ${
              isRightPanelOpen
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
            title="Toggle Intel Panel"
          >
            <LayoutGrid size={14} strokeWidth={1.75} />
          </button>
        )}

        {/* Audio Synthesizer Mute Toggle */}
        <button
          onClick={handleToggleSound}
          className="p-2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-200 transition-colors cursor-pointer"
          title={soundOn ? 'Sound Enabled' : 'Sound Muted'}
          aria-label="Toggle Sound Effects"
        >
          {soundOn ? <Volume2 size={14} strokeWidth={1.75} className="text-zinc-900" /> : <VolumeX size={14} strokeWidth={1.75} />}
        </button>

        {/* Digital Clock */}
        <div className="flex flex-col items-end pl-3 border-l border-zinc-200">
          <span className="text-xs font-semibold text-zinc-900 tracking-tight font-mono-tech">{time || '00:00:00'}</span>
          <span className="text-[9px] text-zinc-400 font-medium tracking-wider">{dateStr || 'SYSTEM'}</span>
        </div>
      </div>
    </header>
  );
};
