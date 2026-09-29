import React, { useState } from 'react';
import { 
  Brain, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Save, 
  Bot,
  Zap,
  Check
} from 'lucide-react';
import { playCyberSound } from '../../utils/audio';

interface MemoryRule {
  id: string;
  category: 'PREFERENCE' | 'BUSINESS_CONSTRAINT' | 'CLIENT_HISTORY' | 'TACTICAL_HEURISTIC';
  rule: string;
  confidence: number;
  dateAdded: string;
}

const INITIAL_RULES: MemoryRule[] = [];

export const MemoryView: React.FC = () => {
  const [rules, setRules] = useState<MemoryRule[]>(INITIAL_RULES);
  const [hydrated, setHydrated] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryRule['category']>('TACTICAL_HEURISTIC');

  React.useEffect(() => {
    try { const raw = localStorage.getItem('moses.memory.v1'); if (raw) setRules(JSON.parse(raw)); } catch {}
    setHydrated(true);
  }, []);
  React.useEffect(() => { if (hydrated) { try { localStorage.setItem('moses.memory.v1', JSON.stringify(rules)); } catch {} } }, [rules, hydrated]);

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;

    const item: MemoryRule = {
      id: `mem-${Date.now()}`,
      category: newCategory,
      rule: newRule,
      confidence: 100,
      dateAdded: new Date().toISOString().split('T')[0]
    };

    setRules(prev => [item, ...prev]);
    setNewRule('');
    playCyberSound('response');
  };

  const handleDelete = (id: string) => {
    playCyberSound('click');
    setRules(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Brain size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Moses Long-Term Memory Engine
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Learned heuristics, client context, operating constraints, and strategic rules
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <Database size={13} className="text-zinc-900" />
          <span>Persistent Local Memory</span>
        </div>
      </div>

      {/* Memory Ingestion Form */}
      <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus size={14} className="text-zinc-700" />
          Inject New Strategic Memory &bull; Operating Heuristic
        </h3>

        <form onSubmit={handleAddRule} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-[10px] text-zinc-400 mb-1 font-semibold uppercase">MEMORY CATEGORY</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
              >
                <option value="TACTICAL_HEURISTIC">Tactical Heuristic</option>
                <option value="BUSINESS_CONSTRAINT">Business Constraint</option>
                <option value="PREFERENCE">Preference / Tone</option>
                <option value="CLIENT_HISTORY">Client History</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] text-zinc-400 mb-1 font-semibold uppercase">STRATEGIC RULE CONTENT</label>
              <input
                type="text"
                required
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="e.g. Always qualify leads for technical feasibility before discussing retainers..."
                className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={13} />
              <span>Commit to Moses Memory</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rules Registry List */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-zinc-900 flex items-center justify-between">
          <span>ACTIVE MEMORY NODES</span>
          <span className="text-[10px] text-zinc-400 font-normal">{rules.length} Rules Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {rules.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-300 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                    {r.category.replace('_', ' ')}
                  </span>
                  <span>Confidence: {r.confidence}%</span>
                </div>
                <p className="text-xs text-zinc-800 leading-relaxed font-sans font-medium">
                  "{r.rule}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 text-[10px] text-zinc-400">
                <span>Indexed: {r.dateAdded}</span>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
