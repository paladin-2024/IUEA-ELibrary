import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate }    from 'react-router-dom';
import { BsMicFill }                   from 'react-icons/bs';
import {
  MdPlayArrow, MdPause, MdSkipPrevious, MdSkipNext,
  MdReplay10, MdForward10,
} from 'react-icons/md';
import { FiShare2, FiDownload, FiArrowBack } from 'react-icons/fi';

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const BAR_COUNT     = 20;
const RECENT_KEY    = 'iuea_recent_episodes';

function saveRecent(episode, podcastTitle, coverUrl) {
  try {
    const raw  = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    const next = [
      { ...episode, podcastTitle, coverUrl },
      ...raw.filter((e) => e._id !== episode._id),
    ].slice(0, 20);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

function fmt(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function EpisodePlayerPage() {
  const { state }                       = useLocation();
  const navigate                        = useNavigate();
  const episode                         = state?.episode;
  const podcastTitle                    = state?.podcastTitle ?? '';
  const coverUrl                        = state?.coverUrl ?? '';

  const audioRef                        = useRef(null);
  const animFrameRef                    = useRef(null);

  const [isPlaying, setIsPlaying]       = useState(false);
  const [duration,  setDuration]        = useState(0);
  const [position,  setPosition]        = useState(0);
  const [speed,     setSpeed]           = useState(1);
  const [barHeights, setBarHeights]     = useState(() => Array(BAR_COUNT).fill(4));

  // Waveform animation
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        setBarHeights(Array.from({ length: BAR_COUNT }, () => 4 + Math.random() * 28));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setBarHeights(Array(BAR_COUNT).fill(4));
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying]);

  // Save to recently played
  useEffect(() => {
    if (episode) saveRecent(episode, podcastTitle, coverUrl);
  }, [episode?._id]);

  if (!episode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-gray-500 text-sm">No episode selected.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else           { audio.play().then(() => setIsPlaying(true)).catch(() => {}); }
  };

  const seek = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
  };

  const changeSpeed = (s) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  return (
    <div className="min-h-screen bg-surface-dark text-white flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-safe-top pt-4">
        <button
          onClick={() => { audioRef.current?.pause(); navigate(-1); }}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <FiArrowBack size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-wide">Now Playing</p>
          <p className="text-sm font-semibold truncate">{podcastTitle}</p>
        </div>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Share">
          <FiShare2 size={18} className="text-white/70" />
        </button>
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Download">
          <FiDownload size={18} className="text-white/70" />
        </button>
      </div>

      {/* ── Cover ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center mt-6 px-8">
        {coverUrl
          ? <img src={coverUrl} alt={podcastTitle}
              className="w-44 h-44 object-cover rounded-2xl shadow-2xl" />
          : <div className="w-44 h-44 rounded-2xl bg-primary/30 flex items-center justify-center">
              <BsMicFill size={56} className="text-accent" />
            </div>
        }
      </div>

      {/* ── Title ───────────────────────────────────────────────────────── */}
      <div className="text-center mt-5 px-6">
        <p className="font-bold text-lg leading-tight line-clamp-2">{episode.title}</p>
        <p className="text-white/60 text-sm mt-1">{podcastTitle}</p>
      </div>

      {/* ── Waveform ────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-center gap-1 h-10 px-6 mt-4">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-accent transition-none"
            style={{ height: `${h}px`, opacity: isPlaying ? 0.7 + Math.random() * 0.3 : 0.3 }}
          />
        ))}
      </div>

      {/* ── Hidden audio element ─────────────────────────────────────────── */}
      <audio
        ref={audioRef}
        src={episode.audioUrl}
        onTimeUpdate={(e)  => setPosition(e.target.currentTime)}
        onDurationChange={(e) => setDuration(e.target.duration)}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={()  => setIsPlaying(true)}
      />

      <div className="flex-1" />

      {/* ── Seek bar ────────────────────────────────────────────────────── */}
      <div className="px-6 mt-4">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={1}
          value={position}
          onChange={(e) => {
            const v = Number(e.target.value);
            setPosition(v);
            if (audioRef.current) audioRef.current.currentTime = v;
          }}
          className="w-full accent-accent h-1 cursor-pointer"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>{fmt(position)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Speed pills ─────────────────────────────────────────────────── */}
      <div className="flex justify-center gap-2 px-4 mt-3">
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              speed === s
                ? 'border-accent text-accent bg-accent/10'
                : 'border-white/20 text-white/50 hover:border-white/40'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-5 pb-10 mt-5">
        <button
          onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; } }}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Restart"
        >
          <MdSkipPrevious size={30} className="text-white/70" />
        </button>

        <button
          onClick={() => seek(-10)}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Replay 10s"
        >
          <MdReplay10 size={28} className="text-white/70" />
        </button>

        {/* Play / Pause */}
        <button
          onClick={handlePlayPause}
          className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying
            ? <MdPause     size={32} className="text-surface-dark" />
            : <MdPlayArrow size={32} className="text-surface-dark ml-1" />
          }
        </button>

        <button
          onClick={() => seek(10)}
          className="p-3 rounded-full hover:bg-white/10 transition-colors"
          title="Forward 10s"
        >
          <MdForward10 size={28} className="text-white/70" />
        </button>

        <button
          className="p-3 rounded-full opacity-30 cursor-not-allowed"
          title="Next episode"
          disabled
        >
          <MdSkipNext size={30} />
        </button>
      </div>
    </div>
  );
}
