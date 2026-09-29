import React, { useState } from 'react';
import { 
  Send, 
  Instagram, 
  Mail, 
  Linkedin, 
  MessageSquare, 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw,
  Zap,
  Globe,
  Phone
} from 'lucide-react';
import { Lead } from '../../types';
import { playCyberSound } from '../../utils/audio';

interface OutreachViewProps {
  leads: Lead[];
  initialLead?: Lead | null;
}

type OutreachChannel = 'INSTAGRAM' | 'EMAIL' | 'LINKEDIN' | 'WHATSAPP';
type OutreachStage = 'IDENTIFY' | 'ENGAGE' | 'CONVERSATION' | 'PROBLEM_ID' | 'SOFT_PITCH' | 'RISK_REMOVAL' | 'FOLLOW_UP';

const STAGES: { id: OutreachStage; label: string; desc: string }[] = [
  { id: 'IDENTIFY', label: '1. Identify', desc: 'Pinpoint friction on digital presence.' },
  { id: 'ENGAGE', label: '2. Engage', desc: 'Interact with content authentically first.' },
  { id: 'CONVERSATION', label: '3. Conversate', desc: 'Open low-friction dialogue with a genuine compliment.' },
  { id: 'PROBLEM_ID', label: '4. Problem ID', desc: 'Highlight the bottleneck costing them inquiries.' },
  { id: 'SOFT_PITCH', label: '5. Skeem Preview', desc: 'Offer a free 45-sec concept preview (Zero pitch pressure).' },
  { id: 'RISK_REMOVAL', label: '6. Risk Removal', desc: 'Reiterate zero obligation: "Thought it would be helpful."' },
  { id: 'FOLLOW_UP', label: '7. Follow-Up', desc: 'Gentle value-added check-in 48 hours later.' }
];

