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
// Keep this independent from microphone capture/transcription so input remains unaffected.
let speechQueue: string[] = [];
let speechVoice: SpeechSynthesisVoice | null = null;
let speechGeneration = 0;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function stopSpeaking() {
  if (!isSpeechSynthesisSupported()) return;
  speechGeneration += 1;
  speechQueue = [];
  window.speechSynthesis.cancel();
}

function getPreferredSpeechVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return speechVoice;

  const englishVoices = voices.filter(voice => /^en(-|$)/i.test(voice.lang));
  const preferred = englishVoices.find(voice =>
    /natural|neural|google.*(uk|us).*english.*male|daniel|microsoft.*(guy|ryan|david)|male/i.test(voice.name)
  ) || englishVoices.find(voice => /natural|neural|premium|enhanced/i.test(voice.name))
    || englishVoices.find(voice => /google|microsoft/i.test(voice.name))
    || englishVoices[0]
    || voices[0];

  speechVoice = preferred || null;
  return speechVoice;
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
    .replace(/`([^\`]+)`/g, '$1')
    .replace(/\|/g, ', ')
    .replace(/\n{2,}/g, '. ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function splitSpeechIntoChunks(text: string, maxLength = 220): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  const pushLongSentence = (sentence: string) => {
    const words = sentence.split(/\s+/);
    let part = '';
    for (const word of words) {
      const candidate = part ? part + ' ' + word : word;
      if (candidate.length > maxLength && part) {
        chunks.push(part.trim());
        part = word;
      } else {
        part = candidate;
      }
    }
    if (part.trim()) chunks.push(part.trim());
  };

  for (const sentence of sentences) {
    const cleanSentence = sentence.trim();
    if (!cleanSentence) continue;
    const candidate = current ? current + ' ' + cleanSentence : cleanSentence;
    if (candidate.length <= maxLength) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = '';
      if (cleanSentence.length > maxLength) pushLongSentence(cleanSentence);
      else current = cleanSentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function speakText(text: string, enabled = true, pitch = 0.95, rate = 1.02) {
  if (!enabled || !isSpeechSynthesisSupported()) return;
  const cleanText = cleanSpeechText(text);
  if (!cleanText) return;

  stopSpeaking();
  const generation = speechGeneration;
  speechQueue = splitSpeechIntoChunks(cleanText);

  const speakNextChunk = () => {
    if (generation !== speechGeneration || !speechQueue.length) return;
    const chunk = speechQueue.shift();
    if (!chunk) return;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.lang = 'en-GB';

    const voice = getPreferredSpeechVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = () => {
      if (generation !== speechGeneration) return;
      // A short handoff between utterances avoids Chromium dropping long queues.
      window.setTimeout(speakNextChunk, 90);
    };
    utterance.onerror = (event) => {
      console.warn('MOSES speech playback error:', event.error);
      if (generation !== speechGeneration) return;
      window.setTimeout(speakNextChunk, 120);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Voice lists can arrive asynchronously in Chromium-based browsers.
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    getPreferredSpeechVoice();
    speakNextChunk();
  } else {
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      if (generation !== speechGeneration) return;
      getPreferredSpeechVoice();
      speakNextChunk();
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
      if (generation === speechGeneration && speechQueue.length) {
        getPreferredSpeechVoice();
        speakNextChunk();
      }
    }, 800);
  }
}
