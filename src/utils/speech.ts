// Web Speech Recognition & Speech Synthesis Utility

export interface SpeechRecognitionResultState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
}

let recognitionInstance: any = null;
let recognitionActive = false;
let recognitionSession = 0;
let accumulatedFinalTranscript = '';

let activeCallbacks: {
  onResult: (text: string, isFinal: boolean) => void;
  onEnd: () => void;
  onError: (err: string) => void;
} | null = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

function launchRecognitionSession(session: number): boolean {
  if (!recognitionActive || !activeCallbacks || session !== recognitionSession) return false;

  try {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const instance = new SpeechRecognitionClass();
    recognitionInstance = instance;
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';

    instance.onresult = (event: any) => {
      if (session !== recognitionSession || !activeCallbacks) return;
      let interimTranscript = '';
      const firstChangedResult = typeof event.resultIndex === 'number' ? event.resultIndex : 0;

      for (let i = firstChangedResult; i < event.results.length; i++) {
        const result = event.results[i];
        const phrase = result?.[0]?.transcript?.trim() || '';
        if (!phrase) continue;
        if (result.isFinal) {
          accumulatedFinalTranscript = [accumulatedFinalTranscript, phrase].filter(Boolean).join(' ');
        } else {
          interimTranscript = [interimTranscript, phrase].filter(Boolean).join(' ');
        }
      }

      const combinedTranscript = [accumulatedFinalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
      activeCallbacks.onResult(combinedTranscript, !interimTranscript);
    };

    instance.onerror = (event: any) => {
      if (session !== recognitionSession || !activeCallbacks) return;
      const error = event.error || 'Microphone capture error';
      console.warn('Speech recognition error:', error);

      // Browsers commonly emit no-speech when the user pauses. Keep the
      // session alive for recoverable errors; stop only for real permission/
      // device failures.
      const fatalErrors = ['not-allowed', 'service-not-allowed', 'audio-capture'];
      if (fatalErrors.includes(error)) {
        recognitionActive = false;
        const callbacks = activeCallbacks;
        activeCallbacks = null;
        recognitionInstance = null;
        callbacks?.onError(error);
        try { instance.abort(); } catch {}
      }
    };

    instance.onend = () => {
      if (session !== recognitionSession) return;

      if (recognitionActive && activeCallbacks) {
        // SpeechRecognition implementations (including Chromium-based
        // browsers) can end a continuous session after silence. Restart it
        // while the user still intends to record.
        window.setTimeout(() => {
          if (recognitionActive && session === recognitionSession) {
            launchRecognitionSession(session);
          }
        }, 300);
        return;
      }

      recognitionInstance = null;
      const callbacks = activeCallbacks;
      activeCallbacks = null;
      callbacks?.onEnd();
    };

    instance.start();
    return true;
  } catch (err: any) {
    console.error('Failed to start speech recognition:', err);
    if (session === recognitionSession) {
      recognitionActive = false;
      const callbacks = activeCallbacks;
      activeCallbacks = null;
      callbacks?.onError(err.message || 'Could not start live speech recognition.');
      recognitionInstance = null;
    }
    return false;
  }
}

export function startSpeechRecognition(
  onResult: (text: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError: (err: string) => void
): boolean {
  if (!isSpeechRecognitionSupported()) {
    onError('Live speech recognition is not supported in this browser.');
    return false;
  }

  // Invalidate any previous recognition session before starting a new one.
  recognitionActive = false;
  recognitionSession += 1;
  const session = recognitionSession;
  try { recognitionInstance?.abort(); } catch {}

  accumulatedFinalTranscript = '';
  activeCallbacks = { onResult, onEnd, onError };
  recognitionActive = true;
  return launchRecognitionSession(session);
}

export function stopSpeechRecognition() {
  recognitionActive = false;
  // Keep the session id until the browser fires onend so the final callback
  // can run; a subsequent start increments it and invalidates this instance.
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {
      recognitionInstance = null;
      const callbacks = activeCallbacks;
      activeCallbacks = null;
      callbacks?.onEnd();
    }
  } else if (activeCallbacks) {
    const callbacks = activeCallbacks;
    activeCallbacks = null;
    callbacks.onEnd();
  }
}

export const speechRecognizer = {
  start: (onResult: (text: string, isFinal?: boolean) => void, onError: (err: string) => void) => {
    return startSpeechRecognition(
      (text, isFinal) => onResult(text, isFinal),
      () => {},
      onError
    );
  },
  stop: () => {
    stopSpeechRecognition();
  }
};

// Text to Speech for MOSES voice output.
// Dedicated ElevenLabs speech is requested server-side; browser speech remains the fallback.
let speechGeneration = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;
let activeSpeechRequest: AbortController | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function stopSpeaking() {
  speechGeneration += 1;
  activeSpeechRequest?.abort();
  activeSpeechRequest = null;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = null;
  }
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}

function getPreferredSpeechVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(voice => /^en(-|$)/i.test(voice.lang));
  return englishVoices.find(voice =>
    /natural|neural|google.*(uk|us).*english.*male|daniel|microsoft.*(guy|ryan|david)|male/i.test(voice.name)
  ) || englishVoices.find(voice => /natural|neural|premium|enhanced/i.test(voice.name))
    || englishVoices.find(voice => /google|microsoft/i.test(voice.name))
    || englishVoices[0]
    || voices[0]
    || null;
}

function cleanSpeechText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\|/g, ', ')
    .replace(/\n{2,}/g, '. ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function speakWithBrowser(text: string, generation: number, pitch = 0.95, rate = 1.02) {
  if (!isSpeechSynthesisSupported() || generation !== speechGeneration) return;
  const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  let index = 0;
  const speakNext = () => {
    if (generation !== speechGeneration || index >= chunks.length) return;
    const utterance = new SpeechSynthesisUtterance(chunks[index++].trim());
    utterance.pitch = pitch;
    utterance.rate = rate;
    const voice = getPreferredSpeechVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'en-GB';
    }
    utterance.onend = () => {
      if (generation === speechGeneration) window.setTimeout(speakNext, 90);
    };
    utterance.onerror = (event) => {
      console.warn('MOSES browser speech fallback error:', event.error);
      if (generation === speechGeneration) window.setTimeout(speakNext, 120);
    };
    window.speechSynthesis.speak(utterance);
  };
  speakNext();
}

export async function speakText(text: string, enabled = true, pitch = 0.95, rate = 1.02) {
  if (!enabled || typeof window === 'undefined') return;
  const cleanText = cleanSpeechText(text);
  if (!cleanText) return;

  stopSpeaking();
  const generation = speechGeneration;
  const controller = new AbortController();
  activeSpeechRequest = controller;

  try {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(detail?.error || `ElevenLabs speech request failed (${response.status}).`);
    }

    const audioBlob = await response.blob();
    if (generation !== speechGeneration) return;
    if (!audioBlob.size) throw new Error('ElevenLabs returned an empty audio file.');

    activeAudioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(activeAudioUrl);
    activeAudio = audio;
    audio.onended = () => {
      if (generation !== speechGeneration) return;
      activeAudio = null;
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
    };
    audio.onerror = () => {
      if (generation !== speechGeneration) return;
      console.warn('MOSES ElevenLabs audio playback failed; using browser speech.');
      activeAudio = null;
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = null;
      speakWithBrowser(cleanText, generation, pitch, rate);
    };
    await audio.play();
  } catch (error) {
    if (generation !== speechGeneration || (error instanceof Error && error.name === 'AbortError')) return;
    console.warn('MOSES ElevenLabs unavailable; using browser speech fallback:', error);
    activeSpeechRequest = null;
    speakWithBrowser(cleanText, generation, pitch, rate);
  }
}
