import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Inbox, Send, ShieldCheck, Sparkles, Eye, Check, RotateCcw, Search, Plus, X, Filter, ChevronDown } from 'lucide-react';
import { EmailMessage } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface EmailViewProps {
  emails?: EmailMessage[];
  onUpdateEmails?: (emails: EmailMessage[]) => void;
}
type Category = EmailMessage['category'];
type Status = EmailMessage['status'];

const CATEGORIES: { id: Category | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All categories' }, { id: 'INBOX', label: 'Inbox' },
  { id: 'LEADS', label: 'Leads & opportunities' }, { id: 'FOLLOW_UPS', label: 'Follow-ups' },
  { id: 'CAMPAIGNS', label: 'Campaigns' }, { id: 'DRAFTS', label: 'Drafts' }, { id: 'SENT', label: 'Sent archive' }
];
const STATUSES: { id: Status | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All statuses' }, { id: 'RECEIVED', label: 'Received' },
  { id: 'DRAFT_READY', label: 'Draft ready' }, { id: 'UNDER_REVIEW', label: 'Under review' },
  { id: 'APPROVED', label: 'Approved' }, { id: 'SENT', label: 'Sent' }
];
const makeEmptyForm = () => ({
  from: '', to: '', subject: '', snippet: '', body: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'INBOX' as Category, status: 'RECEIVED' as Status, aiSummary: ''
});

