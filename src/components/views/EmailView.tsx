import React, { useState } from 'react';
import { 
  Mail, 
  Inbox, 
  Send, 
  Clock, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Eye,
  Check,
  RotateCcw
} from 'lucide-react';
import { EmailMessage } from '../../types';
import { INITIAL_EMAILS } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';

interface EmailViewProps {
  emails?: EmailMessage[];
  onUpdateEmails?: (emails: EmailMessage[]) => void;
}

export const EmailView: React.FC<EmailViewProps> = ({
  emails: externalEmails,
  onUpdateEmails
}) => {
  const [internalEmails, setInternalEmails] = useState<EmailMessage[]>(INITIAL_EMAILS);
  const emails = externalEmails !== undefined ? externalEmails : internalEmails;
  const setEmails = (updater: (prev: EmailMessage[]) => EmailMessage[]) => {
    if (externalEmails !== undefined && onUpdateEmails) {
      onUpdateEmails(updater(externalEmails));
    } else {
      setInternalEmails(updater);
    }
  };

  const [currentCategory, setCurrentCategory] = useState<EmailMessage['category']>('LEADS');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(emails[0] || null);
  const [replyDraft, setReplyDraft] = useState<string>('');
  const [approvalStage, setApprovalStage] = useState<'DRAFT_READY' | 'REVIEW' | 'APPROVED' | 'SENT'>('DRAFT_READY');

  const filteredEmails = emails.filter(e => currentCategory === 'INBOX' ? true : e.category === currentCategory);

  const handleAdvanceApproval = () => {
    playCyberSound('click');
    if (!selectedEmail) return;
    if (approvalStage === 'DRAFT_READY') {
      setApprovalStage('REVIEW');
    } else if (approvalStage === 'REVIEW') {
      setApprovalStage('APPROVED');
      playCyberSound('response');
    } else if (approvalStage === 'APPROVED') {
      // V1 has no live mail provider. Approval is terminal until one is connected.
      playCyberSound('click');
    }
  };

  const handleResetApproval = () => {
    playCyberSound('click');
    setApprovalStage('DRAFT_READY');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Mail size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Email Intelligence Suite
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            AI Opportunity Detection &bull; Human-Authorized Dispatch Gateway
          </p>
        </div>

        {/* Security Approval Gate Protocol Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <ShieldCheck size={14} className="text-zinc-900" />
          <span>Approval Gate: Draft &rarr; Review &rarr; Approve &rarr; Send</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'LEADS', label: 'Leads & Opportunities', count: emails.filter(e => e.category === 'LEADS').length },
          { id: 'INBOX', label: 'All Inbox', count: emails.length },
          { id: 'FOLLOW_UPS', label: 'Follow-ups', count: emails.filter(e => e.category === 'FOLLOW_UPS').length },
          { id: 'CAMPAIGNS', label: 'Campaigns', count: emails.filter(e => e.category === 'CAMPAIGNS').length },
          { id: 'DRAFTS', label: 'Drafts', count: emails.filter(e => e.category === 'DRAFTS').length },
          { id: 'SENT', label: 'Sent Archive', count: emails.filter(e => e.category === 'SENT').length }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              playCyberSound('click');
              setCurrentCategory(cat.id as any);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              currentCategory === cat.id
                ? 'bg-black text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            <span>{cat.label}</span>
            {cat.count > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${currentCategory === cat.id ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                {cat.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Grid: Email Thread List & Inspector / Approval Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left: Email Threads */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="text-xs font-bold text-zinc-900 px-1">
            CONVERSATION INTAKE
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      playCyberSound('click');
                      setSelectedEmail(email);
                      setApprovalStage('DRAFT_READY');
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-50 border-black shadow-xs'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                      <span className="font-semibold text-zinc-900 truncate max-w-[180px]">{email.from}</span>
                      <span>{email.date}</span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 truncate">{email.subject}</h4>
                    <p className="text-[11px] text-zinc-600 line-clamp-2 mt-1">{email.snippet}</p>

                    {email.detectedOpportunity && (
                      <div className="mt-2 pt-1.5 border-t border-zinc-100 text-[9px] text-emerald-700 flex items-center gap-1 font-semibold">
                        <Sparkles size={10} />
                        <span>Opportunity: High conversion probability</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center">
                <Inbox size={26} className="text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700">Inbox is empty</p>
                <p className="text-[11px] text-zinc-400 mt-1">Default mode active. Zero unprocessed email dispatches.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Email Detail & Authorized Dispatch Gate */}
        <div className="lg:col-span-7">
          {selectedEmail ? (
            <div className="rounded-2xl bg-white border border-zinc-200 p-5 relative shadow-xs space-y-4">
              {/* Message Header */}
              <div className="border-b border-zinc-200 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-bold text-zinc-900">
                    {selectedEmail.subject}
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold">
                    {selectedEmail.date}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  From: <span className="text-zinc-900 font-semibold">{selectedEmail.from}</span>
                </div>
              </div>

              {/* AI Opportunity Breakdown */}
              {selectedEmail.aiSummary && (
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-zinc-600" />
                    Moses Thread Synthesis &amp; Opportunity Detection
                  </div>
                  <p className="text-zinc-700 leading-snug">{selectedEmail.aiSummary}</p>
                </div>
              )}

              {/* Original Message Body */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto font-sans">
                {selectedEmail.body}
              </div>

              {/* Security Gated Dispatch Station */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Send size={13} />
                    Response Terminal (Gated Authorization)
                  </span>

                  {/* 4-Step Visual Progress */}
                  <div className="flex items-center gap-1 text-[9px] font-bold">
                    <span className={`px-2 py-0.5 rounded-full ${approvalStage === 'DRAFT_READY' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>1. Draft</span>
                    <span className="text-zinc-300">&rsaquo;</span>
                    <span className={`px-2 py-0.5 rounded-full ${approvalStage === 'REVIEW' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>2. Review</span>
                    <span className="text-zinc-300">&rsaquo;</span>
                    <span className={`px-2 py-0.5 rounded-full ${approvalStage === 'APPROVED' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>3. Approve</span>
                    <span className="text-zinc-300">&rsaquo;</span>
                    <span className={`px-2 py-0.5 rounded-full ${approvalStage === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>4. Sent</span>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 leading-relaxed focus:outline-none focus:border-zinc-400 font-sans"
                />

                {/* Gate Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleResetApproval}
                    className="text-[10px] text-zinc-400 hover:text-zinc-900 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw size={10} />
                    <span>Reset Gate</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {approvalStage === 'DRAFT_READY' && (
                      <button
                        onClick={handleAdvanceApproval}
                        className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Move to Review Stage</span>
                      </button>
                    )}

                    {approvalStage === 'REVIEW' && (
                      <button
                        onClick={handleAdvanceApproval}
                        className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve Draft Content</span>
                      </button>
                    )}

                    {approvalStage === 'APPROVED' && (
                      <button
                        onClick={handleAdvanceApproval}
                        className="px-4 py-2 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send size={13} />
                        <span>Authorized: Approve Draft Now</span>
                      </button>
                    )}

                    {approvalStage === 'SENT' && (
                      <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                        <Check size={14} />
                        <span>Dispatched to Recipient</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 shadow-2xs flex items-center justify-center mb-3">
                <Mail size={22} className="text-zinc-500" />
              </div>
              <h4 className="font-display text-sm font-bold text-zinc-800">Email Gateway Standby</h4>
              <p className="text-xs text-zinc-500 max-w-sm mt-1 leading-relaxed">
                All email records have been wiped. Incoming inquiries will automatically queue here with AI analysis and human authorization gates.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
