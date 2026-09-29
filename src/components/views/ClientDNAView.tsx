import React, { useEffect, useState } from 'react';
import { Fingerprint, Plus, Save, Trash2 } from 'lucide-react';
import { ClientDNA } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface Props {
  records: ClientDNA[];
  onSave: (record: ClientDNA) => void;
  onDelete: (id: string) => void;
}

const EMPTY: Omit<ClientDNA, 'id' | 'updatedAt'> = {
  clientId: '',
  businessName: '',
  position: '',
  usp: '',
  targetAudience: '',
  brandVoice: '',
  visualSystem: '',
  goals: '',
  offers: '',
  proof: '',
  constraints: '',
  notes: ''
};

export const ClientDNAView: React.FC<Props> = ({ records, onSave, onDelete }) => {
  const [draft, setDraft] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.businessName.trim()) return;
    onSave({
      ...draft,
      id: editingId || `dna-${Date.now()}`,
      updatedAt: new Date().toISOString()
    });
    setDraft({ ...EMPTY });
    setEditingId(null);
    playCyberSound('response');
  };

  const edit = (record: ClientDNA) => {
    setEditingId(record.id);
    setDraft({
      clientId: record.clientId,
      businessName: record.businessName,
      position: record.position,
      usp: record.usp,
      targetAudience: record.targetAudience,
      brandVoice: record.brandVoice,
      visualSystem: record.visualSystem,
      goals: record.goals,
      offers: record.offers,
      proof: record.proof,
      constraints: record.constraints,
      notes: record.notes
    });
  };

  const field = (key: keyof typeof EMPTY, label: string, multiline = false) => multiline ? (
    <textarea value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} placeholder={label} rows={3} className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs focus:outline-none focus:border-zinc-400" />
  ) : (
    <input value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} placeholder={label} className="w-full p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs focus:outline-none focus:border-zinc-400" />
  );

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto overflow-y-auto space-y-6 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-5">
        <div><div className="flex items-center gap-2.5"><div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200"><Fingerprint size={18}/></div><h2 className="font-display text-xl font-bold">Client DNA</h2></div><p className="text-xs text-zinc-500 mt-1">Master client record + brand system. Only verified or user-entered information belongs here.</p></div>
        <button onClick={() => { setDraft({ ...EMPTY }); setEditingId(null); }} className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-2"><Plus size={14}/> New Client DNA</button>
      </div>

      <form onSubmit={save} className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {field('businessName','Business / Client Name *')}
          {field('clientId','Client ID / Reference')}
          {field('position','Positioning',true)}
          {field('usp','USP',true)}
          {field('targetAudience','Target Audience',true)}
          {field('brandVoice','Brand Voice',true)}
          {field('visualSystem','Visual System',true)}
          {field('goals','Goals / KPIs',true)}
          {field('offers','Offers / Services',true)}
          {field('proof','Proof / Testimonials / Evidence',true)}
          {field('constraints','Constraints / Risks',true)}
          {field('notes','Notes',true)}
        </div>
        <div className="flex justify-end"><button className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-2"><Save size={13}/>{editingId ? 'Update Client DNA' : 'Save Client DNA'}</button></div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.length === 0 ? <div className="md:col-span-2 p-10 rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-500">NO DATA — create a real client record to build its DNA.</div> : records.map(r => (
          <div key={r.id} className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-xs">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-sm">{r.businessName}</h3><p className="text-[10px] text-zinc-400 mt-1">Updated {new Date(r.updatedAt).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={() => edit(r)} className="px-3 py-1 rounded-full bg-zinc-100 text-[10px] font-semibold">Edit</button><button onClick={() => onDelete(r.id)} className="p-1.5 text-zinc-400 hover:text-red-600"><Trash2 size={13}/></button></div></div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
              {[['Positioning',r.position],['USP',r.usp],['Audience',r.targetAudience],['Voice',r.brandVoice],['Visual System',r.visualSystem],['Goals',r.goals],['Offers',r.offers],['Proof',r.proof],['Constraints',r.constraints],['Notes',r.notes]].map(([label,value]) => <div key={label} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200"><span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1">{label}</span><span className="text-zinc-700 whitespace-pre-wrap">{value || 'UNKNOWN'}</span></div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
