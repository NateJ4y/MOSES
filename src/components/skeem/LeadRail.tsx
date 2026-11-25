import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Lead, OutreachRecord } from '../../types';
import { coldSequenceStatus, getSkeemStage } from '../../lib/skeem';
import { shortDate } from './util';

interface Props { leads: Lead[]; outreach: OutreachRecord[]; selectedId: string; onSelect: (id: string) => void }

type Tone = 'red' | 'amber' | 'green' | 'grey';
const TONE: Record<Tone, string> = {
  red: 'bg-red-100 text-red-800', amber: 'bg-amber-100 text-amber-800', green: 'bg-emerald-100 text-emerald-800', grey: 'bg-zinc-100 text-zinc-600'
};

/** Everything the rail and the mobile picker need to say who needs attention. */
export function useLeadRows(leads: Lead[], outreach: OutreachRecord[]) {
  return useMemo(() => {
    const byLead = new Map<string, OutreachRecord[]>();
    outreach.forEach((r) => { const l = byLead.get(r.leadId); if (l) l.push(r); else byLead.set(r.leadId, [r]); });
    const rows = leads.map((lead) => {
      const records = byLead.get(lead.id) || [];
      const cold = coldSequenceStatus(lead, records);
      const drafts = records.filter((r) => r.status === 'DRAFT').length;
      const closed = lead.status === 'WON' || lead.status === 'LOST';
      let badge = { text: 'Not started', tone: 'grey' as Tone };
      let score = 4;
      if (lead.contactRestriction === 'OPT_OUT') { badge = { text: 'Opted out', tone: 'red' }; score = 9; }
      else if (closed) { badge = { text: lead.status === 'WON' ? 'Won' : 'Lost', tone: 'grey' }; score = 8; }
      else if (cold.state === 'IN_PROGRESS' && cold.due) { badge = { text: cold.overdueDays ? `Overdue ${cold.overdueDays}d` : 'Due now', tone: 'red' }; score = 0; }
      else if (cold.shouldStop) { badge = { text: 'Stop sequence', tone: 'amber' }; score = 1; }
      else if (cold.state === 'NOT_STARTED') { badge = { text: 'Not started', tone: 'amber' }; score = 2; }
      else if (cold.state === 'IN_PROGRESS') { badge = { text: `Next ${shortDate(cold.dueAt)}`, tone: 'grey' }; score = 5; }
      else if (cold.state === 'REPLIED') { badge = { text: 'In conversation', tone: 'green' }; score = 3; }
      return { lead, cold, drafts, badge, score };
    });
    rows.sort((a, b) => a.score - b.score || a.lead.business.localeCompare(b.lead.business));
    return rows;
  }, [leads, outreach]);
}

export const LeadRail: React.FC<Props> = ({ leads, outreach, selectedId, onSelect }) => {
  const rows = useLeadRows(leads, outreach);
  const [query, setQuery] = useState('');
  const shown = rows.filter((r) => r.lead.business.toLowerCase().includes(query.trim().toLowerCase()));
  const needAttention = rows.filter((r) => r.score <= 2).length;
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-zinc-200 space-y-2">
        <div className="flex items-baseline justify-between"><h3 className="text-[11px] font-bold uppercase tracking-wider">Prospects</h3><span className="text-[10px] text-zinc-500">{needAttention} need you</span></div>
        <div className="relative"><Search size={12} className="absolute left-2.5 top-2.5 text-zinc-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="w-full pl-7 pr-2 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-xs" /></div>
      </div>
      <ul className="flex-1 overflow-y-auto scrollbar-thin">
        {shown.map(({ lead, drafts, badge }) => (
          <li key={lead.id}>
            <button type="button" onClick={() => onSelect(lead.id)} className={`w-full text-left px-3 py-2.5 border-b border-zinc-100 transition-colors ${selectedId === lead.id ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50'}`}>
              <span className="block text-xs font-semibold truncate">{lead.business}</span>
              <span className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${selectedId === lead.id ? 'bg-white/20 text-white' : TONE[badge.tone]}`}>{badge.text}</span>
                <span className={`text-[9px] ${selectedId === lead.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{lead.skeemStage ? `Stage ${getSkeemStage(lead.skeemStage).number}` : 'No stage'}{drafts ? ` · ${drafts} draft${drafts > 1 ? 's' : ''}` : ''}</span>
              </span>
            </button>
          </li>
        ))}
        {!shown.length && <li className="p-4 text-xs text-zinc-500">{leads.length ? 'No match.' : 'No prospects yet. Add one in Leads first. MOSES will not invent one.'}</li>}
      </ul>
    </div>
  );
};
