import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Play, 
  Pause, 
  GitBranch, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Smartphone,
  PhoneCall,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { WhatsAppFlow } from '../../types';
import { INITIAL_WHATSAPP_FLOWS } from '../../data/initialData';
import { playCyberSound } from '../../utils/audio';

export const WhatsAppView: React.FC = () => {
  const [flows, setFlows] = useState<WhatsAppFlow[]>(INITIAL_WHATSAPP_FLOWS);
  const [simMessages, setSimMessages] = useState<{ sender: 'BOT' | 'USER'; text: string; time: string }[]>([
    { sender: 'USER', text: 'Hi, I need help with our clinic booking site.', time: '10:02' },
    { sender: 'BOT', text: 'Hey there! 👋 Welcome to Coalesce Digital intake. What is the biggest challenge with your current setup?', time: '10:02' },
    { sender: 'USER', text: 'We lose clients after hours because nobody is answering phone calls.', time: '10:03' },
    { sender: 'BOT', text: 'Got it. A 24/7 WhatsApp AI receptionist handles booking and deposits automatically. Would you like a 30-sec live demo for your clinic?', time: '10:03' }
  ]);
  const [testInput, setTestInput] = useState('');
  const [activeTab, setActiveTab] = useState<'FLOWS' | 'SIMULATOR' | 'HANDOFFS' | 'WEBHOOK_CONFIG'>('SIMULATOR');

  const handleSendSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const userMsg = testInput;
    setSimMessages(prev => [...prev, { sender: 'USER', text: userMsg, time: 'Now' }]);
    setTestInput('');
    playCyberSound('click');

    // Bot automatic response simulation
    setTimeout(() => {
      let botReply = "Understood. That matches our high-impact AI Automation system. Let's schedule a 10-minute walkthrough with Nate.";
      if (userMsg.toLowerCase().includes('price') || userMsg.toLowerCase().includes('cost')) {
        botReply = "Our systems start with a low-friction setup + monthly optimization retainer. Let me connect you directly with Nate for an exact spec.";
      }
      setSimMessages(prev => [...prev, { sender: 'BOT', text: botReply, time: 'Now' }]);
      playCyberSound('response');
    }, 500);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-7xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <MessageSquare size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              WhatsApp Automation Hub
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Conversational Lead Intake &bull; Automated Qualification &bull; Human Handoff Gateway
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Simulation Mode &bull; Cloud API Ready</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'SIMULATOR', label: 'Conversation Simulator' },
          { id: 'FLOWS', label: 'Qualification Flow Builder' },
          { id: 'HANDOFFS', label: 'Human Escalations & Handoffs' },
          { id: 'WEBHOOK_CONFIG', label: 'Cloud API Webhook Architecture' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              playCyberSound('click');
              setActiveTab(tab.id as any);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-black text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'SIMULATOR' && (
        <div className="p-8 rounded-3xl bg-zinc-50 border border-dashed border-zinc-300 text-center">
          <AlertCircle size={24} className="mx-auto text-zinc-500 mb-3" />
          <h3 className="text-sm font-bold text-zinc-900">Conversation Simulator Disabled</h3>
          <p className="text-xs text-zinc-500 max-w-lg mx-auto mt-2">
            MOSES does not fabricate WhatsApp conversations. Connect Meta WhatsApp Cloud API or an n8n webhook before live conversations can appear here.
          </p>
        </div>
      )}

      {/* Flows Tab */}
      {activeTab === 'FLOWS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flows.map((f) => (
            <div key={f.id} className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">{f.name}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-bold">
                  {f.status}
                </span>
              </div>
              <p className="text-xs text-zinc-600">{f.description}</p>
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                <span>Trigger: <strong className="text-zinc-800">{f.trigger}</strong></span>
                <span className="text-zinc-900 font-semibold">{f.totalLeadsQualified} Leads Qualified</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Handoffs Tab */}
      {activeTab === 'HANDOFFS' && (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Human Specialist Escalation Queue
          </h3>
          <p className="text-xs text-zinc-600">
            When a prospect finishes the automated qualifying questions, Moses triggers a webhook to ping Nate's phone.
          </p>
          <div className="p-6 rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-center text-xs text-zinc-500">
            NO DATA — no verified WhatsApp handoffs have been received.
          </div>
        </div>
      )}

      {/* Webhook Config Tab */}
      {activeTab === 'WEBHOOK_CONFIG' && (
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            WhatsApp Cloud API / n8n Webhook Endpoint
          </h3>
          <p className="text-zinc-600">
            Copy this endpoint into your Meta Developer Dashboard or n8n workflow once live webhook credentials are provisioned.
          </p>
          <div className="p-3.5 rounded-xl bg-zinc-100 border border-dashed border-zinc-200 text-zinc-500 font-mono text-xs">
            NOT CONFIGURED — set a real Meta/n8n webhook endpoint and verification secret in deployment configuration.
          </div>
        </div>
      )}
    </div>
  );
};
