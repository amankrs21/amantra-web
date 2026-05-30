import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Lock, FileText, Film, Newspaper, Settings, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vault', icon: Lock, label: 'Vault' },
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/watchlist', icon: Film, label: 'Watchlist' },
  { to: '/newsletter', icon: Newspaper, label: 'Newsletter' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function NavContent({ collapsed, onNav }: { collapsed: boolean; onNav?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const [avatarOk, setAvatarOk] = useState(true);

  useEffect(() => {
    setAvatarOk(true);
  }, [user?.id, user?.avatarUrl]);

  const handleLogout = () => {
    setShowLogout(false);
    logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm animate-pulse-glow" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
          A
        </div>
        {!collapsed && <span className="font-bold text-lg gradient-text">Amantra</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group ${isActive
                ? 'font-semibold'
                : 'hover:bg-[var(--bg-surface-light)]'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', opacity: 0.15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={20} className="relative z-10 shrink-0" />
                {!collapsed && <span className="relative z-10">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50" style={{ background: 'var(--bg-surface-light)', color: 'var(--text-primary)' }}>
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))' }}>
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
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: 'var(--success)', borderColor: 'var(--bg-surface)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || 'User'}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</div>
            </div>
            <button onClick={() => setShowLogout(true)} className="btn btn-ghost btn-icon p-1" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowLogout(true)} className="btn btn-ghost btn-icon w-full" title="Logout">
            <LogOut size={18} />
          </button>
        )}
      </div>

      {/* Logout confirmation */}
      <Modal open={showLogout} onClose={() => setShowLogout(false)} title="Log out?">
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You will be signed out of your account.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowLogout(false)} className="btn btn-secondary text-sm">Cancel</button>
            <button onClick={handleLogout} className="btn btn-danger text-sm">Log out</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col relative border-r shrink-0"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <NavContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center border"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-50 md:hidden border-r"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 btn btn-ghost btn-icon">
                <X size={18} />
              </button>
              <NavContent collapsed={false} onNav={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
