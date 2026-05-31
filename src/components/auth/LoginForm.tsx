import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../utils/api-error';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const { login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Login failed'));
    }
  };

  const handleGoogleCredential = useCallback(async (credential: string) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Google login failed'));
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;

    const ensureScript = () => new Promise<void>((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-google-identity]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Google script failed to load')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google script failed to load'));
      document.head.appendChild(script);
    });

    const initGoogle = async () => {
      try {
        await ensureScript();
        if (cancelled) return;
        const google = window.google;
        if (!google?.accounts?.id) {
          throw new Error('Google SDK unavailable');
        }
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (!response?.credential) {
              toast.error('Google login failed');
              return;
            }
            void handleGoogleCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = '';
          const width = Math.min(360, googleButtonRef.current.offsetWidth || 360);
          google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width,
          });
        }
      } catch (err) {
        if (!cancelled) setGoogleError('Google sign-in unavailable');
      }
    };

    void initGoogle();
    return () => {
      cancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="w-full max-w-sm mx-auto">

      {/* Brand */}
      <div className="text-center mb-6">
        <img src="/favicon.svg" alt="Amantra" className="w-12 h-12 mx-auto mb-3" />
        <h1 className="text-2xl font-bold gradient-text mb-1">Welcome Back</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <Mail size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} className="input" style={{ paddingLeft: "2.5rem" }} required />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Password</label>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} className="input" style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} required />
            <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-0 top-0 bottom-0 flex items-center px-3"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <span className="text-base leading-none">{showPw ? '🙈' : '🫣'}</span>
            </button>
          </div>
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[var(--accent-purple)]" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-sm link-animated">Forgot?</Link>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><hr className="w-full" style={{ borderColor: 'var(--border)' }} /></div>
          <div className="relative flex justify-center text-xs"><span className="px-3" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>or</span></div>
        </div>

        {/* Google */}
        {googleClientId && !googleError ? (
          <div className={`w-full ${loading || googleLoading ? 'opacity-60 pointer-events-none' : ''}`}>
            <div ref={googleButtonRef} className="w-full flex justify-center" />
          </div>
        ) : (
          <button type="button" disabled className="btn btn-secondary w-full opacity-60 cursor-not-allowed">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        )}
        {!googleClientId && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.
          </p>
        )}
        {googleError && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
            Google sign-in is unavailable right now.
          </p>
        )}
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" className="link-animated font-semibold">Sign up</Link>
      </p>
    </motion.div>
  );
}
