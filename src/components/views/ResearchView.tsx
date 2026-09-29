import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Zap, 
  Filter, 
  Globe, 
  Send, 
  Bot, 
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ResearchItem } from '../../types';
import { RESEARCH_ITEMS } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';

interface ResearchViewProps {
  onNavigateToOutreach: () => void;
  onExecuteMosesCommand: (cmd: string) => void;
}

export const ResearchView: React.FC<ResearchViewProps> = ({
  onNavigateToOutreach,
  onExecuteMosesCommand
}) => {
  const [items, setItems] = useState<ResearchItem[]>(RESEARCH_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [query, setQuery] = useState('');
  const [liveResult, setLiveResult] = useState('');
  const [researchStatus, setResearchStatus] = useState<'IDLE' | 'RESEARCHING' | 'ONLINE' | 'NOT CONNECTED' | 'ERROR'>('IDLE');

  const categories = ['ALL', 'AI', 'MARKETING', 'WEBSITES', 'SOCIAL_MEDIA', 'AUTOMATION', 'BUSINESS', 'DESIGN', 'TECHNOLOGY'];

  const filteredItems = items.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  const handleTurnIntoAction = (item: ResearchItem) => {
    playCyberSound('click');
    onExecuteMosesCommand(`Based on the trend "${item.trend}", outline an immediate 3-step action plan for Coalesce Digital to execute this week.`);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <TrendingUp size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Digital Trend Radar &amp; Intelligence
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Turning market shifts into high-ticket Coalesce systems and outreach angles
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <Zap size={13} className="text-zinc-900" />
          <span>Action-Oriented Radar Active</span>
        </div>
      </div>

      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setResearchStatus('RESEARCHING');
        setLiveResult('');
        try {
          const res = await fetch('/api/research', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic: query.trim() }) });
          const data = await res.json();
          setLiveResult(data.reply || 'No verified result returned.');
          setResearchStatus(data.status || 'ERROR');
        } catch {
          setResearchStatus('ERROR');
          setLiveResult('Research failed. No result was fabricated.');
        }
      }} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Research a current market, competitor, technology, or trend..." className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs focus:outline-none" />
        <button className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-semibold" disabled={researchStatus === 'RESEARCHING'}>
          {researchStatus === 'RESEARCHING' ? 'Researching…' : 'Run Live Research'}
        </button>
      </form>
      {liveResult && (
        <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs whitespace-pre-wrap text-xs text-zinc-700 leading-relaxed">
          <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">LIVE RESEARCH — {researchStatus}</div>
          {liveResult}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playCyberSound('click');
              setSelectedCategory(cat);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-black text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Research Cards Grid */}
      {filteredItems.length === 0 && !liveResult && (
        <div className="p-10 rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-xs text-zinc-500">NO DATA — run live research above. MOSES does not preload market claims.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white border border-zinc-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition-all"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-700">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-zinc-400">{item.date}</span>
                </div>

                {/* Trend Title */}
                <h3 className="font-display text-base font-bold text-zinc-900 tracking-tight leading-snug">
                  {item.trend}
                </h3>

                {/* Why It Matters */}
                <div className="mt-3.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Why It Matters
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">{item.whyItMatters}</p>
                </div>

                {/* Coalesce Opportunity */}
                <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Opportunity for Coalesce Digital
                  </div>
                  <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                    {item.opportunityForCoalesce}
                  </p>
                </div>

                {/* Recommended Action */}
                <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1">
                  <div className="text-[10px] font-bold text-zinc-800 uppercase tracking-wider">
                    Recommended Action
                  </div>
                  <p className="text-xs text-zinc-700 leading-relaxed">{item.recommendedAction}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTurnIntoAction(item)}
                  className="w-full py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles size={13} />
                  <span>Execute Moses Action Plan</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
