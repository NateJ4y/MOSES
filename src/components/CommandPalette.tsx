import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Terminal, 
  Users, 
  PlusCircle, 
  Sparkles, 
  Mail, 
  GitBranch, 
  BookOpen, 
  Clock, 
  Mic, 
  X,
  ArrowRight,
  Zap
} from 'lucide-react';
import { NavSection } from '../types';
import { playCyberSound } from '../utils/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
  onExecutePrompt: (prompt: string) => void;
  onTriggerVoice: () => void;
}

interface CommandAction {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onExecutePrompt,
  onTriggerVoice
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          playCyberSound('click');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const actions: CommandAction[] = [
    {
      id: 'ask-highest-value',
      title: "What's the highest-value thing I should do right now?",
      category: 'TACTICAL OS',
      icon: Zap,
      action: () => {
        onNavigate('COMMAND');
        onExecutePrompt("What's the highest-value thing I should do right now?");
        onClose();
      }
    },
    {
      id: 'find-leads',
      title: 'Find 10 prospects for Coalesce',
      category: 'BUSINESS DEV',
      icon: Users,
      action: () => {
        onNavigate('COMMAND');
        onExecutePrompt('Find me 10 high-value prospects in South Africa matching our ICP.');
        onClose();
      }
    },
    {
      id: 'goto-pipeline',
      title: 'Open Business Development Pipeline',
      category: 'NAVIGATION',
      icon: Users,
      action: () => {
        onNavigate('BUSINESS_DEVELOPMENT');
        onClose();
      }
    },
    {
      id: 'outreach-campaign',
      title: 'Build an outreach campaign with Skeem method',
      category: 'OUTREACH',
      icon: ArrowRight,
      action: () => {
        onNavigate('OUTREACH');
        onClose();
      }
    },
    {
      id: 'research-trends',
      title: "Research today's digital trends",
      category: 'INTELLIGENCE',
      icon: Sparkles,
      action: () => {
        onNavigate('RESEARCH');
        onClose();
      }
    },
    {
      id: 'draft-email',
      title: 'Draft lead response email',
      category: 'COMMUNICATION',
      icon: Mail,
      action: () => {
        onNavigate('EMAIL');
        onClose();
      }
    },
    {
      id: 'create-workflow',
      title: 'Create automation workflow diagram',
      category: 'SYSTEMS',
      icon: GitBranch,
      action: () => {
        onNavigate('SYSTEMS');
        onClose();
      }
    },
    {
      id: 'open-knowledge',
      title: 'Open Coalesce Knowledge Centre',
      category: 'KNOWLEDGE',
      icon: BookOpen,
      action: () => {
        onNavigate('KNOWLEDGE');
        onClose();
      }
    },
    {
      id: 'voice-cmd',
      title: 'Start Voice Command HUD',
      category: 'VOICE',
      icon: Mic,
      action: () => {
        onClose();
        onTriggerVoice();
      }
    }
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (action: CommandAction) => {
    playCyberSound('click');
    action.action();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    playCyberSound('send');
    onNavigate('COMMAND');
    onExecutePrompt(query);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Input Bar */}
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 bg-white">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or ask Moses anything... (Press Enter to execute)"
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-zinc-900"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 bg-zinc-100 rounded-full text-[10px] text-zinc-600 border border-zinc-200 font-semibold">
            ESC to close
          </kbd>
        </form>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-zinc-500">No pre-set command matches "{query}"</p>
              <button
                type="button"
                onClick={() => {
                  playCyberSound('send');
                  onNavigate('COMMAND');
                  onExecutePrompt(query);
                  onClose();
                }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 shadow-sm cursor-pointer"
              >
                <span>Ask Moses AI: "{query}"</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-900 shadow-2xs'
                      : 'text-zinc-700 hover:bg-zinc-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900">{item.title}</div>
                      <div className="text-[9px] text-zinc-400 uppercase tracking-wider">{item.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight size={12} className={isSelected ? 'text-zinc-900 opacity-100' : 'opacity-0'} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
          <span>MOSES TELEMETRY MATRIX</span>
          <span className="text-zinc-900 font-semibold">COALESCE OS // HIGH-LEVERAGE MODE</span>
        </div>
      </div>
    </div>
  );
};
