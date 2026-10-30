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
  FolderOpen,
  Trash2
} from 'lucide-react';
import { KnowledgeDoc } from '../../types';
import { playCyberSound } from '../../utils/audio';

export const KnowledgeView: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeDoc['category']>('OPERATIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const categories = ['ALL', 'BRAND', 'PRICING', 'SCRIPTS', 'OPERATIONS', 'DECISIONS', 'CLIENT_HISTORY'];

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/data?collection=knowledge', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error || 'Knowledge could not be loaded from the database.');
        if (!Array.isArray(body.records)) throw new Error('Knowledge database response was invalid.');
        if (!cancelled) {
          setDocs(body.records);
          setSelectedDoc(body.records[0] || null);
          setLoadError(null);
          setHydrated(true);
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Knowledge could not be loaded.');
      });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    fetch('/api/data?collection=knowledge', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docs)
    }).then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || 'Knowledge could not be saved.');
      }
      setLoadError(null);
    }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Knowledge could not be saved.'));
  }, [docs, hydrated]);

  const handleAddDoc = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const doc: KnowledgeDoc = {
      id: 'knowledge-' + Date.now(),
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      tags: [],
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    setDocs((current) => [doc, ...current]);
    setSelectedDoc(doc);
    setNewTitle('');
    setNewContent('');
    playCyberSound('response');
  };

  const handleDeleteDoc = (id: string) => {
    const remaining = docs.filter((doc) => doc.id !== id);
    setDocs(remaining);
    if (selectedDoc?.id === id) setSelectedDoc(remaining[0] || null);
    playCyberSound('click');
  };

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
            Verified business knowledge and approved operating documentation
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <Brain size={14} className="text-zinc-900" />
          <span>Awaiting verified knowledge records</span>
        </div>
      </div>

      {loadError && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">{loadError} Changes are not confirmed saved.</div>}

      <form onSubmit={handleAddDoc} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-zinc-200 bg-white">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required placeholder="Document title" className="sm:col-span-2 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900" />
        <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as KnowledgeDoc['category'])} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900">
          {categories.filter((category) => category !== 'ALL').map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
        </select>
        <button type="submit" disabled={!hydrated} className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold disabled:opacity-40"><Plus size={13} className="inline mr-1" />Add knowledge</button>
        <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} required placeholder="Add verified business knowledge, decisions, processes, or approved playbooks..." rows={3} className="sm:col-span-4 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900" />
      </form>

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
            {hydrated && filteredDocs.length === 0 && <div className="p-6 rounded-xl border border-dashed border-zinc-300 text-center text-xs text-zinc-500">No knowledge records found. Add approved information above.</div>}
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

                  <div className="flex justify-end mt-2"><button type="button" onClick={(event) => { event.stopPropagation(); handleDeleteDoc(doc.id); }} className="text-[10px] text-zinc-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={11} /> Delete</button></div>
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
                <span>Knowledge record: {selectedDoc.id}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200 text-center text-zinc-400 text-xs">
              No knowledge records have been added yet. MOSES will not invent or preload business documentation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
