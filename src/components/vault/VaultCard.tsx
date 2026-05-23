import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Eye, EyeOff, Edit, Trash2, Check, Lock, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { vaultAPI } from '../../services/api';
import { getCategoryLabel, vaultCategories } from '../../utils/categories';
import { encodeKey } from '../../utils/crypto';

interface VaultItem {
  _id: string;
  title: string;
  username: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  item: VaultItem;
  onEdit: () => void;
  onDelete: () => void;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  pin: string;
  setPin: (v: string) => void;
  verifyPin: () => Promise<string | null>;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function decodeBase64(value: string): string {
  try {
    const binary = atob(value);
    try {
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return binary;
    }
  } catch {
    return value;
  }
}

export default function VaultCard({ item, onEdit, onDelete, bulkMode, selected, onToggleSelect, pin, setPin, verifyPin }: Props) {
  const [decrypted, setDecrypted] = useState<{ password: string; notes?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDecrypt = async () => {
    if (decrypted) { setDecrypted(null); setShowPassword(false); return; }
    if (!pin) { setShowPin(true); return; }
    setLoading(true);
    try {
      const key = encodeKey(pin);
      const res = await vaultAPI.decrypt(item._id, key);
      const password = decodeBase64(res.data?.password || '');
      setDecrypted({ ...res.data, password });
    } catch { toast.error('Decryption failed. Check your PIN.'); }
    finally { setLoading(false); }
  };

  const handlePinSubmit = async () => {
    setLoading(true);
    try {
      const key = await verifyPin();
      if (!key) return;
      const res = await vaultAPI.decrypt(item._id, key);
      const password = decodeBase64(res.data?.password || '');
      setDecrypted({ ...res.data, password });
      setShowPin(false);
    } catch { toast.error('Invalid PIN'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button onClick={() => copyToClipboard(text, label)} className="btn btn-ghost btn-icon p-1" title={`Copy ${label}`}>
      {copied === label ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
    </button>
  );

  return (
    <motion.div
      layout
      className={`card-interactive p-0 overflow-hidden category-${item.category} ${selected ? 'ring-2 ring-[var(--accent-purple)]' : ''}`}
    >
      {bulkMode && (
        <div className="absolute top-3 left-3 z-10">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} className="w-4 h-4 rounded accent-[var(--accent-purple)]" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
              {item.title.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.username}</div>
            </div>
          </div>
          <span className="badge badge-purple text-[10px] shrink-0">{getCategoryLabel(vaultCategories, item.category)}</span>
        </div>

        {/* PIN input */}
        <AnimatePresence>
          {showPin && !decrypted && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex gap-2 mb-3">
                <input type="password" placeholder="Enter PIN" value={pin} onChange={e => setPin(e.target.value)} className="input text-sm flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') handlePinSubmit(); }} />
                <button onClick={handlePinSubmit} disabled={loading} className="btn btn-primary text-sm px-3">
                  {loading ? <span className="spinner" /> : 'Unlock'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decrypted content */}
        <AnimatePresence>
          {decrypted && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-2 mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-surface-light)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Username</span>
                  <CopyBtn text={item.username} label="username" />
                </div>
                <div className="text-sm font-mono truncate">{item.username}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Password</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowPassword(!showPassword)} className="btn btn-ghost btn-icon p-1">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <CopyBtn text={decrypted.password} label="password" />
                  </div>
                </div>
                <div className="text-sm font-mono">{showPassword ? decrypted.password : '••••••••••'}</div>
                {decrypted.notes && (
                  <>
                    <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Notes</div>
                    <div className="text-sm line-clamp-3">{decrypted.notes}</div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.updatedAt)}</span>
          <div className="flex items-center gap-1">
            <button onClick={handleDecrypt} disabled={loading} className="btn btn-ghost btn-icon p-1.5" title={decrypted ? 'Lock' : 'Decrypt'}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : decrypted ? <Lock size={14} /> : <Eye size={14} />}
            </button>
            {!bulkMode && (
              <div ref={menuRef} className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="btn btn-ghost btn-icon p-1.5" title="More">
                  <MoreVertical size={14} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="absolute right-0 top-full mt-1 w-28 card-flat p-1 z-20 shadow-lg"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      <button onClick={() => { setMenuOpen(false); onEdit(); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--bg-surface-light)] transition-colors">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => { setMenuOpen(false); onDelete(); }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--bg-surface-light)] transition-colors" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
