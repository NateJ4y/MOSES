import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Volume2, 
  VolumeX, 
  Mic, 
  Cpu, 
  GitBranch, 
  Trash2, 
  Save, 
  Check, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Database,
  RotateCcw
} from 'lucide-react';
import { playCyberSound } from '../../utils/audio';

interface SettingsViewProps {
  onWipeAllRecords?: () => void;
  onLoadSampleRecords?: () => void;
  leadsCount?: number;
  projectsCount?: number;
  emailsCount?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onWipeAllRecords,
  onLoadSampleRecords,
  leadsCount = 0,
  projectsCount = 0,
  emailsCount = 0
}) => {
  const [activeTheme, setActiveTheme] = useState<'MONOCHROME' | 'SLATE' | 'MINIMAL' | 'TITANIUM'>('MONOCHROME');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.coalescedigital.co.za/webhook/lead-intake');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleApplyTheme = (theme: typeof activeTheme) => {
    setActiveTheme(theme);
    playCyberSound('click');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    playCyberSound('response');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-8 max-w-5xl mx-auto font-sans overflow-y-auto scrollbar-thin space-y-6 bg-white text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Settings size={18} strokeWidth={1.75} />
            </div>
            <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
              System Configuration
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-normal">
            Aesthetic preferences, voice feedback &amp; webhook integrations
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-800 font-semibold">
          <ShieldCheck size={14} className="text-zinc-900" />
          <span>System Online</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Theme Engine */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={17} className="text-zinc-700" />
              <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Visual Theme Profile
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Luxury Minimalist</span>
          </div>

          <p className="text-xs text-zinc-600">
            Selected styling palette inspired by luxury, fashion, and technology leaders:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'MONOCHROME', name: 'Monochrome Black & White', color: 'bg-black' },
              { id: 'SLATE', name: 'Titanium Graphite', color: 'bg-zinc-700' },
              { id: 'MINIMAL', name: 'Pure White & Ivory', color: 'bg-zinc-200' },
              { id: 'TITANIUM', name: 'Refined Metallic', color: 'bg-zinc-400' }
            ].map((theme) => {
              const active = activeTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleApplyTheme(theme.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-black bg-zinc-50 shadow-xs ring-1 ring-black text-zinc-900'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${theme.color}`} />
                    <span className="text-xs font-bold text-zinc-900">{theme.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-medium">
                    {active ? '● Selected' : 'Choose'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Synthesizer Controls */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Volume2 size={17} className="text-zinc-700" />
            <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Audio Telemetry &amp; Voice Synthesis
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-900">Tactile Audio Feedback</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Interaction sounds for actions &amp; state transitions</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCyberSound('click');
                  setAudioEnabled(!audioEnabled);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  audioEnabled ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {audioEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-900">Voice Synthesis (Moses Output)</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Spoken strategic readouts via Web Speech API</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCyberSound('click');
                  setVoiceSpeechEnabled(!voiceSpeechEnabled);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  voiceSpeechEnabled ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'
                }`}
              >
                {voiceSpeechEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook & n8n Pipeline Integration */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch size={17} className="text-zinc-700" />
            <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Automation Webhook Gateway (n8n / CRM Ready)
            </h3>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-400 mb-1 font-semibold uppercase">
              INBOUND / OUTBOUND WEBHOOK DISPATCH URL
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-mono focus:outline-none focus:border-zinc-400"
            />
            <p className="text-[11px] text-zinc-500 mt-1.5">
              Moses triggers this webhook when a lead is qualified or when follow-ups are ready.
            </p>
          </div>
        </div>

        {/* Operating System Records & Factory Reset */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={17} className="text-zinc-700" />
              <h3 className="font-display text-sm font-bold text-zinc-900 uppercase tracking-wider">
                System Records &amp; Operating Mode
              </h3>
            </div>
            <span className="text-[10px] text-zinc-700 font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
              {leadsCount === 0 && projectsCount === 0 && emailsCount === 0 ? 'DEFAULT MODE' : 'CUSTOM DATA'}
            </span>
          </div>

          <p className="text-xs text-zinc-600">
            Control persistent OS records. Wipe all active pipelines, outreach drafts, client builds, and inbox items to return to a clean default state, or reload demo datasets.
          </p>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                <span>Database Records:</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-200 text-zinc-700 font-semibold">
                  {leadsCount} Leads &bull; {projectsCount} Builds &bull; {emailsCount} Emails
                </span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-1">
                {leadsCount === 0 && projectsCount === 0 && emailsCount === 0
                  ? 'The OS is currently in default clean mode with all records wiped.'
                  : 'Active CRM and operational records currently loaded in OS memory.'}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onLoadSampleRecords && (
                <button
                  type="button"
                  onClick={() => {
                    playCyberSound('click');
                    onLoadSampleRecords();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Load Demo Records</span>
                </button>
              )}

              {onWipeAllRecords && (
                <button
                  type="button"
                  onClick={() => {
                    playCyberSound('boot');
                    onWipeAllRecords();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Wipe All Records</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
              <Check size={14} />
              <span>Settings Saved Successfully</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-400">Coalesce OS Core Kernel v2.4</span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save size={14} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
