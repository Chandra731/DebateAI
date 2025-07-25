
import { useState, useEffect, useCallback, useRef } from 'react';

interface TextToSpeechHook {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export const useTextToSpeech = (): TextToSpeechHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !synthRef.current) return;

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported || !synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
};
