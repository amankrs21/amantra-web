import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  FileText,
  Film,
  Newspaper,
  Plus,
  TrendingUp,
  Zap,
  Cloud,
  Sun,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DASHBOARD_VAULT_PAGE_SIZE = 30;
const OPEN_WEATHER_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

type WeatherData = {
  city: string;
  tempC: number;
  feelsLikeC: number;
  desc: string;
  humidity: number;
  windKmph: number;
  windDir: string;
  precipMm: number;
  minC: number;
  maxC: number;
  sunrise: string;
  sunset: string;
  hourly: { time: string; tempC: number; desc: string; chance: number }[];
};

function getGreeting(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Good night';
}

function formatHourLabel(hour24: number): string {
  const hour = hour24 % 24;
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function getWeatherIcon(desc: string) {
  const text = desc.toLowerCase();
  if (text.includes('thunder')) return CloudLightning;
  if (text.includes('snow') || text.includes('sleet')) return CloudSnow;
  if (text.includes('rain') || text.includes('drizzle')) return CloudRain;
  if (text.includes('sun') || text.includes('clear')) return Sun;
  if (text.includes('cloud')) return CloudSun;
  return Cloud;
}

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

function WeatherWidget({ city }: { city: string | null }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setWeather(null);
      return;
    }
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        if (OPEN_WEATHER_KEY) {
          const base = 'https://api.openweathermap.org/data/2.5';
          const [currentRes, forecastRes] = await Promise.all([
            fetch(`${base}/weather?q=${encodeURIComponent(city)}&appid=${OPEN_WEATHER_KEY}&units=metric`),
            fetch(`${base}/forecast?q=${encodeURIComponent(city)}&appid=${OPEN_WEATHER_KEY}&units=metric`),
          ]);
          if (!currentRes.ok || !forecastRes.ok) throw new Error('weather');
          const current = await currentRes.json();
          const forecast = await forecastRes.json();
          const hourly = (forecast.list || []).slice(0, 4).map((entry: any) => {
            const hour = new Date((entry.dt || 0) * 1000).getHours();
            return {
              time: formatHourLabel(hour),
              tempC: Math.round(entry.main?.temp ?? 0),
              desc: entry.weather?.[0]?.description || '',
              chance: Math.round((entry.pop ?? 0) * 100),
            };
          });
          const sunrise = current.sys?.sunrise
            ? new Date(current.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--';
          const sunset = current.sys?.sunset
            ? new Date(current.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--';
          const next: WeatherData = {
            city,
            tempC: Math.round(current.main?.temp ?? 0),
            feelsLikeC: Math.round(current.main?.feels_like ?? 0),
            desc: current.weather?.[0]?.description || 'Clear',
            humidity: Math.round(current.main?.humidity ?? 0),
            windKmph: Math.round((current.wind?.speed ?? 0) * 3.6),
            windDir: current.wind?.deg ? `${current.wind.deg}°` : '',
            precipMm: Math.round(current.rain?.['1h'] ?? 0),
            minC: Math.round(current.main?.temp_min ?? 0),
            maxC: Math.round(current.main?.temp_max ?? 0),
            sunrise,
            sunset,
            hourly,
          };
          if (active) setWeather(next);
        } else {
          const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
          const data = await res.json();
          const current = data.current_condition?.[0];
          const daily = data.weather?.[0];
          const astronomy = daily?.astronomy?.[0];
          const hourly = (daily?.hourly || []).slice(0, 4).map((entry: any) => {
            const hour = Math.floor(Number(entry.time || 0) / 100);
            return {
              time: formatHourLabel(hour),
              tempC: Math.round(Number(entry.tempC ?? 0)),
              desc: entry.weatherDesc?.[0]?.value || '',
              chance: Math.round(Number(entry.chanceofrain ?? 0)),
            };
          });
          const next: WeatherData = {
            city,
            tempC: Math.round(Number(current?.temp_C ?? 0)),
            feelsLikeC: Math.round(Number(current?.FeelsLikeC ?? 0)),
            desc: current?.weatherDesc?.[0]?.value || 'Clear',
            humidity: Math.round(Number(current?.humidity ?? 0)),
            windKmph: Math.round(Number(current?.windspeedKmph ?? 0)),
            windDir: current?.winddir16Point || '',
            precipMm: Math.round(Number(current?.precipMM ?? 0)),
            minC: Math.round(Number(daily?.mintempC ?? current?.temp_C ?? 0)),
            maxC: Math.round(Number(daily?.maxtempC ?? current?.temp_C ?? 0)),
            sunrise: astronomy?.sunrise || '--',
            sunset: astronomy?.sunset || '--',
            hourly,
          };
          if (active) setWeather(next);
        }
      } catch {
        if (active) setWeather(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [city]);

  if (!city) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6">
        <div className="absolute -top-16 -right-12 w-40 h-40 rounded-full" style={{ background: 'rgba(6, 182, 212, 0.18)', filter: 'blur(40px)' }} />
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6, 182, 212, 0.2)' }}>
            <MapPin size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="text-sm font-semibold">Set your weather city</div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Update it from Settings to unlock live conditions.</div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading && !weather) {
    return (
      <div className="card p-6">
        <div className="skeleton h-6 w-32 mb-4" />
        <div className="skeleton h-10 w-24 mb-2" />
        <div className="skeleton h-4 w-40" />
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card p-6">
        <div className="text-sm font-semibold">Weather unavailable</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Try again in a moment.</div>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.desc);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card relative overflow-hidden p-6 h-full"
    >
      <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full" style={{ background: 'rgba(14, 165, 233, 0.18)', filter: 'blur(50px)' }} />
      <div className="absolute -bottom-20 -left-16 w-48 h-48 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(50px)' }} />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Weather</div>
            <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={14} /> {weather.city}
            </div>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Live</div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14, 165, 233, 0.18)' }}>
                <WeatherIcon size={20} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{weather.desc}</div>
            </div>
            <div className="text-5xl font-semibold mt-2" style={{ letterSpacing: '-0.02em' }}>{weather.tempC}°</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Feels like {weather.feelsLikeC}°</div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>High / Low</div>
            <div className="text-sm font-semibold">{weather.maxC}° / {weather.minC}°</div>
            <div className="flex items-center justify-end gap-2 text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
              <Sunrise size={14} /> {weather.sunrise}
            </div>
            <div className="flex items-center justify-end gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Sunset size={14} /> {weather.sunset}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Humidity', value: `${weather.humidity}%`, icon: Droplets },
            { label: 'Wind', value: `${weather.windKmph} km/h`, icon: Wind },
            { label: 'Precip', value: `${weather.precipMm} mm`, icon: CloudRain },
          ].map((item) => (
            <div key={item.label} className="card-flat p-3" style={{ background: 'var(--bg-surface-light)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <item.icon size={14} /> {item.label}
              </div>
              <div className="text-sm font-semibold mt-1">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {weather.hourly.map((slot) => {
            const SlotIcon = getWeatherIcon(slot.desc);
            return (
              <div key={slot.time} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{slot.time}</div>
                <SlotIcon size={14} className="mx-auto mt-1" style={{ color: 'var(--accent-cyan)' }} />
                <div className="text-xs font-semibold mt-1">{slot.tempC}°</div>
                {/* <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{slot.chance}%</div> */}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ vault: 0, notes: 0, watchlist: 0, vaultHasMore: false, securityScore: 40 });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [avatarOk, setAvatarOk] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setAvatarOk(true);
  }, [user?.id, user?.avatarUrl]);

  useEffect(() => {
    userAPI.overview()
      .then((res) => {
        const counts = res.data?.counts || {};
        const vaultCount = Number(counts.vault ?? 0);
        setStats({
          vault: vaultCount,
          notes: Number(counts.notes ?? 0),
          watchlist: Number(counts.watchlist ?? 0),
          vaultHasMore: vaultCount >= DASHBOARD_VAULT_PAGE_SIZE,
          securityScore: Number(res.data?.securityScore ?? 40),
        });
      })
      .catch(() => setStats({ vault: 0, notes: 0, watchlist: 0, vaultHasMore: false, securityScore: 40 }))
      .finally(() => setLoading(false));
  }, []);

  const timeParts = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).formatToParts(now);
  const hour = timeParts.find(p => p.type === 'hour')?.value || '00';
  const minute = timeParts.find(p => p.type === 'minute')?.value || '00';
  const dayPeriod = timeParts.find(p => p.type === 'dayPeriod')?.value || '';
  const seconds = new Intl.DateTimeFormat('en-US', { second: '2-digit' }).format(now);
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
  const year = now.getFullYear();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const greeting = getGreeting(now.getHours());
  const firstName = user?.name?.split(' ')[0] || 'there';
  const city = user?.weatherCity ?? localStorage.getItem('weatherCity') ?? null;

  const statCards = [
    { label: 'Vault Items', value: stats.vault, suffix: '', icon: Lock, color: 'var(--accent-blue)', glow: 'rgba(79, 70, 229, 0.25)' },
    { label: 'Notes', value: stats.notes, suffix: '', icon: FileText, color: 'var(--accent-cyan)', glow: 'rgba(6, 182, 212, 0.25)' },
    { label: 'Watchlist', value: stats.watchlist, suffix: '', icon: Film, color: 'var(--accent-pink)', glow: 'rgba(236, 72, 153, 0.25)' },
  ];

  const quickActions = [
    { label: 'Add Password', icon: Plus, action: () => navigate('/vault'), color: 'var(--accent-blue)', bg: 'rgba(79, 70, 229, 0.18)' },
    { label: 'New Note', icon: FileText, action: () => navigate('/notes'), color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.18)' },
    { label: 'Add to Watchlist', icon: Film, action: () => navigate('/watchlist'), color: 'var(--accent-pink)', bg: 'rgba(236, 72, 153, 0.18)' },
    { label: 'Read Newsletter', icon: Newspaper, action: () => navigate('/newsletter'), color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.18)' },
  ];

  const securityScore = stats.securityScore;

  return (
    <div className="dashboard-wrap space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(14, 165, 233, 0.16), rgba(20, 83, 45, 0.04))' }} />
          <div className="absolute -top-24 right-6 w-56 h-56 rounded-full" style={{ background: 'rgba(59, 130, 246, 0.18)', filter: 'blur(60px)' }} />
          <div className="absolute -bottom-24 left-0 w-56 h-56 rounded-full" style={{ background: 'rgba(236, 72, 153, 0.14)', filter: 'blur(60px)' }} />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))' }}>
                  {user?.avatarUrl && avatarOk ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarOk(false)}
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div>
                  <div className="dashboard-kicker">Command Center</div>
                  <h1 className="dashboard-title text-3xl md:text-4xl">{greeting}, {firstName}</h1>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your private console for vault, notes, and watchlist flows.</p>
                </div>
              </div>
              <div className="lg:ml-auto w-full lg:w-auto">
                <div className="card-flat p-4" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={12} /> Local Time
                  </div>
                  <div className="flex items-end gap-2 mt-2">
                    <div className="text-4xl md:text-5xl font-semibold tracking-tight">{hour}:{minute}</div>
                    <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>{dayPeriod}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>:{seconds}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={12} /> {dateLabel}, {year}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{timeZone}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((qa, i) => (
                <motion.button
                  key={qa.label}
                  onClick={qa.action}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="card-interactive p-4 text-left"
                  style={{ background: `linear-gradient(135deg, ${qa.bg}, transparent)` }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: qa.bg }}>
                    <qa.icon size={18} style={{ color: qa.color }} />
                  </div>
                  <div className="text-sm font-medium">{qa.label}</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Jump in</div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <WeatherWidget city={city} />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="card relative overflow-hidden p-5">
            <div className="absolute inset-0" style={{ background: `radial-gradient(120% 120% at 100% 0%, ${s.glow}, transparent 60%)` }} />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold">{loading ? <span className="skeleton w-8 h-6 inline-block" /> : <AnimatedCounter target={s.value} suffix={s.suffix} />}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card relative overflow-hidden p-6">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg, rgba(14, 165, 233, 0.12), rgba(30, 64, 175, 0.04))' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>Security</div>
                <h3 className="text-lg font-semibold">Security Pulse</h3>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.2)' }}>
                <Shield size={18} style={{ color: 'var(--accent-blue)' }} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-6">
              <SecurityScore score={securityScore} />
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div>Vault weight: {stats.vault} items</div>
                <div>Notes weight: {stats.notes} entries</div>
                <div>Score improves as you add secure entries.</div>
              </div>
            </div>
            <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
              {securityScore >= 80 ? 'Excellent! Your vault is well maintained.' : 'Add more items to improve your score.'}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card relative overflow-hidden p-6">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg, rgba(20, 83, 45, 0.16), rgba(20, 83, 45, 0.02))' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: 'var(--warning)' }} />
              <h3 className="font-semibold">Tips for Today</h3>
            </div>
            <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Use unique passwords for every account</li>
              <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Enable 2FA wherever possible</li>
              <li className="flex items-start gap-2"><TrendingUp size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-cyan)' }} /> Regularly review and update old passwords</li>
              <li className="flex items-start gap-2"><Shield size={14} className="mt-1 shrink-0" style={{ color: 'var(--accent-blue)' }} /> Your encryption PIN never leaves your device</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
