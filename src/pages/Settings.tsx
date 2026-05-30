import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Palette, AlertTriangle, Save, Check, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../utils/api-error';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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

  useEffect(() => {
    userAPI.fetch().then(res => {
      const u = res.data.user || res.data;
      if (u.name) setName(u.name);
      if (u.dateOfBirth) setDob(u.dateOfBirth.split('T')[0]);
      if (u.weatherCity) { setWeatherCity(u.weatherCity); localStorage.setItem('weatherCity', u.weatherCity); }
    }).catch(() => { });
  }, []);

  useEffect(() => {
    setAvatarOk(true);
  }, [user?.id, user?.avatarUrl]);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await userAPI.update({ name, dateOfBirth: dob || undefined, weatherCity: weatherCity || undefined });
      if (weatherCity) localStorage.setItem('weatherCity', weatherCity);
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


  const deactivateAccount = async () => {
    if (!confirm('This will permanently delete your account. Are you sure?')) return;
    setDeactivating(true);
    try {
      await userAPI.deactivate();
      logout();
      navigate('/');
      toast.success('Account deactivated');
    } catch { toast.error('Failed'); }
    finally { setDeactivating(false); }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
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
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6 space-y-5">
            <div className="flex items-center gap-4 mb-6">
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
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Weather City</label>
              <input type="text" value={weatherCity} onChange={e => setWeatherCity(e.target.value)} className="input" placeholder="e.g. London" />
            </div>
            <button onClick={saveProfile} disabled={profileSaving} className="btn btn-primary">
              {profileSaving ? <span className="spinner" /> : profileSaved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save</>}
            </button>
          </motion.div>
        )}

        {activeTab === 'appearance' && (
          <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Theme</h3>
            <div className="grid grid-cols-3 gap-4">
              {([
                { value: 'dark' as const, label: 'Dark', icon: Moon, bg: '#050510', surface: '#0d0d24' },
                { value: 'light' as const, label: 'Light', icon: Sun, bg: '#f5f5ff', surface: '#ffffff' },
                { value: 'system' as const, label: 'System', icon: Monitor, bg: '#1a1a2e', surface: '#25254a' },
              ]).map(t => (
                <button key={t.value} onClick={() => setTheme(t.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${theme === t.value ? 'border-[var(--accent-purple)]' : 'border-transparent'}`}
                  style={{ background: 'var(--bg-surface-light)' }}>
                  <div className="w-full h-16 rounded-lg mb-3 overflow-hidden flex flex-col" style={{ background: t.bg }}>
                    <div className="h-3 w-full" style={{ background: t.surface }} />
                    <div className="flex-1 flex items-center justify-center"><t.icon size={20} style={{ color: '#aaa' }} /></div>
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Current Password</label>
                <div className="relative">
                  <input type={showPasswords ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="input pr-10" />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-icon p-1" aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>
                    <span className="text-base leading-none">{showPasswords ? '🙈' : '🙉'}</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">New Password</label>
                <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
                <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" />
                {confirmPassword && confirmPassword !== newPassword && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Passwords don't match</p>}
              </div>
              <button onClick={changePassword} disabled={passwordSaving} className="btn btn-primary">
                {passwordSaving ? <span className="spinner" /> : 'Change Password'}
              </button>
            </div>

          </motion.div>
        )}

        {activeTab === 'danger' && (
          <motion.div key="danger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card p-6 border-2" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
              <h3 className="text-lg font-semibold" style={{ color: 'var(--danger)' }}>Danger Zone</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Once you deactivate your account, all your data will be permanently deleted. This action cannot be undone.
            </p>
            <button onClick={deactivateAccount} disabled={deactivating} className="btn btn-danger">
              {deactivating ? <span className="spinner" /> : <><Trash2 size={16} /> Deactivate Account</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
