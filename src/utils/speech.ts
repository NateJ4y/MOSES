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
      let transcript = '';
      let allFinal = true;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result?.[0]?.transcript || '';
        if (!result.isFinal) allFinal = false;
      }
      activeCallbacks.onResult(transcript.trim(), allFinal);
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
        activeCallbacks.onError(error);
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

// Text to Speech for Moses voice output
export function speakText(text: string, enabled = true, pitch = 0.95, rate = 1.05) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel(); // Stop current speech
    // Clean markdown formatting before speaking
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+\s+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .slice(0, 300); // Speak first 300 chars for concise audio response

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = pitch;
    utterance.rate = rate;

    // Pick deep, crisp English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Google UK English Male'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS playback error:', err);
  }
}
