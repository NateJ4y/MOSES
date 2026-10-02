'use client';

import React, { useEffect, useState } from 'react';
import { Cpu, Database, Network, ShieldCheck, Sparkles } from 'lucide-react';

interface BootSequenceProps { onComplete: () => void; }

const BOOT_STEPS = [
  { label: 'INITIALIZING MOSES CORE', icon: Cpu },
  { label: 'LOADING OPERATING CONTEXT', icon: Database },
  { label: 'ESTABLISHING SYSTEM LINK', icon: Network },
  { label: 'VERIFYING OS INTEGRITY', icon: ShieldCheck },
  { label: 'INTELLIGENCE LAYER ONLINE', icon: Sparkles },
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const duration = 2600;
    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - started;
      const eased = Math.min(elapsed / duration, 1);
      const nextProgress = Math.round((1 - Math.pow(1 - eased, 3)) * 100);
      setProgress(nextProgress);
      setStepIndex(Math.min(BOOT_STEPS.length - 1, Math.floor((nextProgress / 100) * BOOT_STEPS.length)));
      if (eased < 1) frame = requestAnimationFrame(tick);
      else window.setTimeout(onComplete, 220);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  const StepIcon = BOOT_STEPS[stepIndex].icon;

  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center overflow-hidden bg-white text-zinc-900" role="status" aria-label="MOSES operating system booting">
      <div className="absolute inset-0 bg-radial-grid" />
      <div className="absolute left-1/2 top-1/2 h-[min(70vw,560px)] w-[min(70vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/70" />
      <div className="absolute left-1/2 top-1/2 h-[min(52vw,420px)] w-[min(52vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/50" />
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 sm:px-8">
        <div className="relative mb-10 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          <div className="absolute inset-0 rounded-full border border-zinc-300/80 animate-pulse-ring" />
          <div className="absolute inset-4 rounded-full border border-zinc-200" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-zinc-900 border-r-zinc-400 transition-transform duration-150" style={{ transform: `rotate(${progress * 3.6}deg)` }} />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-black text-white shadow-[0_0_70px_rgba(0,0,0,0.12)] sm:h-28 sm:w-28">
            <span className="font-display text-4xl font-extrabold tracking-[0.18em]">M</span>
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-black" />
          </div>
          <div className="absolute inset-0 animate-[spin_7s_linear_infinite]"><span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-900" /></div>
        </div>
        <div className="text-center">
          <div className="mb-2 font-display text-xl font-bold tracking-[0.24em] text-zinc-950 sm:text-2xl">MOSES</div>
          <div className="font-mono-tech text-[9px] font-medium uppercase tracking-[0.28em] text-zinc-400 sm:text-[10px]">COALESCE OPERATING SYSTEM</div>
        </div>
        <div className="mt-10 w-full max-w-md">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2 text-[9px] font-semibold tracking-[0.14em] text-zinc-500"><StepIcon size={12} strokeWidth={1.7} className="shrink-0 text-zinc-900" /><span className="truncate">{BOOT_STEPS[stepIndex].label}</span></div>
            <span className="shrink-0 font-mono-tech text-[10px] font-semibold text-zinc-900">{String(progress).padStart(3, '0')}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-zinc-900 transition-[width] duration-100 ease-linear" style={{ width: `${progress}%` }} /></div>
          <div className="mt-3 flex justify-between font-mono-tech text-[8px] uppercase tracking-[0.16em] text-zinc-300"><span>BOOT SEQUENCE</span><span>SECURE SESSION</span></div>
        </div>
        <div className="mt-8 flex items-center gap-2 font-mono-tech text-[8px] uppercase tracking-[0.2em] text-zinc-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />System preparing</div>
      </div>
    </div>
  );
}