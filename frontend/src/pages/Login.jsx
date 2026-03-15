import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Mail, Lock, LogIn, AlertCircle, User, UserPlus,
  KeyRound, ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

/* ── tiny slide transition ── */
const slide = (dir = 1) => ({
  initial: { opacity: 0, x: dir * 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: dir * -40 },
  transition: { duration: 0.28 },
});

/* ── reusable field ── */
function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white/70 flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/50" /> {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input-glass rounded-2xl px-4 py-3 w-full text-sm"
      />
    </label>
  );
}

/* ── password field with eye toggle ── */
function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white/70 flex items-center gap-2">
        <Lock className="w-4 h-4 text-white/50" /> {label}
      </span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="input-glass rounded-2xl px-4 py-3 w-full text-sm pr-11"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

/* ── alert ── */
function Alert({ msg, success }) {
  const colors = success
    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
    : 'bg-rose-500/15 border-rose-400/30 text-rose-200';
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${colors}`}>
      <Icon className="w-4 h-4 shrink-0" /> {msg}
    </div>
  );
}

/* ── submit button ── */
function Btn({ loading, label, icon: Icon }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={loading}
      className="btn-primary rounded-2xl w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {loading ? 'Please wait…' : label}
    </motion.button>
  );
}

// ─── SCREENS ────────────────────────────────────────────────────────────────

function LoginScreen({ onSignUp, onForgot, login }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      login(data.token);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl font-black text-white">Welcome back</h2>
        <p className="text-white/50 text-sm mt-1">Sign in to your account</p>
      </div>
      {error && <Alert msg={error} />}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <div className="space-y-2">
          <PasswordField label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
          <button type="button" onClick={onForgot} className="text-xs text-[#22d3ee] hover:underline float-right">Forgot password?</button>
          <div className="clear-both" />
        </div>
        <Btn loading={loading} label="Sign In" icon={LogIn} />
      </form>
      <p className="text-center text-white/40 text-xs">
        Don&apos;t have an account?{' '}
        <button onClick={onSignUp} className="text-[#22d3ee] hover:underline">Create one</button>
      </p>
    </>
  );
}

function SignUpScreen({ onBack, login }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      login(data.token); // auto-login after signup
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white">Create account</h2>
          <p className="text-white/50 text-sm">Join CoreInventory</p>
        </div>
      </div>
      {error && <Alert msg={error} />}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={User} label="Full Name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" autoComplete="name" />
        <Field icon={Mail} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <PasswordField label="Password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
        <Btn loading={loading} label="Create Account" icon={UserPlus} />
      </form>
      <p className="text-center text-white/40 text-xs">
        Already have an account?{' '}
        <button onClick={onBack} className="text-[#22d3ee] hover:underline">Sign in</button>
      </p>
    </>
  );
}

function ForgotScreen({ onBack, onOtpSent }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      onOtpSent(email, data.devOtp || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white">Reset password</h2>
          <p className="text-white/50 text-sm">We&apos;ll send an OTP to your email</p>
        </div>
      </div>
      {error && <Alert msg={error} />}
      <form onSubmit={onSubmit} className="space-y-4">
        <Field icon={Mail} label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        <Btn loading={loading} label="Send OTP" icon={KeyRound} />
      </form>
    </>
  );
}

function OtpScreen({ email, devOtp, onBack }) {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setSuccess('Password reset! You can now sign in.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-white">Enter OTP</h2>
          <p className="text-white/50 text-sm">Check <span className="text-white/80">{email}</span></p>
        </div>
      </div>
      {devOtp && (
        <div className="flex items-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-400/30 px-4 py-3 text-amber-200 text-sm">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Dev mode — your OTP is: <strong className="font-mono tracking-widest">{devOtp}</strong></span>
        </div>
      )}
      {error && <Alert msg={error} />}
      {success && <Alert msg={success} success />}
      {!success && (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field icon={ShieldCheck} label="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" autoComplete="one-time-code" />
          <PasswordField label="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
          <Btn loading={loading} label="Reset Password" icon={KeyRound} />
        </form>
      )}
      {success && (
        <button onClick={onBack} className="btn-primary rounded-2xl w-full py-4 text-sm font-semibold flex items-center justify-center gap-2">
          <LogIn className="w-4 h-4" /> Go to Sign In
        </button>
      )}
    </>
  );
}

// ─── ROOT ────────────────────────────────────────────────────────────────────

const SCREENS = ['login', 'signup', 'forgot', 'otp'];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState('login');
  const [resetEmail, setResetEmail] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [dir, setDir] = useState(1);

  const handleAuthenticated = (token) => {
    login(token);
    navigate('/', { replace: true });
  };

  const go = (next) => {
    setDir(SCREENS.indexOf(next) >= SCREENS.indexOf(screen) ? 1 : -1);
    setScreen(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border rounded-[24px] p-8 w-full max-w-md space-y-6 overflow-hidden"
      >
        {/* logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/35 pulse-neon">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">InvenFlow</p>
            <p className="text-lg font-black text-white neon-text">CoreInventory</p>
          </div>
        </div>

        {/* animated screen */}
        <AnimatePresence mode="wait">
          <motion.div key={screen} {...slide(dir)} className="space-y-5">
            {screen === 'login'  && <LoginScreen  onSignUp={() => go('signup')} onForgot={() => go('forgot')} login={handleAuthenticated} />}
            {screen === 'signup' && <SignUpScreen  onBack={() => go('login')} login={handleAuthenticated} />}
            {screen === 'forgot' && <ForgotScreen  onBack={() => go('login')} onOtpSent={(e, otp) => { setResetEmail(e); setDevOtp(otp || ''); go('otp'); }} />}
            {screen === 'otp'   && <OtpScreen     email={resetEmail} devOtp={devOtp} onBack={() => go('login')} />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