export const EmailView: React.FC<EmailViewProps> = ({ emails: externalEmails, onUpdateEmails }) => {
  const [internalEmails, setInternalEmails] = useState<EmailMessage[]>([]);
  const emails = externalEmails !== undefined ? externalEmails : internalEmails;
  const [category, setCategory] = useState<Category | 'ALL'>('ALL');
  const [status, setStatus] = useState<Status | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(makeEmptyForm);
  const [formError, setFormError] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [approvalStage, setApprovalStage] = useState<'DRAFT_READY' | 'REVIEW' | 'APPROVED' | 'SENT'>('DRAFT_READY');
  const [dispatchMessage, setDispatchMessage] = useState('');

  const setEmails = (updater: (previous: EmailMessage[]) => EmailMessage[]) => {
    if (externalEmails !== undefined && onUpdateEmails) onUpdateEmails(updater(externalEmails));
    else setInternalEmails(updater);
  };

  const selectedEmail = emails.find(email => email.id === selectedId) || null;
  useEffect(() => {
    if (!selectedId || !emails.some(email => email.id === selectedId)) setSelectedId(emails[0]?.id || null);
  }, [emails, selectedId]);

  const filteredEmails = useMemo(() => {
    const term = search.trim().toLowerCase();
    return emails.filter(email => {
      const matchesCategory = category === 'ALL' || email.category === category;
      const matchesStatus = status === 'ALL' || email.status === status;
      const matchesSearch = !term || [email.from, email.to, email.subject, email.snippet, email.body]
        .some(value => (value || '').toLowerCase().includes(term));
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [emails, category, status, search]);

  const handleAddEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (!form.from.trim() || !form.to.trim() || !form.subject.trim() || !form.body.trim()) {
      setFormError('Complete sender, recipient, subject, and message before saving.');
      return;
    }
    const record: EmailMessage = {
      id: 'email-' + (globalThis.crypto?.randomUUID?.() || Date.now().toString()),
      from: form.from.trim(), to: form.to.trim(), subject: form.subject.trim(),
      snippet: form.snippet.trim() || form.body.trim().slice(0, 140),
      body: form.body.trim(), date: form.date, category: form.category, status: form.status,
      ...(form.aiSummary.trim() ? { aiSummary: form.aiSummary.trim() } : {})
    };
    setEmails(previous => [record, ...previous]);
    setSelectedId(record.id);
    setCategory('ALL'); setStatus('ALL'); setSearch(''); setReplyDraft('');
    setApprovalStage('DRAFT_READY'); setShowAdd(false); setForm(makeEmptyForm());
    playCyberSound('response');
  };

  const handleAdvanceApproval = () => {
    playCyberSound('click');
    if (!selectedEmail) return;
    setDispatchMessage('');
    if (approvalStage === 'DRAFT_READY') setApprovalStage('REVIEW');
    else if (approvalStage === 'REVIEW') { setApprovalStage('APPROVED'); playCyberSound('response'); }
  };

  const handleSend = async () => {
    playCyberSound('click');
    if (!selectedEmail) return;
    const recipient = selectedEmail.to.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      setDispatchMessage('No valid recipient email is saved on this record. Correct the recipient before sending.');
      return;
    }
    const subjectLine = /^re:/i.test(selectedEmail.subject) ? selectedEmail.subject : 'Re: ' + selectedEmail.subject;
    if (!replyDraft.trim()) { setDispatchMessage('Write your reply before sending.'); return; }
    setDispatchMessage('Sending request to the configured email provider…');
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, subject: subjectLine, text: replyDraft.trim() })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setDispatchMessage(result.error || 'Email request failed (HTTP ' + response.status + ').'); return; }
      setApprovalStage('SENT');
      setDispatchMessage('Email provider accepted the request. This does not confirm inbox delivery.');
    } catch { setDispatchMessage('Could not reach MOSES email service. Check the connection and try again.'); }
  };

  const inputClass = 'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-500';
  const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500';

  return (
    <div className="h-full min-h-0 flex flex-col p-4 sm:p-7 max-w-[1500px] mx-auto font-sans overflow-y-auto scrollbar-thin space-y-5 bg-white text-zinc-900">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5"><div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200"><Mail size={18} /></div><h2 className="font-display text-xl font-bold tracking-tight">Email Intelligence Suite</h2></div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Email records, follow-ups, drafts and human-authorized dispatch.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] text-zinc-700 font-semibold"><ShieldCheck size={14} /> Approval required before sending</div>
          <button type="button" onClick={() => { setShowAdd(value => !value); setFormError(''); }} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-800">{showAdd ? <X size={14} /> : <Plus size={14} />}{showAdd ? 'Close form' : 'Add email record'}</button>
        </div>
      </header>

      {showAdd && <form onSubmit={handleAddEmail} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 space-y-4">
        <div><h3 className="text-sm font-bold">Create email record</h3><p className="mt-0.5 text-xs text-zinc-500">Manually log an email or draft. This does not connect an inbox or send anything.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <label><span className={labelClass}>From *</span><input className={inputClass} value={form.from} onChange={e => setForm(v => ({ ...v, from: e.target.value }))} placeholder="sender@example.com" /></label>
          <label><span className={labelClass}>To *</span><input className={inputClass} value={form.to} onChange={e => setForm(v => ({ ...v, to: e.target.value }))} placeholder="recipient@example.com" /></label>
          <label className="sm:col-span-2"><span className={labelClass}>Subject *</span><input className={inputClass} value={form.subject} onChange={e => setForm(v => ({ ...v, subject: e.target.value }))} placeholder="Email subject" /></label>
          <label><span className={labelClass}>Category</span><select className={inputClass} value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value as Category }))}>{CATEGORIES.filter(c => c.id !== 'ALL').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label><span className={labelClass}>Status</span><select className={inputClass} value={form.status} onChange={e => setForm(v => ({ ...v, status: e.target.value as Status }))}>{STATUSES.filter(s => s.id !== 'ALL').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
          <label><span className={labelClass}>Date</span><input type="date" className={inputClass} value={form.date} onChange={e => setForm(v => ({ ...v, date: e.target.value }))} /></label>
          <label className="sm:col-span-2"><span className={labelClass}>Short preview</span><input className={inputClass} value={form.snippet} onChange={e => setForm(v => ({ ...v, snippet: e.target.value }))} placeholder="Optional preview shown in the list" /></label>
        </div>
        <label className="block"><span className={labelClass}>Message body *</span><textarea rows={4} className={inputClass} value={form.body} onChange={e => setForm(v => ({ ...v, body: e.target.value }))} placeholder="Paste or write the email content…" /></label>
        <label className="block"><span className={labelClass}>Internal notes / AI summary</span><textarea rows={2} className={inputClass} value={form.aiSummary} onChange={e => setForm(v => ({ ...v, aiSummary: e.target.value }))} placeholder="Optional notes. Keep unverified conclusions out." /></label>
        {formError && <p role="alert" className="text-xs font-medium text-red-600">{formError}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowAdd(false)} className="rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700">Cancel</button><button type="submit" className="rounded-full bg-black px-5 py-2.5 text-xs font-bold text-white hover:bg-zinc-800">Save email record</button></div>
      </form>}

      <section className="rounded-2xl border border-zinc-200 bg-white p-3 sm:p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-700"><Filter size={14} /> Search & filters <span className="ml-auto font-medium normal-case tracking-normal text-zinc-400">{filteredEmails.length} of {emails.length} records</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)] gap-2.5">
          <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sender, recipient, subject or content…" className={inputClass + ' pl-9'} /></div>
          <div className="relative"><select aria-label="Filter by category" value={category} onChange={e => setCategory(e.target.value as Category | 'ALL')} className={inputClass + ' appearance-none pr-9'}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" /></div>
          <div className="relative"><select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value as Status | 'ALL')} className={inputClass + ' appearance-none pr-9'}>{STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" /></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[480px]">
        <section className="lg:col-span-5 min-w-0 space-y-2.5">
          <div className="flex items-center justify-between px-1"><h3 className="text-xs font-bold">EMAIL RECORDS</h3><span className="text-[10px] text-zinc-400">{filteredEmails.length} shown</span></div>
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredEmails.length ? filteredEmails.map(email => <button key={email.id} type="button" onClick={() => { setSelectedId(email.id); setApprovalStage('DRAFT_READY'); setDispatchMessage(''); setReplyDraft(''); playCyberSound('click'); }} className={'w-full text-left p-3.5 rounded-2xl border transition-all ' + (selectedId === email.id ? 'bg-zinc-50 border-black shadow-xs' : 'bg-white border-zinc-200 hover:border-zinc-400')}>
              <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-500 mb-1"><span className="font-semibold text-zinc-900 truncate">{email.from}</span><span className="shrink-0">{email.date}</span></div>
              <h4 className="text-xs font-bold text-zinc-900 truncate">{email.subject}</h4><p className="text-[11px] text-zinc-600 line-clamp-2 mt-1">{email.snippet || email.body}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-semibold text-zinc-600">{email.category.replace('_', ' ')}</span><span className="rounded-full border border-zinc-200 px-2 py-1 text-[9px] font-semibold text-zinc-500">{email.status.replace('_', ' ')}</span>{email.detectedOpportunity && <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700"><Sparkles size={10} /> Opportunity flagged</span>}</div>
            </button>) : <div className="p-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center"><Inbox size={26} className="text-zinc-300 mx-auto mb-2" /><p className="text-xs font-semibold text-zinc-700">{emails.length ? 'No matching email records' : 'No email records yet'}</p><p className="text-[11px] text-zinc-500 mt-1">{emails.length ? 'Change the search or filters to see other records.' : 'Add a record manually to start building your email workspace.'}</p>{!emails.length && <button type="button" onClick={() => setShowAdd(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-black px-3.5 py-2 text-[11px] font-bold text-white"><Plus size={12} /> Add first record</button>}</div>}
          </div>
        </section>

        <section className="lg:col-span-7 min-w-0">
          {selectedEmail ? <div className="rounded-2xl bg-white border border-zinc-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="border-b border-zinc-200 pb-3"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2"><h3 className="font-display text-base font-bold break-words">{selectedEmail.subject}</h3><span className="w-fit text-[10px] px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold">{selectedEmail.date}</span></div><div className="text-xs text-zinc-500 mt-2">From: <span className="text-zinc-900 font-semibold">{selectedEmail.from}</span></div><div className="text-xs text-zinc-500 mt-1">To: <span className="text-zinc-900 font-semibold">{selectedEmail.to}</span></div></div>
            {selectedEmail.aiSummary && <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1"><div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={12} /> Internal notes / thread summary</div><p className="text-zinc-700 leading-snug">{selectedEmail.aiSummary}</p></div>}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">{selectedEmail.body}</div>
            <div className="pt-2 space-y-3">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Send size={13} /> Response terminal</span><div className="flex flex-wrap items-center gap-1 text-[9px] font-bold"><span className={'px-2 py-1 rounded-full ' + (approvalStage === 'DRAFT_READY' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500')}>1. Draft</span><span className="text-zinc-300">›</span><span className={'px-2 py-1 rounded-full ' + (approvalStage === 'REVIEW' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-500')}>2. Review</span><span className="text-zinc-300">›</span><span className={'px-2 py-1 rounded-full ' + (approvalStage === 'APPROVED' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500')}>3. Approve</span><span className="text-zinc-300">›</span><span className={'px-2 py-1 rounded-full ' + (approvalStage === 'SENT' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500')}>4. Sent</span></div></div>
              <textarea rows={4} placeholder="Write the reply you want to send…" value={replyDraft} onChange={e => setReplyDraft(e.target.value)} className={inputClass + ' text-xs leading-relaxed'} />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1"><button type="button" onClick={() => { setApprovalStage('DRAFT_READY'); setDispatchMessage(''); }} className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 font-medium"><RotateCcw size={10} /> Reset gate</button><div className="flex flex-wrap items-center gap-2">
                {approvalStage === 'DRAFT_READY' && <button type="button" onClick={handleAdvanceApproval} className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5"><Eye size={13} /> Move to review</button>}
                {approvalStage === 'REVIEW' && <button type="button" onClick={handleAdvanceApproval} className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"><Check size={13} /> Approve draft</button>}
                {approvalStage === 'APPROVED' && <button type="button" onClick={handleSend} className="px-4 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5"><Send size={13} /> Send email</button>}
                {approvalStage === 'SENT' && <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold">Provider accepted</span>}
              </div></div>
              {dispatchMessage && <p role="status" className="text-xs text-zinc-600">{dispatchMessage}</p>}
            </div>
          </div> : <div className="h-full min-h-[420px] p-10 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center"><div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mb-3"><Mail size={22} className="text-zinc-500" /></div><h4 className="font-display text-sm font-bold text-zinc-800">Email workspace ready</h4><p className="text-xs text-zinc-500 max-w-sm mt-1">Select an email record to inspect it, or add your first record.</p><button type="button" onClick={() => setShowAdd(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-xs font-bold text-white"><Plus size={13} /> Add email record</button></div>}
        </section>
      </div>
    </div>
  );
};
