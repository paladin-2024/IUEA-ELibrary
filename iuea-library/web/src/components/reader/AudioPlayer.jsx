import { useState, useEffect, useRef } from 'react';
import { useNavigate }                 from 'react-router-dom';
import {
  MdSkipPrevious, MdReplay, MdPlayArrow, MdPause,
  MdSkipNext, MdArrowBack, MdVolumeUp,
} from 'react-icons/md';
import { BsMicFill } from 'react-icons/bs';
import { FiAlertCircle } from 'react-icons/fi';
import useReaderStore    from '../../store/readerStore';
import useTextToSpeech   from '../../hooks/useTextToSpeech';
import LANGUAGES         from '../../../../shared/languages.json';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const BAR_COUNT     = 24;

export default function AudioPlayer({ bookId }) {
  const navigate = useNavigate();

  const {
    currentBook, currentChapterText, translatedContent,
    readingLanguage, playbackSpeed, currentWordIndex,
    setPlaybackSpeed, setIsPlaying, setIsPaused, setCurrentWordIndex,
  } = useReaderStore();

  const {
    speak, pause, resume, stop,
    isPlaying, isPaused, voices, isSupported, getVoicesForLanguage,
  } = useTextToSpeech();

  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [barHeights, setBarHeights]             = useState(() => Array(BAR_COUNT).fill(4));
  const animFrameRef = useRef(null);

  // Sync audio state to store
  useEffect(() => { setIsPlaying(isPlaying); },  [isPlaying]);
  useEffect(() => { setIsPaused(isPaused); },    [isPaused]);

  // Animate waveform when playing
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        setBarHeights(Array.from({ length: BAR_COUNT }, () => 4 + Math.random() * 32));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setBarHeights(Array(BAR_COUNT).fill(4));
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying]);

  const readText  = translatedContent ?? currentChapterText ?? currentBook?.description ?? '';
  const words     = readText.split(/\s+/).filter(Boolean);

  // Resolve BCP-47 lang code from readable name ("Swahili" → "sw-KE")
  const langEntry = LANGUAGES.find((l) => l.name === readingLanguage) ?? LANGUAGES[0];
  const langCode  = langEntry.ttsLang;

  const voiceList = getVoicesForLanguage(langCode.split('-')[0]);

  const handlePlay = () => {
    if (isPaused)    { resume(); return; }
    if (!readText)   return;
    speak(readText, langCode, {
      rate:     playbackSpeed,
      voiceURI: selectedVoiceURI || undefined,
    });
  };

  const handleRestart = () => {
    stop();
    if (!readText) return;
    setTimeout(() => speak(readText, langCode, {
      rate:     playbackSpeed,
      voiceURI: selectedVoiceURI || undefined,
    }), 80);
  };

  const handleSpeedChange = (s) => {
    setPlaybackSpeed(s);
    if (isPlaying) handleRestart();   // restart at new speed
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#2A0D12] px-6">
        <FiAlertCircle size={48} className="text-yellow-400" />
        <p className="text-white text-center font-semibold">
          Text-to-speech is not supported in this browser.
        </p>
        <p className="text-white/60 text-sm text-center">
          Try Chrome or Edge on desktop for full audio support.
        </p>
        <button onClick={() => navigate(-1)} className="text-sm text-[#C9A84C] underline mt-2">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#2A0D12] text-white">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-4">
        <button
          onClick={() => { stop(); navigate(`/reader/${bookId}`); }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <MdArrowBack size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-wide">Audio Mode</p>
          <p className="text-sm font-semibold truncate">{currentBook?.title}</p>
        </div>
      </div>

      {/* ── Cover ────────────────────────────────────────────────────────── */}
      <div className="flex justify-center mt-6 px-8">
        {currentBook?.coverUrl
          ? <img
              src={currentBook.coverUrl}
              alt={currentBook.title}
              className="w-44 h-60 object-cover rounded-2xl shadow-2xl"
            />
          : <div className="w-44 h-60 rounded-2xl bg-primary/30 flex items-center justify-center">
              <MdVolumeUp size={56} className="text-[#C9A84C]" />
            </div>
        }
      </div>

      {/* ── Title / author / chapter ──────────────────────────────────────── */}
      <div className="text-center mt-5 px-6">
        <p className="font-bold text-lg leading-tight line-clamp-2">{currentBook?.title}</p>
        <p className="text-white/60 text-sm mt-1">{currentBook?.author}</p>
        <p className="text-[#C9A84C] text-xs mt-1 uppercase tracking-wide">{langEntry.name}</p>
      </div>

      {/* ── "Audio by device" note ────────────────────────────────────────── */}
      <p className="text-center text-white/40 text-[10px] mt-2">
        Audio by your device's speech engine
      </p>

      {/* ── Waveform ─────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-center gap-1 h-12 px-6 mt-4">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-[#C9A84C] transition-none"
            style={{ height: `${h}px`, opacity: isPlaying ? 0.8 + Math.random() * 0.2 : 0.3 }}
          />
        ))}
      </div>

      {/* ── Current word highlight ────────────────────────────────────────── */}
      <div className="px-6 mt-3 h-10 flex items-center justify-center">
        <p className="text-sm text-white/50 text-center line-clamp-2">
          {words.slice(Math.max(0, currentWordIndex - 4), currentWordIndex + 5).map((w, i) => {
            const absIdx = Math.max(0, currentWordIndex - 4) + i;
            return (
              <span
                key={i}
                className={absIdx === currentWordIndex ? 'text-[#C9A84C] font-bold' : ''}
              >
                {w}{' '}
              </span>
            );
          })}
        </p>
      </div>

      <div className="flex-1" />

      {/* ── Speed pills ──────────────────────────────────────────────────── */}
      <div className="flex justify-center gap-2 px-4 mb-4">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSpeedChange(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              playbackSpeed === s
                ? 'border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10'
                : 'border-white/20 text-white/50 hover:border-white/40'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* ── Voice dropdown ───────────────────────────────────────────────── */}
      {voiceList.length > 0 && (
        <div className="px-6 mb-4">
          <select
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="w-full text-xs bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
          >
            <option value="">System default voice</option>
            {voiceList.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Playback controls ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 pb-8">
        {/* Skip prev — restart */}
        <button
          onClick={() => { stop(); }}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Stop"
        >
          <MdSkipPrevious size={32} className="text-white/70" />
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Restart"
        >
          <MdReplay size={28} className="text-white/70" />
        </button>

        {/* Play / Pause — primary */}
        <button
          onClick={isPlaying ? pause : handlePlay}
          className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-[#C9A84C]"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying
            ? <MdPause     size={32} className="text-[#2A0D12]" />
            : <MdPlayArrow size={32} className="text-[#2A0D12]" />
          }
        </button>

        {/* Skip next — disabled (no seek in Web Speech API) */}
        <button
          className="p-3 rounded-full opacity-30 cursor-not-allowed"
          title="Chapter navigation not available"
          disabled
        >
          <MdSkipNext size={28} />
        </button>

        {/* Skip next chapter placeholder */}
        <button
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Next chapter (read mode)"
          onClick={() => navigate(`/reader/${bookId}`)}
        >
          <MdSkipNext size={32} className="text-white/70" />
        </button>
      </div>
    </div>
  );
}
