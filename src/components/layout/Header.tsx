import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Sun, Moon, Monitor, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import Modal from '../ui/Modal';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/vault': 'Vault',
  '/notes': 'Notes',
  '/watchlist': 'Watchlist',
  '/newsletter': 'Newsletter',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, resolved } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);
  const userRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] || 'Amantra';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setAvatarOk(true);
  }, [user?.id, user?.avatarUrl]);

  const themeIcon = resolved === 'dark' ? <Moon size={18} /> : <Sun size={18} />;

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    navigate('/');
  };

  return (
    <header className="h-14 border-b flex items-center px-4 md:px-6 gap-4 shrink-0" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
      <button onClick={onMenuClick} className="btn btn-ghost btn-icon md:hidden">
        <Menu size={20} />
      </button>

      <h2 className="text-lg font-semibold flex-1">{title}</h2>

      {/* Theme toggle */}
      <div ref={themeRef} className="relative">
        <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="btn btn-ghost btn-icon">
          {themeIcon}
        </button>
        <AnimatePresence>
          {themeMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-36 card-flat p-1 z-50 shadow-lg"
              style={{ background: 'var(--bg-surface)' }}
            >
              {([['dark', Moon, 'Dark'], ['light', Sun, 'Light'], ['system', Monitor, 'System']] as const).map(([val, Icon, label]) => (
                <button key={val} onClick={() => { setTheme(val); setThemeMenuOpen(false); }} className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ${theme === val ? 'font-medium' : ''}`} style={{ background: theme === val ? 'var(--bg-surface-light)' : 'transparent', color: 'var(--text-primary)' }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User menu */}
      <div ref={userRef} className="relative">
        <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 btn btn-ghost px-2 py-1.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' }}>
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
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-48 card-flat p-1 z-50 shadow-lg"
              style={{ background: 'var(--bg-surface)' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
              <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--bg-surface-light)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                <User size={14} /> Profile
              </button>
              <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--bg-surface-light)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                <Settings size={14} /> Settings
              </button>
              <hr style={{ borderColor: 'var(--border)' }} className="my-1" />
              <button onClick={() => { setUserMenuOpen(false); setShowLogout(true); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--bg-surface-light)] transition-colors" style={{ color: 'var(--danger)' }}>
                <LogOut size={14} /> Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Log out?">
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You will be signed out of your account.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowLogout(false)} className="btn btn-secondary text-sm">Cancel</button>
            <button onClick={handleLogout} className="btn btn-danger text-sm">Log out</button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
