import { useState }   from 'react';
import { User, Globe, Bell, Eye } from 'lucide-react';
import useAuthStore   from '../../store/authStore';
import { useLogout }  from '../../hooks/useAuth';
import Button         from '../../components/ui/Button';
import Input          from '../../components/ui/Input';
import { LANGUAGES }  from '../../utils/constants';
import api            from '../../services/api';
import toast          from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const logout               = useLogout();
  const [form,     setForm]  = useState({ name: user?.name || '', language: user?.language || 'en' });
  const [saving,   setSaving]  = useState(false);
  const [tab,      setTab]   = useState('profile');

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile',  label: 'Profile',  icon: User  },
    { key: 'language', label: 'Language', icon: Globe  },
    { key: 'reading',  label: 'Reading',  icon: Eye    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-semibold text-primary mb-6">Profile & Settings</h1>

      {/* Avatar */}
      <div className="bg-white rounded-card shadow-card p-6 flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-xl font-semibold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-surface p-1 rounded-card">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-btn text-sm transition-colors ${
              tab === key ? 'bg-white shadow-sm font-medium text-primary' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-card shadow-card p-6">
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="space-y-4">
            <Input label="Full name" name="name" value={form.name} onChange={onChange} />
            <Input label="Email" type="email" value={user?.email || ''} disabled />
            <Button type="submit" isLoading={saving}>Save Changes</Button>
          </form>
        )}

        {tab === 'language' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
              <select
                name="language"
                value={form.language}
                onChange={onChange}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Used for AI responses and content translation.</p>
            </div>
            <Button onClick={saveProfile} isLoading={saving}>Save Language</Button>
          </div>
        )}

        {tab === 'reading' && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Reading preferences (font size, theme) are saved automatically while you read.</p>
            <p>Visit the reader to adjust your preferences.</p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button onClick={logout} className="text-sm text-red-500 hover:underline">Sign out</button>
      </div>
    </div>
  );
}
