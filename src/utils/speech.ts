// Web Speech Recognition & Speech Synthesis Utility

export interface SpeechRecognitionResultState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
}

let recognitionInstance: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function startSpeechRecognition(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (err: string) => void
): boolean {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported in this browser.');
    return false;
  }

  try {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (recognitionInstance) {
      try {
        recognitionInstance.abort();
      } catch (e) {}
    }

    recognitionInstance = new SpeechRecognitionClass();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      onError(event.error || 'Microphone capture error');
      onEnd();
    };

    recognitionInstance.onend = () => {
      onEnd();
    };

    recognitionInstance.start();
    return true;
  } catch (err: any) {
    console.error('Failed to start speech recognition:', err);
    onError(err.message || 'Could not access microphone');
    return false;
  }
}

export function stopSpeechRecognition() {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch (e) {}
  }
}

export const speechRecognizer = {
  start: (onResult: (text: string, isFinal?: boolean) => void, onError: (err: string) => void) => {
    return startSpeechRecognition(
      (text) => onResult(text, false),
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
