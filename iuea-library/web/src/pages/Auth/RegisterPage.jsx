import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { BookOpen }  from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import { LANGUAGES } from '../../utils/constants';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', language: 'en' });
  const { mutate: register, isPending } = useRegister();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    register(form);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary p-3 rounded-full">
              <BookOpen size={28} className="text-accent" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join IUEA Library</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Full name" type="text" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" required autoFocus />
            <Input label="Email address" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@iuea.ac.ug" required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={onChange} placeholder="Min 8 characters" required minLength={8} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred language</label>
              <select
                name="language"
                value={form.language}
                onChange={onChange}
                className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full" isLoading={isPending}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