export const OutreachView: React.FC<OutreachViewProps> = ({ leads, initialLead }) => {
  const [activeChannel, setActiveChannel] = useState<OutreachChannel>('INSTAGRAM');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || leads[0]?.id || '');
  const [selectedStage, setSelectedStage] = useState<OutreachStage>('SOFT_PITCH');
  const [includeSkeem, setIncludeSkeem] = useState(true);
  const [customDraft, setCustomDraft] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleGenerateCopy = () => {
    if (!currentLead) { setCustomDraft('NO DATA — select a real lead before generating outreach.'); return; }
    setIsGenerating(true);
    playCyberSound('blip');

    setTimeout(() => {
      let copy = '';
      const bizName = currentLead.business;
      const contact = currentLead?.contactPerson || 'there';
      const problem = currentLead?.problem && currentLead.problem !== 'UNKNOWN' ? currentLead.problem : 'the verified issue in your lead record';

      if (activeChannel === 'INSTAGRAM') {
        if (selectedStage === 'SOFT_PITCH' || selectedStage === 'RISK_REMOVAL') {
          copy = `Hey ${contact}! Love the consistency on your latest posts.

Noticed one quick bottleneck on your profile link—mobile visitors have to manually email to get quotes, based on the verified issue in the lead record.

I can share a concept preview if one has actually been prepared for ${bizName}.

Zero obligation at all, just thought it'd be super valuable for your team. Want me to drop the preview link here?`;
        } else if (selectedStage === 'CONVERSATION') {
          copy = `Hey ${contact}, quick question—who handles your digital lead dispatch at ${bizName}? Saw your recent update and wanted to share a quick observation regarding mobile conversions.`;
        } else {
          copy = `Hey ${contact}! Just checking in on that live preview link I sent for ${bizName}. No rush at all—let me know if you want me to tweak the quote calculator logic for your team!`;
        }
      } else if (activeChannel === 'EMAIL') {
        copy = `Subject: Quick idea for ${bizName}'s mobile conversion flow

Hi ${contact},

Hope you're having a productive week.

While reviewing local businesses in ${currentLead?.location || 'the area'}, I noticed ${bizName}'s current digital setup has a slight bottleneck: ${problem}.

Rather than sending a generic sales deck, I built a lightweight, interactive live preview showing how ${bizName} can capture and qualify inbound leads automatically:
[VERIFIED PREVIEW URL — add only if one exists]

Zero sales pitch or obligation—just wanted to put something tangible in front of you.

Would love to know your thoughts on whether this could save your team time.

Best regards,
Nate
Coalesce Digital // Digital Systems Specialist`;
      } else if (activeChannel === 'LINKEDIN') {
        copy = `Hi ${contact}, noticed your team at ${bizName} is scaling operations in ${currentLead?.industry || 'your sector'}. 

I specialize in building automated digital intake systems for growing businesses. I can prepare a short concept preview based on the verified issue in the lead record.

Happy to share the preview link if you're open to taking a 30-second look. Zero pressure either way!`;
      } else {
        // WhatsApp
        copy = `Hi ${contact}, Nate here from Coalesce Digital.

Quick note regarding ${bizName}: I put together a working WhatsApp booking & quote prototype specifically tailored for your services.

[VERIFIED PREVIEW URL — add only if one exists]

Feel free to test the bot flow and let me know if it solves the after-hours inquiry problem!`;
      }

      setCustomDraft(copy);
      setIsGenerating(false);
      playCyberSound('response');
    }, 300);
  };

  const handleCopy = () => {
    if (!customDraft) return;
    navigator.clipboard.writeText(customDraft);
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
              <Send size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              Outreach Workspace // Skeem Method
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Philosophy: Never hard pitch cold. Deliver free concept previews to create high-trust conversations.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 font-semibold">
          <ShieldCheck size={14} className="text-zinc-900" />
          <span>High-Trust Conversion Model</span>
        </div>
      </div>

      {/* Channel Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'INSTAGRAM', label: 'Instagram DM', icon: Instagram },
          { id: 'EMAIL', label: 'Direct Email', icon: Mail },
          { id: 'LINKEDIN', label: 'LinkedIn InMail', icon: Linkedin },
          { id: 'WHATSAPP', label: 'WhatsApp Direct', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeChannel === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                playCyberSound('click');
                setActiveChannel(tab.id as OutreachChannel);
              }}
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-black border-black text-white shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progression Stages */}
      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
        <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2.5 flex items-center justify-between">
          <span>Outreach Lifecycle Progression</span>
          <span className="text-zinc-900 font-medium">Click to select stage</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                playCyberSound('click');
                setSelectedStage(s.id);
              }}
              className={`p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                selectedStage === s.id
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <div className="text-[11px] font-bold tracking-tight">{s.label}</div>
              <div className={`text-[9px] line-clamp-2 mt-0.5 ${selectedStage === s.id ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Config Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Target Prospect Selection
            </h3>

            <div>
              <label className="block text-[10px] text-zinc-400 mb-1 font-semibold uppercase">SELECT LEAD FROM PIPELINE</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-medium"
              >
                {leads.length > 0 ? (
                  leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.business} (Score: {l.leadScore}/100)
                    </option>
                  ))
                ) : (
                  <option value="">[Default Prospect Template - Standby Mode]</option>
                )}
              </select>
            </div>

            {currentLead ? (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-xs">
                <div className="text-zinc-900 font-bold text-sm">{currentLead.business}</div>
                <div className="text-[11px] text-zinc-600"><span className="font-semibold text-zinc-800">Contact:</span> {currentLead.contactPerson || 'Executive'} ({currentLead.email || currentLead.phone || 'Contact listed'})</div>
                <div className="text-[11px] text-zinc-600"><span className="font-semibold text-zinc-800">Problem:</span> {currentLead.problem}</div>
                <div className="text-[11px] text-emerald-700 font-medium"><span className="font-semibold text-zinc-800">Service:</span> {currentLead.potentialService}</div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 space-y-1 text-xs text-zinc-500 text-center">
                <span className="font-semibold text-zinc-700 block">Default Template Mode</span>
                <span className="text-[11px]">Generate high-converting copy using the Skeem method, or qualify a prospect in Business Development to autofill custom pain points.</span>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 font-medium">
                <input
                  type="checkbox"
                  checked={includeSkeem}
                  onChange={(e) => setIncludeSkeem(e.target.checked)}
                  className="rounded border-zinc-300 text-black focus:ring-0"
                />
                <span>Include "Skeem" Live Prototype Hook</span>
              </label>
            </div>

            <button
              onClick={handleGenerateCopy}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold tracking-wider shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Synthesizing Copy...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate {activeChannel} Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Output Editor */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-white border border-zinc-200 p-5 relative shadow-xs flex flex-col justify-between min-h-[380px]">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900">
                    {activeChannel} Outreach Draft &bull; {selectedStage}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 font-semibold">
                    Skeem Ready
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!customDraft}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-800 transition-colors disabled:opacity-30 cursor-pointer font-semibold"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              {customDraft ? (
                <textarea
                  rows={10}
                  value={customDraft}
                  onChange={(e) => setCustomDraft(e.target.value)}
                  className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-900 leading-relaxed focus:outline-none focus:border-zinc-400 resize-none font-sans"
                />
              ) : (
                <div className="p-8 text-center text-zinc-400 text-xs flex flex-col items-center justify-center h-48 space-y-2">
                  <Sparkles size={24} className="text-zinc-300 mb-1" />
                  <p className="text-zinc-600 font-medium">Click "Generate {activeChannel} Copy" to construct personalized outreach.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
              <span className="text-emerald-700 font-medium">
                &bull; Moses Standard: Max 1 concept preview link. Zero sales pressure.
              </span>
              <span>Channel: {activeChannel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
