import { useState, useRef, useCallback, useEffect } from 'react';

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export default function useTextToSpeech() {
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [voices,           setVoices]           = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const utterRef = useRef(null);

  // Load available voices — Chrome populates asynchronously
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, []);

  const getVoicesForLanguage = useCallback(
    (langCode) => voices.filter((v) => v.lang.startsWith(langCode)),
    [voices]
  );

  const speak = useCallback(
    (text, langCode = 'en', { rate = 1, voiceURI = null } = {}) => {
      if (!isSupported || !text) return;
      window.speechSynthesis.cancel();

      const utter  = new SpeechSynthesisUtterance(text);
      utter.rate   = rate;
      utter.lang   = langCode;

      if (voiceURI) {
        const match = voices.find((v) => v.voiceURI === voiceURI);
        if (match) utter.voice = match;
      } else {
        // Auto-match best voice for language
        const match = voices.find((v) => v.lang.startsWith(langCode));
        if (match) utter.voice = match;
      }

      utter.onboundary = (e) => {
        if (e.name === 'word') {
          // Derive word index from char offset
          const upTo  = text.slice(0, e.charIndex);
          const index = upTo.split(/\s+/).filter(Boolean).length;
          setCurrentWordIndex(index);
        }
      };

      utter.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utter.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        utterRef.current = null;
      };

      utter.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
        utterRef.current = null;
      };

      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [voices]
  );

  const pause = useCallback(() => {
    if (!isSupported || !isPlaying) return;
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPlaying(true);
    setIsPaused(false);
  }, [isPaused]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    utterRef.current = null;
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    getVoicesForLanguage,
    isPlaying,
    isPaused,
    voices,
    currentWordIndex,
    isSupported,
  };
}
