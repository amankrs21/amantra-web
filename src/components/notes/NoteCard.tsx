import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Edit, Trash2, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { notesAPI } from '../../services/api';
import { getCategoryLabel, noteCategories } from '../../utils/categories';

interface NoteItem {
  _id: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  item: NoteItem;
  onEdit: () => void;
  onDelete: () => void;
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

export default function NoteCard({ item, onEdit, onDelete, requireKey }: Props) {
  const [decrypted, setDecrypted] = useState<{ content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDecrypt = async () => {
    if (decrypted) { setDecrypted(null); setExpanded(false); return; }
    setLoading(true);
    try {
      const key = await requireKey();
      if (!key) return;
      const res = await notesAPI.decrypt(item._id, key);
      setDecrypted(res.data);
    } catch { toast.error('Decryption failed'); }
    finally { setLoading(false); }
  };

  const catIcon = noteCategories.find(c => c.value === item.category);
  const CatIcon = catIcon?.icon || FileText;

  return (
    <motion.div layout className={`card-interactive p-0 overflow-hidden category-${item.category}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
              <CatIcon size={18} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(item.updatedAt)}</div>
            </div>
          </div>
          <span className="badge badge-cyan text-[10px] shrink-0">{getCategoryLabel(noteCategories, item.category)}</span>
        </div>

        <AnimatePresence>
          {decrypted && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-3 rounded-lg mb-3 text-sm whitespace-pre-wrap" style={{ background: 'var(--bg-surface-light)' }}>
                <div className={expanded ? '' : 'line-clamp-3'}>{decrypted.content}</div>
                {decrypted.content.length > 150 && (
                  <button onClick={() => setExpanded(!expanded)} className="text-xs mt-1 link-animated" style={{ color: 'var(--accent-cyan)' }}>
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-end gap-1">
          <button onClick={handleDecrypt} disabled={loading} className="btn btn-ghost btn-icon p-1.5">
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : decrypted ? <Lock size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={onEdit} className="btn btn-ghost btn-icon p-1.5"><Edit size={14} /></button>
          <button onClick={onDelete} className="btn btn-ghost btn-icon p-1.5" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
        </div>
      </div>
    </motion.div>
  );
}
