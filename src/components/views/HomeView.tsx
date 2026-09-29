import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Terminal, 
  TrendingUp, 
  Users, 
  Clock, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AiCoreOrb } from '../AiCoreOrb';
import { Lead, StrategicWarning, DigitalOpsProject } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface HomeViewProps {
  onExecutePrompt: (prompt: string) => void;
  onNavigateTo: (section: any) => void;
  isListening: boolean;
  onToggleVoice: () => void;
  transcript: string;
  leads: Lead[];
  warnings: StrategicWarning[];
  projects?: DigitalOpsProject[];
  aiState: 'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING';
}

export const HomeView: React.FC<HomeViewProps> = ({
  onExecutePrompt,
  onNavigateTo,
  isListening,
  onToggleVoice,
  transcript,
  leads,
  warnings,
  projects = [],
  aiState
}) => {
  const [inputVal, setInputVal] = useState('');
  const [greeting, setGreeting] = useState('Good afternoon, Nate.');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning, Nate.');
    else if (hour < 18) setGreeting('Good afternoon, Nate.');
    else setGreeting('Good evening, Nate.');
  }, []);

  // If speech transcription updates, populate inputVal
  useEffect(() => {
    if (transcript) {
      setInputVal(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    playCyberSound('send');
    onExecutePrompt(inputVal);
    setInputVal('');
  };

  const handleChipClick = (promptText: string) => {
    playCyberSound('click');
    onExecutePrompt(promptText);
  };

  const suggestedCommands = [
    "What's the highest-value thing I should do right now?",
    "Find me 10 prospects.",
    "Research today's digital trends.",
    "Build an outreach campaign.",
    "Plan my week.",
    "Audit this business.",
    "Create an automation workflow."
  ];

  const safeLeads = leads || [];
  const pipelineValue = safeLeads
    .filter(l => l.status !== 'LOST')
    .reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  const followUpsDue = safeLeads.filter(l => (l.followUpDate || '').includes('Today')).length;
  const hotLeadsCount = safeLeads.filter(l => l.scoreTier === 'HOT').length;
  const activeProjectsCount = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'REVIEW').length;

  return (
    <div className="relative min-h-full flex flex-col items-center justify-between p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto font-sans">
      {/* Top Luxury Banner */}
      <div className="w-full flex items-center justify-between border-b border-zinc-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-display font-bold text-sm tracking-tight text-zinc-900">
            MOSES // STUDIO COMMAND
          </span>
          <span className="text-[10px] text-zinc-700 font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 tracking-wide">
            ONLINE
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
            <span className="text-[10px] text-zinc-600 font-medium tracking-wider uppercase">COALESCE OS</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono-tech">v2.4</span>
        </div>
      </div>

      {/* Main Central Interactive AI Core & Greeting */}
      <div className="w-full flex flex-col items-center justify-center my-auto py-6 sm:py-8 text-center">
        {/* Abstract AI Core Orb */}
        <div className="mb-5">
          <AiCoreOrb
            state={aiState}
            size="lg"
            interactive={true}
            onClick={() => {
              playCyberSound('boot');
              onToggleVoice();
            }}
          />
        </div>

        {/* Dynamic Greeting & Balanced Editorial Typography (Refined, not oversized) */}
        <div className="space-y-2 max-w-xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            {greeting}
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 font-medium tracking-tight">
            "What's the move, skeem?"
          </p>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed font-normal">
            {safeLeads.length > 0 
              ? `${safeLeads.length} pipeline ${safeLeads.length === 1 ? 'opportunity' : 'opportunities'} mapped • ${followUpsDue} follow-ups scheduled • Solo bandwidth optimal.`
              : 'Pipeline records cleared • OS in default standby mode • Ready for intake.'}
          </p>
        </div>

        {/* Apple-style Floating Minimalist Command Bar */}
        <div className="w-full max-w-2xl mt-6">
          <form
            onSubmit={handleSubmit}
            className="relative flex items-center rounded-full bg-white border border-zinc-200/90 p-1.5 shadow-md focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 transition-all"
          >
            <div className="pl-4 pr-2 text-zinc-400">
              <Terminal size={18} strokeWidth={1.75} />
            </div>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={isListening ? "Listening to your voice command..." : "Ask Moses anything..."}
              className="flex-1 bg-transparent py-2.5 px-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none tracking-tight font-medium"
            />

            <div className="flex items-center gap-2 pr-1">
              {/* Microphone Button */}
              <button
                type="button"
                onClick={() => {
                  playCyberSound('click');
                  onToggleVoice();
                }}
                className={`p-2.5 rounded-full border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md animate-pulse'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-black'
                }`}
                title={isListening ? "Listening... (Click to stop)" : "Voice Command (Speech to Text)"}
              >
                {isListening ? <Mic size={16} strokeWidth={2} /> : <MicOff size={16} strokeWidth={1.5} />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="p-2.5 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-25 disabled:hover:bg-black disabled:cursor-not-allowed transition-all shadow-sm font-bold cursor-pointer"
                title="Send Command (Enter)"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </form>

          {/* Quick status bar below input */}
          <div className="flex items-center justify-between px-4 mt-2.5 text-[11px] text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              VOICE RECOGNITION: {isListening ? 'STREAMING AUDIO' : 'READY'}
            </span>
            <span className="font-mono-tech text-[10px]">ENTER OR ⌘K</span>
          </div>
        </div>

        {/* Suggested Quick Commands - Luxury Pill Chips */}
        <div className="w-full max-w-3xl mt-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-2.5 flex items-center justify-center gap-2">
            <Sparkles size={12} strokeWidth={1.5} className="text-zinc-600" />
            <span>EXECUTIVE COMMAND SHORTCUTS</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestedCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(cmd)}
                className="px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-black hover:text-white border border-zinc-200/90 text-xs text-zinc-700 transition-all flex items-center gap-1.5 group cursor-pointer font-medium tracking-tight shadow-2xs"
              >
                <span className="text-zinc-400 group-hover:text-white transition-colors font-bold">›</span>
                <span>"{cmd}"</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bento Box Metrics (Apple / Nike Clean Light Design) */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-zinc-200/80">
        <div 
          onClick={() => onNavigateTo('BUSINESS_DEVELOPMENT')}
          className="p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-400 hover:shadow-md cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1 font-medium">
            <span>PIPELINE VALUE</span>
            <TrendingUp size={14} strokeWidth={1.5} className="text-zinc-900" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight font-sans">
            R{pipelineValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{safeLeads.length} Active {safeLeads.length === 1 ? 'Opportunity' : 'Opportunities'}</span>
          </div>
        </div>

        <div 
          onClick={() => onNavigateTo('LEADS')}
          className="p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-400 hover:shadow-md cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1 font-medium">
            <span>HOT PROSPECTS</span>
            <Users size={14} strokeWidth={1.5} className="text-zinc-900" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight font-sans">
            {hotLeadsCount} LEADS
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-medium">
            {hotLeadsCount > 0 ? 'Verified Contact Intel' : 'Ready for Ingestion'}
          </div>
        </div>

        <div 
          onClick={() => onNavigateTo('BUSINESS_DEVELOPMENT')}
          className="p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-400 hover:shadow-md cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1 font-medium">
            <span>FOLLOW-UPS</span>
            <Clock size={14} strokeWidth={1.5} className="text-zinc-900" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight font-sans">
            {followUpsDue} TODAY
          </div>
          <div className={`text-[10px] mt-1 font-semibold ${followUpsDue > 0 ? 'text-rose-600' : 'text-zinc-400'}`}>
            {followUpsDue > 0 ? 'Action required' : 'Standby / All Clear'}
          </div>
        </div>

        <div 
          onClick={() => onNavigateTo('DIGITAL_OPERATIONS')}
          className="p-4 rounded-2xl bg-white border border-zinc-200/80 hover:border-zinc-400 hover:shadow-md cursor-pointer transition-all group shadow-sm"
        >
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1 font-medium">
            <span>SOLO BANDWIDTH</span>
            <Zap size={14} strokeWidth={1.5} className="text-zinc-900" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight font-sans">
            {activeProjectsCount === 0 ? '100% FREE' : `${Math.round((activeProjectsCount / 4) * 100)}% ACTIVE`}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1 font-medium">
            {activeProjectsCount} Active {activeProjectsCount === 1 ? 'Build' : 'Builds'} / {Math.max(0, 4 - activeProjectsCount)} Free
          </div>
        </div>
      </div>
    </div>
  );
};
