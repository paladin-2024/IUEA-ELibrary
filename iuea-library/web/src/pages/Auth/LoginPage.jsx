import { useState }        from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { FcGoogle }        from 'react-icons/fc';
import { GoogleLogin }     from '@react-oauth/google';
import toast               from 'react-hot-toast';
import useAuthStore        from '../../store/authStore';

const FACULTIES = ['Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science'];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading, error } = useAuthStore();

  const [form,   setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const { ok } = await login(form);
    if (ok) {
      navigate('/home');
    } else {
      toast.error(useAuthStore.getState().error ?? 'Login failed.');
    }
  };

  const onGoogleSuccess = async (credentialResponse) => {
    const { ok, isNewUser } = await loginWithGoogle(credentialResponse.credential);
    if (ok) {
      navigate(isNewUser ? '/onboarding' : '/home');
    } else {
      toast.error(useAuthStore.getState().error ?? 'Google sign-in failed.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      {/* ── Desktop split ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-full max-w-5xl min-h-screen">
        {/* Left — maroon panel */}
        <div className="w-1/2 bg-primary flex flex-col items-center justify-center px-12 text-white">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6">
            <span className="text-primary font-bold text-2xl">IUEA</span>
          </div>
          <p className="font-serif text-3xl font-semibold text-center leading-tight mb-4">
            The Digital Curator of<br />Academic Excellence.
          </p>
          <p className="text-white/70 text-sm text-center">
            Access thousands of academic resources, research papers,<br />
            and journals from the IUEA library collection.
          </p>
        </div>

        {/* Right — form panel */}
        <div className="w-1/2 bg-surface flex items-center justify-center px-12">
          <div className="w-full max-w-sm">
            <_LoginForm
              form={form} onChange={onChange} onSubmit={onSubmit}
              showPw={showPw} setShowPw={setShowPw}
              isLoading={isLoading}
              onGoogleSuccess={onGoogleSuccess}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile ─────────────────────────────────────────────────────────── */}
      <div className="lg:hidden w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">IUEA</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to IUEA Library</p>
        </div>
        <div className="bg-white rounded-card shadow-sm p-8">
          <_LoginForm
            form={form} onChange={onChange} onSubmit={onSubmit}
            showPw={showPw} setShowPw={setShowPw}
            isLoading={isLoading}
            onGoogleSuccess={onGoogleSuccess}
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared form ───────────────────────────────────────────────────────────────
function _LoginForm({ form, onChange, onSubmit, showPw, setShowPw, isLoading, onGoogleSuccess }) {
  return (
    <>
      <div className="hidden lg:block mb-8">
        <h2 className="font-serif text-2xl font-semibold text-primary">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            University Email
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email" name="email" value={form.email} onChange={onChange}
              placeholder="you@iuea.ac.ug" required autoFocus
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-input outline-none
                         focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Security Key
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type={showPw ? 'text' : 'password'} name="password"
              value={form.password} onChange={onChange}
              placeholder="••••••••" required
              className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-input outline-none
                         focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            <button
              type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        {/* Forgot */}
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" className="accent-primary" />
            Keep me signed in 30 days
          </label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={isLoading}
          className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold
                     hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading
            ? <><FiLoader className="animate-spin" size={16} /> Signing in…</>
            : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={onGoogleSuccess}
          onError={() => { /* handled by store */ }}
          theme="outline"
          size="large"
          text="signin_with"
          shape="rectangular"
          width="100%"
        />
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        New student?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Create account
        </Link>
      </p>
    </>
  );
}
