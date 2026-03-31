import { useState, useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import {
  MdArrowBack, MdPlayArrow, MdPause, MdStop,
  MdVolumeUp, MdSpeed,
} from 'react-icons/md';
import useReaderStore        from '../../store/readerStore';
import useTextToSpeech       from '../../hooks/useTextToSpeech';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({ bookId }) {
  const navigate   = useNavigate();
  const { currentBook, currentChapterText, playbackSpeed, setPlaybackSpeed, setIsPlaying, setIsPaused, setCurrentWordIndex } = useReaderStore();
  const { isPlaying, isPaused, currentWordIndex, voices, speak, pause, resume, stop } = useTextToSpeech();
  const [selectedVoice,  setSelectedVoice]  = useState(null);
  const [waveActive,     setWaveActive]     = useState(false);
  const words   = useRef([]);

  // Sync playing state to store
  useEffect(() => { setIsPlaying(isPlaying); },        [isPlaying]);
  useEffect(() => { setIsPaused(isPaused); },          [isPaused]);
  useEffect(() => { setCurrentWordIndex(currentWordIndex); }, [currentWordIndex]);
  useEffect(() => { setWaveActive(isPlaying); },       [isPlaying]);

  const textToRead = currentChapterText || currentBook?.description || 'No text available for this book.';

  useEffect(() => {
    words.current = textToRead.split(/\s+/);
  }, [textToRead]);

  const handlePlay = () => {
    if (isPaused) { resume(); return; }
    speak(textToRead, {
      rate:  playbackSpeed,
      lang:  'en-US',
      voice: selectedVoice,
    });
  };

  const handleStop = () => stop();

  if (!currentBook) return null;

  const coverUrl = currentBook.coverUrl || '';
  const bgColor  = '#2A0D12';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgColor, color: '#fff' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => { stop(); navigate(-1); }} className="p-1.5 rounded-lg hover:bg-white/10">
          <MdArrowBack size={22} />
        </button>
        <span className="text-sm font-semibold opacity-80">Audio Mode</span>
      </div>

      {/* Cover */}
      <div className="flex flex-col items-center px-8 pt-4 flex-1">
        <div className="w-52 h-72 rounded-2xl overflow-hidden shadow-2xl">
          {coverUrl ? (
            <img src={coverUrl} alt={currentBook.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#7B0D1E' }}>
              <MdVolumeUp size={64} className="opacity-50" />
            </div>
          )}
        </div>

        <h2 className="mt-6 text-lg font-bold text-center line-clamp-2">{currentBook.title}</h2>
        <p className="text-sm opacity-60 mt-1">{currentBook.author}</p>

        {/* Waveform animation */}
        <div className="flex items-end gap-1 h-12 mt-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all"
              style={{
                background:  '#C9A84C',
                height:      waveActive ? `${Math.random() * 30 + 10}px` : '4px',
                animation:   waveActive ? `wave ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
              }}
            />
          ))}
        </div>

        {/* Current word highlight */}
        {isPlaying && currentWordIndex >= 0 && (
          <p className="mt-3 text-xs opacity-60 text-center px-4 line-clamp-2">
            {words.current.map((w, i) => (
              <span
                key={i}
                style={{ color: i === currentWordIndex ? '#C9A84C' : undefined, fontWeight: i === currentWordIndex ? 700 : undefined }}
              >
                {w}{' '}
              </span>
            ))}
          </p>
        )}

        {/* Speed pills */}
        <div className="flex items-center gap-2 mt-6">
          <MdSpeed size={16} className="opacity-50" />
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setPlaybackSpeed(s); if (isPlaying) { stop(); speak(textToRead, { rate: s, voice: selectedVoice }); } }}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                playbackSpeed === s
                  ? 'border-accent text-accent'
                  : 'border-white/20 text-white/50 hover:border-white/40'
              }`}
              style={{ borderColor: playbackSpeed === s ? '#C9A84C' : undefined, color: playbackSpeed === s ? '#C9A84C' : undefined }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Voice dropdown */}
        {voices.length > 0 && (
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => setSelectedVoice(voices.find((v) => v.name === e.target.value) || null)}
            className="mt-4 text-xs bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white max-w-xs w-full"
          >
            <option value="">System default voice</option>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
        )}

        {/* Controls */}
        <div className="flex items-center gap-6 mt-8 mb-8">
          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 disabled:opacity-30 transition-colors"
          >
            <MdStop size={24} />
          </button>

          <button
            onClick={isPlaying ? pause : handlePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
            style={{ background: '#C9A84C' }}
          >
            {isPlaying
              ? <MdPause   size={32} color="#2A0D12" />
              : <MdPlayArrow size={32} color="#2A0D12" />
            }
          </button>

          <button
            onClick={() => navigate(`/reader/${bookId}`)}
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:border-white/40 transition-colors"
            title="Switch to reading mode"
          >
            <span className="text-xs font-bold opacity-70">Aa</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
