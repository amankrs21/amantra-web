import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getPasswordStrength } from '../../utils/password-generator';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await register(name, email, password);
      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp', { state: { email } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="w-full max-w-sm mx-auto">

      {/* Brand */}
      <div className="text-center mb-6">
        <img src="/favicon.svg" alt="Amantra" className="w-12 h-12 mx-auto mb-3" />
        <h1 className="text-2xl font-bold gradient-text mb-1">Create Account</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Start securing your digital life</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none">
              <User size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input type="text" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} className="input" style={{ paddingLeft: "2.5rem" }} required />
          </div>
        </div>

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
            <input type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={password}
              onChange={e => setPassword(e.target.value)} className="input" style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }} required minLength={8} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-0 top-0 bottom-0 flex items-center px-3"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                    style={{ background: i <= strength.score ? strength.color : 'var(--bg-surface-lighter)' }} />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-secondary)' }}>
        Already have an account? <Link to="/login" className="link-animated font-semibold">Sign in</Link>
      </p>
    </motion.div>
  );
}
