import React, { useMemo, useState } from 'react';
import { Fingerprint, Plus, Save, Trash2, Search, X, Pencil, Building2, Target, MessageSquareText, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { ClientDNA } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface Props {
  records: ClientDNA[];
  onSave: (record: ClientDNA) => void;
  onDelete: (id: string) => void;
}

type Draft = Omit<ClientDNA, 'id' | 'updatedAt'>;
type FieldKey = keyof Draft;
type Filter = 'ALL' | 'COMPLETE' | 'INCOMPLETE';

const EMPTY: Draft = {
  clientId: '', businessName: '', position: '', usp: '', targetAudience: '',
  brandVoice: '', visualSystem: '', goals: '', offers: '', proof: '',
  constraints: '', notes: ''
};

const sections: { title: string; description: string; icon: React.ReactNode; fields: { key: FieldKey; label: string; hint: string }[] }[] = [
  { title: 'Business foundation', description: 'Who the client is and how the business is positioned.', icon: <Building2 size={16} />, fields: [
    { key: 'businessName', label: 'Business / client name', hint: 'Required' },
    { key: 'clientId', label: 'Client ID / reference', hint: 'Optional reference' },
    { key: 'position', label: 'Positioning', hint: 'How they want to be known' },
    { key: 'usp', label: 'Unique selling proposition', hint: 'What makes the offer distinct' }
  ]},
  { title: 'Audience & brand', description: 'The people they serve and how the brand should communicate.', icon: <Target size={16} />, fields: [
    { key: 'targetAudience', label: 'Target audience', hint: 'Customer types, needs and context' },
    { key: 'brandVoice', label: 'Brand voice', hint: 'Tone, language and personality' },
    { key: 'visualSystem', label: 'Visual system', hint: 'Colors, typography and visual direction' }
  ]},
  { title: 'Commercial direction', description: 'What success looks like and what the client sells.', icon: <Palette size={16} />, fields: [
    { key: 'goals', label: 'Goals & KPIs', hint: 'Desired outcomes and measurable targets' },
    { key: 'offers', label: 'Offers & services', hint: 'Products, services and packages' },
    { key: 'proof', label: 'Proof & evidence', hint: 'Verified testimonials, results or credentials' }
  ]},
  { title: 'Working context', description: 'Important limitations and additional context.', icon: <MessageSquareText size={16} />, fields: [
    { key: 'constraints', label: 'Constraints & risks', hint: 'Budget, timelines, approvals or known risks' },
    { key: 'notes', label: 'Internal notes', hint: 'Other confirmed context' }
  ]}
];

const completeness = (record: ClientDNA) => {
  const keys: FieldKey[] = ['position', 'usp', 'targetAudience', 'brandVoice', 'visualSystem', 'goals', 'offers', 'proof', 'constraints', 'notes'];
  return keys.filter(key => Boolean(record[key]?.trim())).length;
};

export const ClientDNAView: React.FC<Props> = ({ records, onSave, onDelete }) => {
  const [draft, setDraft] = useState<Draft>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => records
    .filter(record => {
      const haystack = [record.businessName, record.clientId, record.position, record.usp, record.targetAudience, record.brandVoice, record.offers]
        .join(' ').toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const score = completeness(record);
      const matchesFilter = filter === 'ALL' || (filter === 'COMPLETE' ? score >= 7 : score < 7);
      return matchesQuery && matchesFilter;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [records, query, filter]);

  const resetForm = () => {
    setDraft({ ...EMPTY });
    setEditingId(null);
    setFormOpen(false);
  };

  const startNew = () => {
    setDraft({ ...EMPTY });
    setEditingId(null);
    setFormOpen(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.businessName.trim()) return;
    onSave({ ...draft, businessName: draft.businessName.trim(), id: editingId || `dna-${Date.now()}`, updatedAt: new Date().toISOString() });
    resetForm();
    playCyberSound('response');
  };

  const edit = (record: ClientDNA) => {
    const { id, updatedAt, ...values } = record;
    setDraft({ ...EMPTY, ...values });
    setEditingId(id);
    setFormOpen(true);
    setExpandedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateField = (key: FieldKey, value: string) => setDraft(current => ({ ...current, [key]: value }));

  return (
    <div className="h-full min-h-full max-w-7xl mx-auto px-3 py-5 sm:px-6 sm:py-7 space-y-6 overflow-y-auto bg-white">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200"><Fingerprint size={19} /></div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Client intelligence</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">Client DNA</h1>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 max-w-2xl">A working profile of each client's business, audience, positioning and brand. Store confirmed information—not assumptions.</p>
        </div>
        <button type="button" onClick={startNew} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-xs font-semibold text-white hover:bg-zinc-800">
          <Plus size={15} /> New client profile
        </button>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-zinc-200 p-4"><p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Total profiles</p><p className="text-2xl font-bold mt-1 tabular-nums">{records.length}</p></div>
        <div className="rounded-2xl border border-zinc-200 p-4"><p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Well documented</p><p className="text-2xl font-bold mt-1 tabular-nums">{records.filter(r => completeness(r) >= 7).length}</p></div>
        <div className="rounded-2xl border border-zinc-200 p-4 col-span-2 sm:col-span-1"><p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Need more detail</p><p className="text-2xl font-bold mt-1 tabular-nums">{records.filter(r => completeness(r) < 7).length}</p></div>
      </section>

      {formOpen && (
        <form onSubmit={save} className="rounded-2xl border border-zinc-300 bg-zinc-50 p-4 sm:p-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] uppercase tracking-[0.18em] font-bold text-zinc-400">{editingId ? 'Edit existing record' : 'New record'}</p><h2 className="text-lg font-bold mt-1">{editingId ? 'Update client DNA' : 'Build a client profile'}</h2><p className="text-xs text-zinc-500 mt-1">Fill in what you know. You can save a partial profile and complete it later.</p></div>
            <button type="button" onClick={resetForm} aria-label="Close form" className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-500"><X size={17}/></button>
          </div>
          {sections.map(section => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 text-zinc-800">{section.icon}<h3 className="text-xs font-bold">{section.title}</h3><span className="text-[10px] text-zinc-400">{section.description}</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields.map(field => (
                  <label key={field.key} className={['position','usp','targetAudience','brandVoice','visualSystem','goals','offers','proof','constraints','notes'].includes(field.key) ? 'block' : 'block'}>
                    <span className="flex items-center justify-between gap-2 text-[11px] font-semibold text-zinc-700 mb-1.5"><span>{field.label}{field.key === 'businessName' ? ' *' : ''}</span><span className="text-[9px] font-normal text-zinc-400">{field.hint}</span></span>
                    {field.key === 'businessName' || field.key === 'clientId' ? (
                      <input required={field.key === 'businessName'} value={draft[field.key]} onChange={e => updateField(field.key, e.target.value)} placeholder={field.key === 'businessName' ? 'e.g. Acme Studio' : 'e.g. CL-001'} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                    ) : (
                      <textarea rows={3} value={draft[field.key]} onChange={e => updateField(field.key, e.target.value)} placeholder={field.hint} className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t border-zinc-200 pt-4">
            <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-600 hover:bg-white">Cancel</button>
            <button type="submit" disabled={!draft.businessName.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Save size={14}/>{editingId ? 'Save changes' : 'Save client profile'}</button>
          </div>
        </form>
      )}

      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div><h2 className="text-sm font-bold">Client profiles</h2><p className="text-[11px] text-zinc-500 mt-1">Browse and maintain your saved client records.</p></div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients..." className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2.5 text-xs outline-none focus:border-zinc-500"/></div>
            <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-700 outline-none"><option value="ALL">All profiles</option><option value="COMPLETE">Well documented</option><option value="INCOMPLETE">Needs more detail</option></select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-12 text-center">
            <Fingerprint size={24} className="mx-auto text-zinc-300"/>
            <h3 className="text-sm font-semibold mt-3">{records.length === 0 ? 'No client profiles yet' : 'No matching profiles'}</h3>
            <p className="text-xs text-zinc-500 mt-1">{records.length === 0 ? 'Add your first client profile. MOSES will only store details you provide.' : 'Try a different search or filter.'}</p>
            {records.length === 0 && <button type="button" onClick={startNew} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white"><Plus size={14}/> Add first client</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filteredRecords.map(record => {
              const score = completeness(record);
              const expanded = expandedId === record.id;
              const details: { label: string; value: string }[] = [
                { label: 'Positioning', value: record.position }, { label: 'USP', value: record.usp },
                { label: 'Target audience', value: record.targetAudience }, { label: 'Brand voice', value: record.brandVoice },
                { label: 'Visual system', value: record.visualSystem }, { label: 'Goals & KPIs', value: record.goals },
                { label: 'Offers & services', value: record.offers }, { label: 'Proof & evidence', value: record.proof },
                { label: 'Constraints & risks', value: record.constraints }, { label: 'Notes', value: record.notes }
              ];
              return (
                <article key={record.id} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-sm text-zinc-950 truncate">{record.businessName}</h3>{record.clientId && <span className="rounded-md bg-zinc-100 px-2 py-1 text-[9px] text-zinc-500">{record.clientId}</span>}</div><p className="text-[10px] text-zinc-400 mt-1">Updated {Number.isNaN(new Date(record.updatedAt).getTime()) ? 'date unavailable' : new Date(record.updatedAt).toLocaleDateString()}</p></div>
                      <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => edit(record)} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-2 text-[10px] font-semibold hover:bg-zinc-50"><Pencil size={12}/> Edit</button><button type="button" onClick={() => { if (window.confirm(`Delete the Client DNA record for ${record.businessName}?`)) onDelete(record.id); }} aria-label={`Delete ${record.businessName}`} className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:border-red-200 hover:text-red-600"><Trash2 size={13}/></button></div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[9px] uppercase tracking-wider font-bold text-zinc-400">Profile coverage</p><div className="mt-1.5 h-1.5 w-36 max-w-full overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-800" style={{ width: `${score / 10 * 100}%` }}/></div></div><span className="text-[10px] text-zinc-500 tabular-nums">{score}/10 sections documented</span></div>
                    <button type="button" onClick={() => setExpandedId(expanded ? null : record.id)} className="mt-4 flex w-full items-center justify-between border-t border-zinc-100 pt-3 text-[11px] font-semibold text-zinc-600 hover:text-zinc-950">{expanded ? 'Hide profile details' : 'View full profile'}{expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button>
                    {expanded && <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">{details.map(detail => <div key={detail.label} className="rounded-xl bg-zinc-50 border border-zinc-100 p-3"><p className="text-[9px] uppercase tracking-wider font-bold text-zinc-400 mb-1">{detail.label}</p><p className="text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap break-words">{detail.value?.trim() || <span className="text-zinc-400 italic">Not provided</span>}</p></div>)}</div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <p className="text-[10px] text-zinc-400 text-center pb-2">Client records are stored from information entered by your team. Blank fields remain blank; no client facts are generated.</p>
    </div>
  );
};
