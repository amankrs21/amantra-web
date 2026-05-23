import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, Film, Newspaper, Plus, TrendingUp, Zap, Cloud } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { vaultAPI, notesAPI, watchlistAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DASHBOARD_VAULT_PAGE_SIZE = 30;

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}{suffix}</span>;
}

function SecurityScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{score}</span>
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: string; desc: string; city: string } | null>(null);

  useEffect(() => {
    const city = localStorage.getItem('weatherCity');
    if (!city) return;
    fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`)
      .then(r => r.json())
      .then(data => {
        const current = data.current_condition?.[0];
        if (current) {
          setWeather({ temp: current.temp_C + '°C', desc: current.weatherDesc?.[0]?.value || '', city });
        }
      })
      .catch(() => { });
  }, []);

  if (!weather) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-4">
      <Cloud size={32} style={{ color: 'var(--accent-cyan)' }} />
      <div>
        <div className="text-2xl font-bold">{weather.temp}</div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{weather.desc} · {weather.city}</div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vault: 0, notes: 0, watchlist: 0, vaultHasMore: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      vaultAPI.fetch({ pageSize: DASHBOARD_VAULT_PAGE_SIZE, offSet: 0 }),
      notesAPI.fetch(),
      watchlistAPI.fetch(),
    ])
      .then(([v, n, w]) => {
        const vaultItems = v.status === 'fulfilled' ? (v.value.data?.items ?? v.value.data ?? []) : [];
        const vaultCount = Array.isArray(vaultItems) ? vaultItems.length : 0;
        const vaultHasMore = vaultCount >= DASHBOARD_VAULT_PAGE_SIZE;
        setStats({
          vault: vaultCount,
          notes: n.status === 'fulfilled' ? (n.value.data?.items?.length ?? n.value.data?.length ?? 0) : 0,
          watchlist: w.status === 'fulfilled' ? (w.value.data?.items?.length ?? w.value.data?.length ?? 0) : 0,
          vaultHasMore,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Vault Items', value: stats.vault, suffix: stats.vaultHasMore ? '+' : '', icon: Lock, color: 'var(--accent-purple)' },
    { label: 'Notes', value: stats.notes, suffix: '', icon: FileText, color: 'var(--accent-cyan)' },
    { label: 'Watchlist', value: stats.watchlist, suffix: '', icon: Film, color: 'var(--accent-pink)' },
  ];

  const quickActions = [
    { label: 'Add Password', icon: Plus, action: () => navigate('/vault'), color: 'var(--accent-purple)' },
    { label: 'New Note', icon: FileText, action: () => navigate('/notes'), color: 'var(--accent-cyan)' },
    { label: 'Add to Watchlist', icon: Film, action: () => navigate('/watchlist'), color: 'var(--accent-pink)' },
    { label: 'Read Newsletter', icon: Newspaper, action: () => navigate('/newsletter'), color: 'var(--accent-blue)' },
  ];

  const securityScore = Math.min(100, 40 + stats.vault * 5 + stats.notes * 3);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-cyan))' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' }}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'there'}!</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Your digital fortress is secure and ready.</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <s.icon size={22} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold">{loading ? <span className="skeleton w-8 h-6 inline-block" /> : <AnimatedCounter target={s.value} suffix={s.suffix} />}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((qa) => (
              <button key={qa.label} onClick={qa.action} className="card-interactive p-4 text-center group cursor-pointer">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 transition-transform group-hover:scale-110" style={{ background: `${qa.color}15` }}>
                  <qa.icon size={20} style={{ color: qa.color }} />
                </div>
                <div className="text-sm font-medium">{qa.label}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Security Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold mb-4">Security Score</h3>
          <SecurityScore score={securityScore} />
          <p className="text-sm mt-4 text-center" style={{ color: 'var(--text-secondary)' }}>
            {securityScore >= 80 ? 'Excellent! Your vault is well maintained.' : 'Add more items to improve your score.'}
          </p>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tips */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: 'var(--warning)' }} />
            <h3 className="font-semibold">Tips</h3>
          </div>
          <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Use unique passwords for every account</li>
            <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Enable 2FA wherever possible</li>
            <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Regularly review and update old passwords</li>
            <li className="flex items-start gap-2"><Shield size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-purple)' }} /> Your encryption PIN never leaves your device</li>
          </ul>
        </motion.div>

        <WeatherWidget />
      </div>
    </div>
  );
}
