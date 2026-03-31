import { useState }         from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiBriefcase, FiMail, FiLock, FiLoader } from 'react-icons/fi';
import toast                 from 'react-hot-toast';
import useAuthStore          from '../../store/authStore';

const FACULTIES = ['Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '', studentId: '', email: '',
    faculty: '', password: '', confirmPassword: '',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [terms,   setTerms]   = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!terms) {
      toast.error('Please accept the terms to continue.');
      return;
    }
    const { ok } = await register({
      name:      form.name,
      studentId: form.studentId,
      email:     form.email,
      faculty:   form.faculty,
      password:  form.password,
    });
    if (ok) {
      navigate('/onboarding');
    } else {
      toast.error(useAuthStore.getState().error ?? 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      {/* ── Desktop split ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-full max-w-5xl min-h-screen">
        {/* Left — maroon + feature bullets */}
        <div className="w-1/2 bg-primary flex flex-col justify-center px-14 text-white">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-8">
            <span className="text-primary font-bold text-lg">IUEA</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold mb-6 leading-tight">
            Your gateway to<br />academic excellence.
          </h2>
          {[
            'Access full faculty archives',
            'Read in 8 African languages',
            'AI-powered research assistant',
            'Offline reading & downloads',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">✓</span>
              </div>
              <span className="text-white/80 text-sm">{item}</span>
            </div>
          ))}
        </div>

        {/* Right — form */}
        <div className="w-1/2 bg-surface flex items-center justify-center px-12">
          <div className="w-full max-w-sm">
            <h2 className="font-serif text-2xl font-semibold text-primary mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm mb-6">Join the IUEA digital library</p>
            <_RegisterForm
              form={form} onChange={onChange} onSubmit={onSubmit}
              showPw={showPw} setShowPw={setShowPw}
              showCpw={showCpw} setShowCpw={setShowCpw}
              terms={terms} setTerms={setTerms}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile ────────────────────────────────────────────────────────── */}
      <div className="lg:hidden w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">IUEA</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-primary">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join IUEA Library</p>
        </div>
        <div className="bg-white rounded-card shadow-sm p-8">
          <_RegisterForm
            form={form} onChange={onChange} onSubmit={onSubmit}
            showPw={showPw} setShowPw={setShowPw}
            showCpw={showCpw} setShowCpw={setShowCpw}
            terms={terms} setTerms={setTerms}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared form ───────────────────────────────────────────────────────────────
function _RegisterForm({
  form, onChange, onSubmit,
  showPw, setShowPw, showCpw, setShowCpw,
  terms, setTerms, isLoading,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Full name */}
      <_Field icon={<FiUser size={15} />} label="Full Name">
        <input
          type="text" name="name" value={form.name} onChange={onChange}
          placeholder="Jane Doe" required
          className={inputCls}
        />
      </_Field>

      {/* Student ID */}
      <_Field icon={<FiBriefcase size={15} />} label="Student / Staff ID">
        <input
          type="text" name="studentId" value={form.studentId} onChange={onChange}
          placeholder="IUEA/STU/2024-001"
          className={inputCls}
        />
      </_Field>

      {/* Email */}
      <_Field icon={<FiMail size={15} />} label="University Email">
        <input
          type="email" name="email" value={form.email} onChange={onChange}
          placeholder="you@iuea.ac.ug" required
          className={inputCls}
        />
      </_Field>

      {/* Faculty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Faculty</label>
        <select
          name="faculty" value={form.faculty} onChange={onChange}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-input outline-none
                     focus:border-primary focus:ring-1 focus:ring-primary/30 bg-white"
        >
          <option value="">Select faculty…</option>
          {FACULTIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Password */}
      <_Field icon={<FiLock size={15} />} label="Password">
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} name="password"
            value={form.password} onChange={onChange}
            placeholder="Min 8 characters" required minLength={8}
            className={inputCls + ' pr-9'}
          />
          <button type="button" onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? '🙈' : '👁'}
          </button>
        </div>
      </_Field>

      {/* Confirm password */}
      <_Field icon={<FiLock size={15} />} label="Confirm Password">
        <div className="relative">
          <input
            type={showCpw ? 'text' : 'password'} name="confirmPassword"
            value={form.confirmPassword} onChange={onChange}
            placeholder="Repeat password" required
            className={inputCls + ' pr-9'}
          />
          <button type="button" onClick={() => setShowCpw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showCpw ? '🙈' : '👁'}
          </button>
        </div>
      </_Field>

      {/* Terms */}
      <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
        <input
          type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        I agree to the{' '}
        <a href="#" className="text-primary underline">Library Terms of Use</a>{' '}
        and data storage policy.
      </label>

      {/* Submit */}
      <button
        type="submit" disabled={isLoading}
        className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold
                   hover:bg-primary-dark transition-colors disabled:opacity-60
                   flex items-center justify-center gap-2"
      >
        {isLoading
          ? <><FiLoader className="animate-spin" size={16} /> Creating account…</>
          : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-500 mt-2">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
const inputCls = `w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-input outline-none
  focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors`;

function _Field({ icon, label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}
