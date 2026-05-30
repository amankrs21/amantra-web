import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Eye, Edit, Trash2, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { vaultAPI } from '../../services/api';
import { getCategoryLabel, vaultCategories } from '../../utils/categories';

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
  requireKey: () => Promise<string | null>;
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

export default function VaultCard({ item, onEdit, onDelete, bulkMode, selected, onToggleSelect, requireKey }: Props) {
  const [decrypted, setDecrypted] = useState<{ password: string; notes?: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showPassword) {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      return;
    }
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setShowPassword(false);
      hideTimerRef.current = null;
    }, 5000);
    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [showPassword]);

  const handleDecrypt = async () => {
    if (decrypted) { setDecrypted(null); setShowPassword(false); return; }
    setLoading(true);
    try {
      const key = await requireKey();
      if (!key) return;
      const res = await vaultAPI.decrypt(item._id, key);
      const password = decodeBase64(res.data?.password || '');
      setDecrypted({ ...res.data, password });
    } catch { toast.error('Decryption failed. Check your encryption key.'); }
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (!bulkMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) return;
    onToggleSelect();
  };

  return (
    <motion.div
      layout
      onClick={handleCardClick}
      className={`card-interactive relative p-0 overflow-hidden category-${item.category} ${selected ? 'ring-2 ring-[var(--accent-purple)]' : ''}`}
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
                    <button onClick={() => setShowPassword(!showPassword)} className="btn btn-ghost btn-icon p-1" title={showPassword ? 'Hide password' : 'Show password'}>
                      <span className="text-base leading-none">{showPassword ? '🙈' : '🙉'}</span>
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
              <>
                <button onClick={onEdit} className="btn btn-ghost btn-icon p-1.5" title="Edit"><Edit size={14} /></button>
                <button onClick={onDelete} className="btn btn-ghost btn-icon p-1.5" title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
