import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, AlertTriangle, Save, Check, Trash2, Moon, Sun, Monitor, KeyRound, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useEncryptionKey } from '../hooks/useEncryptionKey';
import { pinAPI, userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/api-error';

const sanitizeWeatherCity = (value: string) => (
  value.trim().replace(/[^a-zA-Z0-9\s.'-]/g, '').slice(0, 64)
);

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { clearKey, hasServerKey, setHasServerKey } = useEncryptionKey();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState('');
  const [weatherCity, setWeatherCity] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Security
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);

  // Encryption key reset
  const [keyResetStep, setKeyResetStep] = useState<'idle' | 'verify'>('idle');
  const [keyResetOtp, setKeyResetOtp] = useState('');
  const [keyResetSending, setKeyResetSending] = useState(false);
  const [keyResetVerifying, setKeyResetVerifying] = useState(false);

  // Account deactivation
  const [deactivateStep, setDeactivateStep] = useState<'idle' | 'verify'>('idle');
  const [deactivateEmail, setDeactivateEmail] = useState('');
  const [deactivateOtp, setDeactivateOtp] = useState('');

  useEffect(() => {
    userAPI.fetch().then(res => {
      const u = res.data.user || res.data;
      if (u.name) setName(u.name);
      if (u.dateOfBirth) setDob(u.dateOfBirth.split('T')[0]);
      if (u.weatherCity) {
        const cleanedCity = sanitizeWeatherCity(u.weatherCity);
        setWeatherCity(cleanedCity);
        if (cleanedCity) localStorage.setItem('weatherCity', cleanedCity);
        else localStorage.removeItem('weatherCity');
      }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    setAvatarOk(true);
  }, [user?.id, user?.avatarUrl]);

  useEffect(() => {
    if (user?.email) setDeactivateEmail(user.email);
  }, [user?.email]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await userAPI.update({ name, dateOfBirth: dob || undefined, weatherCity: weatherCity || undefined });
      const cleanedCity = sanitizeWeatherCity(weatherCity);
      if (cleanedCity) localStorage.setItem('weatherCity', cleanedCity);
      else localStorage.removeItem('weatherCity');
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
    finally { setProfileSaving(false); }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error('Passwords don\'t match'); return; }
    if (newPassword.length < 6) { toast.error('Password too short'); return; }
    setPasswordSaving(true);
    try {
      await userAPI.changePassword({ oldPassword, newPassword });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed');
    } catch (err: any) { toast.error(getApiErrorMessage(err, 'Failed')); }
    finally { setPasswordSaving(false); }
  };

  // password field toggles for new/confirm
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestKeyResetOtp = async () => {
    setKeyResetSending(true);
    try {
      await pinAPI.requestResetOtp();
      setKeyResetStep('verify');
      toast.success('OTP sent to your email');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setKeyResetSending(false);
    }
  };

  const verifyKeyResetOtp = async () => {
    if (keyResetOtp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!confirm('This will permanently delete all encrypted passwords and notes. Continue?')) return;
    setKeyResetVerifying(true);
    try {
      await pinAPI.verifyResetOtp({ otp: keyResetOtp });
      clearKey();
      setHasServerKey(false);
      localStorage.setItem('isKeySet', '0');
      setKeyResetOtp('');
      setKeyResetStep('idle');
      toast.success('Encryption key reset. Set a new key when prompted.');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Reset failed'));
    } finally {
      setKeyResetVerifying(false);
    }
  };


  const requestDeactivateOtp = async () => {
    const email = deactivateEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Enter your email');
      return;
    }
    setDeactivating(true);
    try {
      await userAPI.requestDeactivateOtp({ email });
      setDeactivateStep('verify');
      toast.success('OTP sent to your email');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setDeactivating(false);
    }
  };

  const confirmDeactivateAccount = async () => {
    const email = deactivateEmail.trim().toLowerCase();
    if (!email) {
      toast.error('Enter your email');
      return;
    }
    if (deactivateOtp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!confirm('This will permanently delete your account and all data. Continue?')) return;
    setDeactivating(true);
    try {
      await userAPI.confirmDeactivateOtp({ email, otp: deactivateOtp });
      logout();
      navigate('/');
      toast.success('Account deactivated');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Failed to deactivate account'));
    }
    finally { setDeactivating(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'var(--bg-surface-light)',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 0% 0%, rgba(59,130,246,0.18), rgba(236,72,153,0.08), transparent 60%)' }} />
              <div className="relative p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' }}>
                  {user?.avatarUrl && avatarOk ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.name || 'User'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarOk(false)}
                    />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{name || 'Your Profile'}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email || 'Email unavailable'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>Profile</span>
                    <span className="px-3 py-1 rounded-full" style={{ background: hasServerKey ? 'rgba(16,185,129,0.15)' : 'rgba(234,179,8,0.15)', color: hasServerKey ? 'var(--success)' : 'var(--warning)' }}>
                      Encryption key {hasServerKey ? 'set' : 'not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Profile details</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Update your name and preferences for a personalized experience.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <input type="email" value={user?.email || ''} className="input opacity-70" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Weather City</label>
                  <input type="text" value={weatherCity} onChange={e => setWeatherCity(e.target.value)} className="input" placeholder="e.g. London" />
                </div>
              </div>
              <button onClick={saveProfile} disabled={profileSaving} className="btn btn-primary">
                {profileSaving ? <span className="spinner" /> : profileSaved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save</>}
              </button>
            </div>

            <div className="card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Change Password</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Use a strong password to keep your vault protected.</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Current Password</label>
                <div className="relative">
                  <input type={showPasswords ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="input pr-12" />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    style={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span className="text-base leading-none">{showPasswords ? '🙈' : '🙉'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">New Password</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input pr-12" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    style={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span className="text-base leading-none">{showNewPassword ? '🙈' : '🙉'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input pr-12" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    style={{ background: 'var(--bg-surface-light)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  >
                    <span className="text-base leading-none">{showConfirmPassword ? '🙈' : '🙉'}</span>
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Passwords don't match</p>}
              </div>
              <button onClick={changePassword} disabled={passwordSaving} className="btn btn-primary">
                {passwordSaving ? <span className="spinner" /> : 'Change Password'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'appearance' && (
          <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-lg font-semibold">Theme</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pick a vibe that matches your setup.</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(79,70,229,0.18)', color: 'var(--accent-blue)' }}>Live preview</span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {([
                  { value: 'dark' as const, label: 'Midnight', icon: Moon, bg: '#050510', surface: '#0d0d24', glow: 'rgba(6,182,212,0.25)' },
                  { value: 'light' as const, label: 'Daylight', icon: Sun, bg: '#f5f5ff', surface: '#ffffff', glow: 'rgba(236,72,153,0.2)' },
                  { value: 'system' as const, label: 'System', icon: Monitor, bg: '#1a1a2e', surface: '#25254a', glow: 'rgba(148,163,184,0.25)' },
                ]).map(t => {
                  const active = theme === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setTheme(t.value)}
                      className="relative overflow-hidden rounded-2xl border transition-all text-left p-4"
                      style={{
                        background: 'var(--bg-surface-light)',
                        borderColor: active ? 'var(--accent-purple)' : 'var(--border)',
                        boxShadow: active ? `0 0 22px ${t.glow}` : 'none',
                        transform: active ? 'translateY(-2px)' : 'translateY(0)',
                      }}
                      aria-pressed={active}
                    >
                      <div className="absolute inset-0" style={{ background: active ? 'linear-gradient(135deg, rgba(79,70,229,0.18), rgba(236,72,153,0.1))' : 'transparent' }} />
                      <div className="relative">
                        <div className="w-full h-20 rounded-xl mb-4 overflow-hidden flex flex-col" style={{ background: t.bg }}>
                          <div className="h-3 w-full" style={{ background: t.surface }} />
                          <div className="flex-1 flex items-center justify-center">
                            <t.icon size={22} style={{ color: active ? 'var(--text-primary)' : '#aaa' }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{t.label}</span>
                          {active ? <span className="text-xs" style={{ color: 'var(--accent-purple)' }}>Active</span> : null}
                        </div>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          {t.value === 'system' ? 'Follows device setting' : t.value === 'dark' ? 'Deep contrast, low glare' : 'Bright and clean palette'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'danger' && (
          <motion.div key="danger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-4">
            <div className="card p-6 border-2" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
                <h3 className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These actions are permanent. Proceed only if you understand the impact.
              </p>
            </div>

            <div className="card p-6 space-y-4 border" style={{ borderColor: 'rgba(234,179,8,0.35)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(234,179,8,0.18)', color: 'var(--warning)' }}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Forgot Encryption Key</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Reset your encryption key using OTP verification. This permanently deletes encrypted passwords and notes.
                  </p>
                </div>
              </div>

              <div className="rounded-lg p-3 text-xs" style={{ background: 'rgba(234,179,8,0.12)', color: 'var(--text-secondary)' }}>
                We will send a 6-digit code to {user?.email || 'your email address'}.
              </div>

              {keyResetStep === 'idle' ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Request a one-time code before resetting your key.</p>
                  <button onClick={requestKeyResetOtp} disabled={keyResetSending || keyResetVerifying} className="btn btn-secondary">
                    {keyResetSending ? <span className="spinner" /> : 'Send OTP'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">OTP Code</label>
                    <input
                      type="text"
                      value={keyResetOtp}
                      onChange={e => setKeyResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input tracking-widest font-mono"
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button onClick={verifyKeyResetOtp} disabled={keyResetVerifying} className="btn btn-danger">
                      {keyResetVerifying ? <span className="spinner" /> : 'Reset Encryption Key'}
                    </button>
                    <button onClick={requestKeyResetOtp} disabled={keyResetSending || keyResetVerifying} className="btn btn-secondary">
                      {keyResetSending ? <span className="spinner" /> : 'Resend OTP'}
                    </button>
                    <button
                      onClick={() => { setKeyResetStep('idle'); setKeyResetOtp(''); }}
                      disabled={keyResetSending || keyResetVerifying}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6 border-2" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="space-y-4">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Once you deactivate your account, all your data will be permanently deleted. Enter your email, request OTP, then confirm deletion.
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email confirmation</label>
                  <input
                    type="email"
                    value={deactivateEmail}
                    onChange={e => setDeactivateEmail(e.target.value)}
                    className="input"
                    placeholder={user?.email || 'you@example.com'}
                    disabled={deactivating}
                  />
                </div>

                {deactivateStep === 'verify' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">OTP Code</label>
                    <input
                      type="text"
                      value={deactivateOtp}
                      onChange={e => setDeactivateOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="input tracking-widest font-mono"
                      placeholder="6-digit code"
                      maxLength={6}
                      disabled={deactivating}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {deactivateStep === 'idle' ? (
                    <button onClick={requestDeactivateOtp} disabled={deactivating} className="btn btn-danger">
                      {deactivating ? <span className="spinner" /> : <><Trash2 size={16} /> Send OTP</>}
                    </button>
                  ) : (
                    <>
                      <button onClick={confirmDeactivateAccount} disabled={deactivating} className="btn btn-danger">
                        {deactivating ? <span className="spinner" /> : <><Trash2 size={16} /> Confirm Deactivation</>}
                      </button>
                      <button onClick={requestDeactivateOtp} disabled={deactivating} className="btn btn-secondary">
                        {deactivating ? <span className="spinner" /> : 'Resend OTP'}
                      </button>
                      <button
                        onClick={() => { setDeactivateStep('idle'); setDeactivateOtp(''); }}
                        disabled={deactivating}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
