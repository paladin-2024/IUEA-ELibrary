import { useQuery }    from '@tanstack/react-query';
import api             from '../../services/api';

const fetchStreak = () => api.get('/streaks').then(r => r.data);

const FLAME_COLORS = ['#F59E0B', '#F97316', '#EF4444'];

function FlameIcon({ streak }) {
  const color = streak >= 30 ? FLAME_COLORS[2] : streak >= 7 ? FLAME_COLORS[1] : FLAME_COLORS[0];
  return <span style={{ fontSize: '3rem', filter: `drop-shadow(0 0 8px ${color}88)` }}>🔥</span>;
}

function XpBar({ xp }) {
  const level    = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.813rem', color: '#6B7280', marginBottom: 4 }}>
        <span>Level {level}</span>
        <span>{progress}/100 XP to Level {level + 1}</span>
      </div>
      <div style={{ height: 8, background: '#E5E7EB', borderRadius: 999 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #8A1228, #B8964A)', borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function StreaksPage() {
  const { data, isLoading } = useQuery({ queryKey: ['streak'], queryFn: fetchStreak, staleTime: 30_000 });

  if (isLoading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading streak…</div>
  );

  const {
    currentStreak = 0, longestStreak = 0, totalXp = 0,
    totalReadingMinutes = 0, readingGoal = 20,
    allBadges = [], lastReadDate,
  } = data ?? {};

  const hours   = Math.floor(totalReadingMinutes / 60);
  const minutes = totalReadingMinutes % 60;
  const goalPct = Math.min(100, Math.round((totalReadingMinutes / (readingGoal * 60)) * 100));

  return (
    <div style={{ padding: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.75rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 0.25rem' }}>
        Reading Streaks
      </h1>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
        Your reading progress and achievements
      </p>

      {/* Streak hero */}
      <div style={{ background: 'linear-gradient(135deg, #8A1228 0%, #1E3A5F 100%)', borderRadius: 16, padding: '2rem', color: '#fff', marginBottom: '1.5rem', textAlign: 'center' }}>
        <FlameIcon streak={currentStreak} />
        <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '4rem', fontWeight: 700, lineHeight: 1, margin: '0.5rem 0' }}>
          {currentStreak}
        </div>
        <div style={{ fontSize: '1rem', opacity: 0.85, marginBottom: '1.5rem' }}>
          day streak{currentStreak !== 1 ? 's' : ''}
          {lastReadDate && <span style={{ opacity: 0.6, fontSize: '0.813rem', display: 'block', marginTop: 4 }}>Last read: {new Date(lastReadDate).toLocaleDateString()}</span>}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{longestStreak}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Longest Streak</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalXp}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Total XP</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{hours}h {minutes}m</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Time Reading</div>
          </div>
        </div>
      </div>

      {/* XP Level */}
      <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>XP Progress</h3>
        <XpBar xp={totalXp} />
      </div>

      {/* Reading goal */}
      <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>Monthly Reading Goal</h3>
          <span style={{ fontSize: '0.875rem', color: '#8A1228', fontWeight: 700 }}>{goalPct}%</span>
        </div>
        <div style={{ height: 10, background: '#E5E7EB', borderRadius: 999 }}>
          <div style={{ width: `${goalPct}%`, height: '100%', background: '#8A1228', borderRadius: 999, transition: 'width 0.6s' }} />
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.813rem', color: '#6B7280' }}>
          {hours}h {minutes}m read this month · Goal: {readingGoal} hours
        </p>
      </div>

      {/* Badges */}
      <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.25rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 1rem' }}>
        Badges
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {allBadges.map(badge => (
          <div key={badge.id} style={{ background: badge.earned ? '#fff' : '#F9FAFB', border: `1px solid ${badge.earned ? '#8A1228' : '#E5E7EB'}`, borderRadius: 12, padding: '1rem', textAlign: 'center', opacity: badge.earned ? 1 : 0.5, transition: 'opacity 0.2s' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.4rem', filter: badge.earned ? 'none' : 'grayscale(1)' }}>
              {badge.id === 'first_book'   ? '📖' :
               badge.id === 'streak_3'    ? '🔥' :
               badge.id === 'streak_7'    ? '⚡' :
               badge.id === 'streak_30'   ? '🏆' :
               badge.id === 'night_owl'   ? '🦉' :
               badge.id === 'speed_reader'? '💨' :
               badge.id === 'polyglot'    ? '🌍' :
               badge.id === 'book_worm'   ? '🐛' :
               badge.id === 'scholar'     ? '🎓' : '⭐'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.813rem', color: badge.earned ? '#1A1A1A' : '#9CA3AF', marginBottom: 2 }}>
              {badge.label}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', lineHeight: 1.4 }}>{badge.desc}</div>
            {badge.earned && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#8A1228', fontWeight: 700 }}>+{badge.xp} XP</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
