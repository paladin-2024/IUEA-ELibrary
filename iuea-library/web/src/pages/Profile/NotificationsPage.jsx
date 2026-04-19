import { useEffect, useState }  from 'react';
import { FiBell, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api                       from '../../services/api';
import toast                     from 'react-hot-toast';

const DEFAULT_PREFS = {
  newBooks:        true,
  readingReminder: false,
  podcastUpdates:  true,
  accountAlerts:   true,
};

export default function NotificationsPage() {
  const [prefs,   setPrefs]   = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get('/profile/notification-prefs')
      .then(({ data }) => setPrefs({ ...DEFAULT_PREFS, ...data.prefs }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/profile/notification-prefs', { prefs });
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Could not save preferences');
    }
    setSaving(false);
  };

  const rows = [
    { key: 'newBooks',        label: 'New book arrivals',      desc: 'Be notified when new books are added to the library' },
    { key: 'readingReminder', label: 'Reading reminders',      desc: 'Daily nudge to keep up your reading streak' },
    { key: 'podcastUpdates',  label: 'Podcast updates',        desc: 'New episodes from podcasts you follow' },
    { key: 'accountAlerts',   label: 'Account alerts',         desc: 'Security and account-related notifications' },
  ];

  return (
    <div className="px-6 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FiBell size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">Choose what you hear about</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-card shadow-sm divide-y divide-gray-50">
          {rows.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                disabled={loading}
                className="shrink-0 text-2xl transition-colors disabled:opacity-40"
              >
                {prefs[key]
                  ? <FiToggleRight size={28} className="text-primary" />
                  : <FiToggleLeft  size={28} className="text-gray-300" />}
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving || loading}
          className="mt-6 w-full py-2.5 bg-primary text-white rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
