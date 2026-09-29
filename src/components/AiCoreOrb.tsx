import React from 'react';
import { motion } from 'motion/react';

interface AiCoreOrbProps {
  state: 'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING';
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
}

export const AiCoreOrb: React.FC<AiCoreOrbProps> = ({
  state,
  size = 'lg',
  interactive = true,
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64 sm:w-72 sm:h-72'
  }[size];

  const isListening = state === 'LISTENING';
  const isThinking = state === 'THINKING';
  const isResponding = state === 'RESPONDING';

  return (
    <div
      onClick={onClick}
      className={`relative ${sizeClasses} flex items-center justify-center select-none ${
        interactive ? 'cursor-pointer group' : ''
      }`}
    >
      {/* Ambient background glow */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.25, 1] : isResponding ? [1, 1.15, 1] : [1, 1.06, 1],
          opacity: isThinking ? [0.3, 0.6, 0.3] : isListening ? 0.5 : 0.25
        }}
        transition={{
          repeat: Infinity,
          duration: isThinking ? 1.2 : isListening ? 1.5 : 3.5,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-neutral-300/40 via-zinc-400/20 to-emerald-400/20 blur-2xl pointer-events-none"
      />

      {/* Main SVG AI Core Structure */}
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full relative z-10 filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      >
        <defs>
          <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#3f3f46" stopOpacity="0.8" />
            <stop offset="80%" stopColor="#71717a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="greenGlowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="purpleRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Telemetry Compass Ring */}
        <g className="opacity-40">
          <circle cx="150" cy="150" r="142" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          {/* Tick marks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const rad = (angle * Math.PI) / 180;
            const x1 = 150 + 138 * Math.cos(rad);
            const y1 = 150 + 138 * Math.sin(rad);
            const x2 = 150 + 144 * Math.cos(rad);
            const y2 = 150 + 144 * Math.sin(rad);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={i % 6 === 0 ? '#18181b' : 'rgba(0,0,0,0.2)'}
                strokeWidth={i % 6 === 0 ? '1.5' : '1'}
              />
            );
          })}
        </g>

        {/* Slow Rotating Segmented Outer Ring */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: isThinking ? 8 : 40,
            ease: 'linear'
          }}
          style={{ originX: '150px', originY: '150px' }}
        >
          <circle
            cx="150"
            cy="150"
            r="128"
            fill="none"
            stroke="url(#purpleRing)"
            strokeWidth="1.5"
            strokeDasharray="40 15 20 10 70 25"
            strokeOpacity={isListening ? '0.9' : '0.4'}
          />
        </motion.g>

        {/* Counter-Rotating Dashed Inner Track */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{
            repeat: Infinity,
            duration: isThinking ? 6 : 28,
            ease: 'linear'
          }}
          style={{ originX: '150px', originY: '150px' }}
        >
          <circle
            cx="150"
            cy="150"
            r="110"
            fill="none"
            stroke="#27272a"
            strokeWidth="1"
            strokeDasharray="8 8 16 12"
            strokeOpacity="0.3"
          />
          {/* Orbiting Telemetry Nodes */}
          <circle cx="150" cy="40" r="3" fill="#059669" />
          <circle cx="260" cy="150" r="2.5" fill="#18181b" />
          <circle cx="150" cy="260" r="2" fill="#71717a" />
        </motion.g>

        {/* Mid Optical Iris Ring */}
        <motion.g
          animate={{
            scale: isListening ? [0.95, 1.08, 0.95] : isResponding ? [0.98, 1.04, 0.98] : 1
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{ originX: '150px', originY: '150px' }}
        >
          <circle
            cx="150"
            cy="150"
            r="85"
            fill="none"
            stroke={isListening ? '#059669' : 'rgba(0,0,0,0.15)'}
            strokeWidth="1.5"
            strokeDasharray={isListening ? '12 6' : '6 6'}
          />
        </motion.g>

        {/* Waveform / Frequency Bars Activity */}
        <g transform="translate(150, 150)">
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 360) / 16;
            return (
              <motion.g key={i} transform={`rotate(${angle})`}>
                <motion.line
                  x1="60"
                  y1="0"
                  x2={isResponding || isListening ? 74 + (i % 4) * 5 : 68}
                  y2="0"
                  stroke={isListening ? '#059669' : isResponding ? '#18181b' : '#52525b'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={{
                    x2: isResponding || isListening ? [62, 78 + (i % 3) * 6, 64] : [65, 69, 65],
                    opacity: isResponding || isListening ? [0.6, 1, 0.6] : [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isResponding ? 0.4 + (i % 4) * 0.1 : 1.8,
                    delay: i * 0.05
                  }}
                />
              </motion.g>
            );
          })}
        </g>

        {/* Central Luminous Core / Iris */}
        <motion.circle
          cx="150"
          cy="150"
          r="46"
          fill="url(#coreGradient)"
          animate={{
            scale: isListening ? [1, 1.18, 1] : isResponding ? [1, 1.12, 1] : [1, 1.05, 1],
            opacity: isThinking ? [0.7, 1, 0.7] : [0.85, 1, 0.85]
          }}
          transition={{
            repeat: Infinity,
            duration: isThinking ? 0.8 : isListening ? 1.2 : 2.5,
            ease: 'easeInOut'
          }}
          style={{ originX: '150px', originY: '150px' }}
        />

        {/* Inner Micro Core */}
        <circle
          cx="150"
          cy="150"
          r="16"
          fill={isListening ? '#059669' : '#09090b'}
        />
        <circle cx="150" cy="150" r="6" fill="#ffffff" />
      </svg>

      {/* State Badge Tooltip Overlay */}
      <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-white/95 border border-zinc-200 text-[10px] font-sans tracking-wide uppercase text-zinc-800 flex items-center gap-1.5 shadow-md backdrop-blur-md font-semibold">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isListening
              ? 'bg-emerald-500 animate-ping'
              : isThinking
              ? 'bg-zinc-900 animate-pulse'
              : isResponding
              ? 'bg-emerald-500 animate-bounce'
              : 'bg-emerald-500'
          }`}
        />
        {state === 'IDLE' && 'MOSES // READY'}
        {state === 'LISTENING' && 'LISTENING...'}
        {state === 'THINKING' && 'PROCESSING...'}
        {state === 'RESPONDING' && 'SYNTHESIZING...'}
      </div>
    </div>
  );
};
