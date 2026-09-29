import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Cpu, 
  Sparkles,
  Volume2,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { playCyberSound } from '../../utils/audio';
import { speakText } from '../../utils/speech';

interface CommandFeedViewProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isProcessing: boolean;
  isListening: boolean;
  onToggleVoice: () => void;
  transcript: string;
}

export const CommandFeedView: React.FC<CommandFeedViewProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  isListening,
  onToggleVoice,
  transcript
}) => {
  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    if (transcript) {
      setInputVal(transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isProcessing) return;
    playCyberSound('send');
    onSendMessage(inputVal);
    setInputVal('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playCyberSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    playCyberSound('click');
    speakText(text, true);
  };

  const quickPrompts = [
    "Find high-probability prospects in my area.",
    "Draft a Skeem concept preview outreach message.",
    "Show me how to automate lead qualification on WhatsApp.",
    "Check solo developer bandwidth and pricing baselines."
  ];

  return (
    <div className="h-full flex flex-col justify-between p-4 sm:p-8 max-w-5xl mx-auto font-sans bg-white text-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
            <Terminal size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-zinc-900">
              Moses Command Stream
            </h2>
            <p className="text-xs text-zinc-500 font-normal">Direct conversational reasoning &amp; execution</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-zinc-600 font-medium">Conversational Engine Online</span>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin">
        {messages.map((msg) => {
          const isMoses = msg.sender === 'MOSES';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMoses ? 'items-start' : 'items-end'}`}
            >
              {/* Sender & Timestamp Badge */}
              <div className="flex items-center gap-2 mb-1 px-1">
                {isMoses ? (
                  <>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black text-white text-[10px] font-bold">
                      <Bot size={11} />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 tracking-tight">
                      Moses AI
                    </span>
                    {msg.intent && (
                      <span className="text-[9px] px-2 py-0.2 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 uppercase font-semibold">
                        {msg.intent}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-xs font-bold text-zinc-800">You</span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-zinc-200 text-zinc-700">
                      <User size={11} />
                    </div>
                  </>
                )}
                <span className="text-[10px] text-zinc-400">{msg.timestamp}</span>
              </div>

              {/* Message Box */}
              <div
                className={`relative max-w-3xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isMoses
                    ? 'bg-zinc-50 border border-zinc-200 text-zinc-800 shadow-2xs'
                    : 'bg-black text-white shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Structured Breakdown if present */}
                {msg.structuredResponse && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2 text-xs">
                    {msg.structuredResponse.analysis && (
                      <div className="p-3 rounded-xl bg-white border border-zinc-200">
                        <div className="text-zinc-900 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                          Strategic Analysis
                        </div>
                        <p className="text-zinc-700">{msg.structuredResponse.analysis}</p>
                      </div>
                    )}

                    {msg.structuredResponse.plan && msg.structuredResponse.plan.length > 0 && (
                      <div className="p-3 rounded-xl bg-white border border-zinc-200">
                        <div className="text-zinc-900 font-bold text-[10px] uppercase tracking-wider mb-1">
                          Action Plan
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-700">
                          {msg.structuredResponse.plan.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.structuredResponse.action && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <div className="font-bold text-[10px] uppercase tracking-wider mb-0.5 text-emerald-900">
                          Immediate Next Move
                        </div>
                        <p>{msg.structuredResponse.action}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick actions for Moses replies */}
                {isMoses && (
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500">
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleSpeak(msg.text)}
                      className="hover:text-black flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Volume2 size={11} />
                      <span>Speak</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 max-w-md animate-pulse">
            <Cpu size={16} className="text-zinc-900 animate-spin" />
            <span className="text-xs font-medium">Moses is synthesizing response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Bar & Input */}
      <div className="mt-4 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-[11px]">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold shrink-0">SUGGESTIONS:</span>
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => {
                playCyberSound('click');
                onSendMessage(qp);
              }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 hover:text-black transition-all text-xs flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Zap size={10} className="text-zinc-500" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center rounded-2xl bg-white border border-zinc-300 p-1.5 shadow-2xs focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all"
        >
          <div className="pl-3 pr-2 text-zinc-400">
            <Terminal size={17} />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isListening ? "Listening to your voice command..." : "Ask Moses anything or type a directive..."}
            className="flex-1 bg-transparent py-2.5 px-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none font-medium"
          />

          <div className="flex items-center gap-1.5 pr-1">
            <button
              type="button"
              onClick={() => {
                playCyberSound('click');
                onToggleVoice();
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 animate-pulse'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'
              }`}
              title="Voice Input"
            >
              {isListening ? <Mic size={15} /> : <MicOff size={15} />}
            </button>

            <button
              type="submit"
              disabled={!inputVal.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-black hover:bg-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
