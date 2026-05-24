import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../utils/api-error';

interface OTPFormProps { email: string }

export default function OTPForm({ email }: OTPFormProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const { verify, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp]; text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const code = otp.join('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    try {
      await verify(email, code);
      toast.success('Email verified! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Verification failed'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.15)' }}>
        <Shield size={28} style={{ color: 'var(--success)' }} />
      </motion.div>
      <h1 className="text-3xl font-bold gradient-text mb-2">Verify Email</h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Enter the 6-digit code sent to <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="card p-8">
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <motion.input key={i} ref={el => { refs.current[i] = el; }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl outline-none transition-all"
              style={{
                background: 'var(--bg-surface-light)',
                border: digit ? '2px solid var(--accent-purple)' : '1px solid var(--border)',
                color: 'var(--text-primary)',
                caretColor: 'var(--accent-purple)',
              }}
            />
          ))}
        </div>

        <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full py-3">
          {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> Verify</>}
        </button>
      </form>
    </motion.div>
  );
}
