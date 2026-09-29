import React, { useState } from 'react';
import { 
  BookOpen, 
  Brain, 
  Search, 
  Tag, 
  Plus, 
  FileText, 
  Sparkles, 
  ShieldCheck,
  Check,
  Copy,
  FolderOpen
} from 'lucide-react';
import { KnowledgeDoc } from '../../types';
import { INITIAL_KNOWLEDGE_DOCS } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';

export const KnowledgeView: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(INITIAL_KNOWLEDGE_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(INITIAL_KNOWLEDGE_DOCS[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const categories = ['ALL', 'BRAND', 'PRICING', 'SCRIPTS', 'OPERATIONS', 'DECISIONS', 'CLIENT_HISTORY'];

  const safeDocs = docs || [];
  const filteredDocs = safeDocs.filter((doc) => {
    const matchesCat = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (doc.title || '').toLowerCase().includes(q) ||
      (doc.content || '').toLowerCase().includes(q) ||
      (doc.tags || []).some(t => (t || '').toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    playCyberSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <BookOpen size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Knowledge &amp; Memory Vault
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Coalesce Core DNA, Skeem Method Playbooks, Flexible Pricing &amp; Moses Memory Bank
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <Brain size={14} className="text-zinc-900" />
          <span>Memory Engine Synchronized</span>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search knowledge docs, playbooks, scripts, pricing models..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 font-sans shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => {
                playCyberSound('click');
                setSelectedCategory(c);
              }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === c
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {c.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Docs List & Document Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left: Document Cards */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-bold text-zinc-900 px-1 flex items-center justify-between">
            <span>VAULT ENTRIES</span>
            <span className="text-[10px] text-zinc-400 font-normal">{filteredDocs.length} Documents</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    playCyberSound('click');
                    setSelectedDoc(doc);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-50 border-black shadow-xs'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold border border-zinc-200">
                      {doc.category.replace('_', ' ')}
                    </span>
                    <span>Updated: {doc.lastUpdated}</span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-900 mb-1">{doc.title}</h4>
                  <p className="text-[11px] text-zinc-600 line-clamp-2">{doc.content}</p>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] text-zinc-400 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document Inspector & Reading View */}
        <div className="lg:col-span-7">
          {selectedDoc ? (
            <div className="rounded-2xl bg-white border border-zinc-200 p-6 relative shadow-xs space-y-4">
              {/* Doc Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold uppercase">
                    {selectedDoc.category.replace('_', ' ')}
                  </span>
                  <h3 className="font-display text-lg font-bold text-zinc-900 mt-2 tracking-tight">
                    {selectedDoc.title}
                  </h3>
                </div>

                <button
                  onClick={() => handleCopy(selectedDoc.content)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-800 transition-colors font-semibold cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Content'}</span>
                </button>
              </div>

              {/* Content Box */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto font-sans scrollbar-thin">
                {selectedDoc.content}
              </div>

              {/* Tags and Meta */}
              <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Tag size={12} className="text-zinc-500" />
                  <span>Tags: {selectedDoc.tags.join(', ')}</span>
                </div>
                <span>Memory node: {selectedDoc.id}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-zinc-400 text-xs">
              Select a knowledge entry from the vault to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
