import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';

export default function LoginPage() {
  const [form,   setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    login(form);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-primary p-3 rounded-full">
              <BookOpen size={28} className="text-accent" />
            </div>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to IUEA Library</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@iuea.ac.ug"
              required
              autoFocus
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isPending}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
