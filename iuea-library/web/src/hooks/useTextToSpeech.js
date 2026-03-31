import { useRef, useState, useCallback, useEffect } from 'react';

export default function useTextToSpeech() {
  const [isPlaying,        setIsPlaying]        = useState(false);
  const [isPaused,         setIsPaused]         = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [voices,           setVoices]           = useState([]);
  const utterRef = useRef(null);

  // Load voices (Chrome fires voiceschanged asynchronously)
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const speak = useCallback((text, { rate = 1, lang = 'en-US', voice = null } = {}) => {
    window.speechSynthesis.cancel();
    const utter    = new SpeechSynthesisUtterance(text);
    utter.rate     = rate;
    utter.lang     = lang;
    if (voice) utter.voice = voice;

    utter.onboundary = (e) => {
      if (e.name === 'word') {
        const upToChar = text.slice(0, e.charIndex);
        const idx      = upToChar.split(/\s+/).filter(Boolean).length;
        setCurrentWordIndex(idx);
      }
    };
    utter.onend   = () => { setIsPlaying(false); setIsPaused(false); setCurrentWordIndex(-1); };
    utter.onerror = () => { setIsPlaying(false); setIsPaused(false); };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (!isPlaying) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (!isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsPlaying(true);
  }, [isPaused]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  }, []);

  // Clean up on unmount
  useEffect(() => () => window.speechSynthesis.cancel(), []);

  return { isPlaying, isPaused, currentWordIndex, voices, speak, pause, resume, stop };
}
