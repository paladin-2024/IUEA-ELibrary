import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  FiUser, FiEdit2, FiBell, FiBookOpen, FiLogOut, FiChevronRight,
} from 'react-icons/fi';
import { MdTranslate }         from 'react-icons/md';
import { useLogout }           from '../../hooks/useAuth';
import useAuthStore            from '../../store/authStore';
import api                     from '../../services/api';

export default function ProfilePage() {
  const { user }                    = useAuthStore();
  const logout                      = useLogout();
  const navigate                    = useNavigate();
  const [stats, setStats]           = useState({ booksRead: 0, hoursRead: 0, streak: 0, goalPct: 0 });

  useEffect(() => {
    api.get('/progress').then(({ data }) => {
      const list      = data.progress ?? [];
      const finished  = list.filter((p) => p.isCompleted).length;
      const hours     = list.reduce((s, p) => s + (p.minutesRead ?? 0), 0) / 60;
      const goalBooks = user?.readingGoal ?? 12;
      setStats({
        booksRead: finished,
        hoursRead: Math.round(hours * 10) / 10,
        streak:    user?.streak ?? 0,
        goalPct:   Math.min(Math.round((finished / goalBooks) * 100), 100),
      });
    }).catch(() => {});
  }, []);

  const tiles = [
    {
      icon: FiBookOpen,
      label: 'Reading Preferences',
      sub:   'Font, theme, line spacing',
      to:    '/profile/reading-preferences',
    },
    {
      icon: MdTranslate,
      label: 'Language Preferences',
      sub:   'Translation & AI language',
      to:    '/profile/language-preferences',
    },
    {
      icon: FiBell,
      label: 'Notifications',
      sub:   'Alerts & reminders',
      to:    null,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ── Avatar & identity ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-card">
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
            : <FiUser size={34} className="text-white" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl font-bold text-gray-900 leading-tight truncate">
            {user?.name ?? '—'}
          </h1>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {user?.studentId && (
              <span className="text-[10px] bg-surface border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                {user.studentId}
              </span>
            )}
            {user?.faculty && (
              <span className="text-[10px] bg-accent/15 text-accent-dark border border-accent/30 px-2 py-0.5 rounded-full font-semibold">
                {user.faculty}
              </span>
            )}
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">
              {user?.role ?? 'student'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {}}
          className="flex-shrink-0 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          <FiEdit2 size={13} />
          Edit
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Books Read',  value: stats.booksRead },
          { label: 'Hours Read',  value: stats.hoursRead },
          { label: 'Day Streak',  value: stats.streak },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-card shadow-card px-3 py-3 text-center">
            <p className="text-xl font-bold text-primary">{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Reading goal ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card shadow-card px-4 py-3 mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-gray-700">Annual Reading Goal</span>
          <span className="text-xs font-semibold text-primary">{stats.goalPct}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${stats.goalPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {stats.booksRead} of {user?.readingGoal ?? 12} books · keep it up!
        </p>
      </div>

      {/* ── Settings tiles ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card shadow-card divide-y divide-gray-100 mb-5">
        {tiles.map(({ icon: Icon, label, sub, to }) => (
          <button
            key={label}
            onClick={() => to && navigate(to)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
              to ? 'hover:bg-surface' : 'opacity-60 cursor-default'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            {to && <FiChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* ── Sign out ───────────────────────────────────────────────────────── */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-btn border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
      >
        <FiLogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
