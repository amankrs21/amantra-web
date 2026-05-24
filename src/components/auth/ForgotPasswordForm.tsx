import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../utils/api-error';

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { forgotPassword, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email');
      setStep('reset');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to send OTP'));
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset! Please login.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Reset failed'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="w-full max-w-sm mx-auto">

      {/* Brand */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <KeyRound size={24} style={{ color: 'var(--warning)' }} />
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-1">
          {step === 'email' ? 'Forgot Password' : 'Reset Password'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {step === 'email' ? "We'll send a code to your email" : 'Enter the OTP and new password'}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {['email', 'reset'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step === s || (i === 0 && step === 'reset') ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'var(--bg-surface-light)',
                color: step === s || (i === 0 && step === 'reset') ? 'white' : 'var(--text-secondary)',
              }}>
              {i === 0 && step === 'reset' ? <CheckCircle size={12} /> : i + 1}
            </div>
            {i === 0 && <div className="w-10 h-0.5 rounded-full" style={{ background: step === 'reset' ? 'var(--accent-purple)' : 'var(--border)' }} />}
          </div>
        ))}
      </div>

      <form onSubmit={step === 'email' ? handleEmail : handleReset} className="card p-6 space-y-4">
        {step === 'email' ? (
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} className="input" style={{ paddingLeft: "2.5rem" }} required />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>OTP Code</label>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                  <KeyRound size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <input type="text" placeholder="6-digit code" value={otp}
                  onChange={e => setOtp(e.target.value)} className="input tracking-widest font-mono" style={{ paddingLeft: "2.5rem" }} maxLength={6} required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>New Password</label>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} className="input" style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} required minLength={8} />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 bottom-0 flex items-center px-3"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <span className="text-base leading-none">{showPw ? '🙈' : '🫣'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3">
          {step === 'reset' && (
            <button type="button" onClick={() => setStep('email')} className="btn btn-secondary">
              <ArrowLeft size={16} />
            </button>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? <span className="spinner" /> : <>{step === 'email' ? 'Send OTP' : 'Reset Password'} <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
        <Link to="/login" className="link-animated font-semibold">Back to login</Link>
      </p>
    </motion.div>
  );
}
