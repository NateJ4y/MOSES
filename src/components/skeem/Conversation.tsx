import React from 'react';
import type { OutreachRecord } from '../../types';
import { getSkeemStage } from '../../lib/skeem';
import { nice, when } from './util';

interface Props { records: OutreachRecord[]; canAct: boolean; onMarkSent: (r: OutreachRecord) => void; onCancel: (r: OutreachRecord) => void }

export const Conversation: React.FC<Props> = ({ records, canAct, onMarkSent, onCancel }) => {
  const ordered = [...records].sort((a, b) => (a.sentAt || a.createdAt).localeCompare(b.sentAt || b.createdAt)).filter((r) => r.status !== 'CANCELLED');
  if (!ordered.length) {
    return <div className="rounded-2xl border border-dashed border-zinc-200 p-5 text-center text-xs text-zinc-500">Nothing sent or received yet. Ask the coach for a first message, save it as a draft, send it yourself, then mark it as sent.</div>;
  }
  return (
    <ol className="space-y-3">
      {ordered.map((r) => {
        const inbound = r.direction === 'INBOUND';
        const draft = r.status === 'DRAFT';
        return (
          <li key={r.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${inbound ? 'bg-zinc-100 text-zinc-900' : draft ? 'border border-dashed border-zinc-400 bg-white text-zinc-800' : 'bg-zinc-900 text-white'}`}>
              {r.subject && <p className="font-semibold mb-1">{r.subject}</p>}
              <p className="whitespace-pre-wrap">{r.content}</p>
              <p className={`mt-2 text-[10px] ${inbound || draft ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {inbound ? 'They replied' : draft ? 'Draft — not sent' : 'Sent'} · {nice(r.channel)} · stage {getSkeemStage(r.stage).number} · {when(r.sentAt || r.createdAt)}
              </p>
              {draft && canAct && (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => onMarkSent(r)} className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold">I sent this</button>
                  <button type="button" onClick={() => onCancel(r)} className="px-3 py-1 rounded-full border border-zinc-300 text-[10px] font-semibold">Discard</button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
