import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Film, Star, Trash2, Edit, ChevronDown, ChevronUp, Clock, Eye, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { watchlistAPI } from '../services/api';
import { watchlistCategories, watchlistStatuses } from '../utils/categories';
import Modal from '../components/ui/Modal';

interface WatchlistItem {
  _id: string;
  title: string;
  category: string;
  status: string;
  rating?: number;
  totalParts?: number;
  completedParts?: number;
  parts?: { partNumber: number; completed: boolean }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  to_watch: 'var(--accent-blue)',
  watching: 'var(--warning)',
  watched: 'var(--success)',
};

const statusIcons: Record<string, React.ElementType> = {
  to_watch: Clock,
  watching: Eye,
  watched: CheckCircle,
};

function StarRating({ rating, onChange, readonly }: { rating: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" disabled={readonly}
          onMouseEnter={() => !readonly && setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(i)} className="p-0 bg-transparent border-none cursor-pointer disabled:cursor-default">
          <Star size={16} fill={(hover || rating) >= i ? '#f59e0b' : 'transparent'} stroke={(hover || rating) >= i ? '#f59e0b' : 'var(--text-muted)'} />
        </button>
      ))}
    </div>
  );
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<WatchlistItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('movie');
  const [formStatus, setFormStatus] = useState('to_watch');
  const [formRating, setFormRating] = useState(0);
  const [formTotalParts, setFormTotalParts] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<WatchlistItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await watchlistAPI.fetch();
      setItems(res.data.items || res.data || []);
    } catch { toast.error('Failed to load watchlist'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  const openForm = (item?: WatchlistItem) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setFormStatus(item.status);
      setFormRating(item.rating || 0);
      setFormTotalParts(item.totalParts || 1);
      setFormNotes(item.notes || '');
    } else {
      setEditItem(null);
      setFormTitle(''); setFormCategory('movie'); setFormStatus('to_watch');
      setFormRating(0); setFormTotalParts(1); setFormNotes('');
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const data = { title: formTitle, category: formCategory, status: formStatus, rating: formRating, totalParts: formTotalParts, notes: formNotes };
      if (editItem) {
        await watchlistAPI.update(editItem._id, data);
        toast.success('Updated');
      } else {
        await watchlistAPI.add(data);
        toast.success('Added');
      }
      fetchItems();
      setShowForm(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const requestDelete = (item: WatchlistItem) => {
    setConfirmDelete(item);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    try {
      await watchlistAPI.delete(id);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    } finally {
      setConfirmDelete(null);
    }
  };

  const togglePart = async (item: WatchlistItem, partNum: number) => {
    const parts = item.parts?.map(p => p.partNumber === partNum ? { ...p, completed: !p.completed } : p) || [];
    const completedParts = parts.filter(p => p.completed).length;
    try {
      await watchlistAPI.update(item._id, { ...item, parts, completedParts });
      fetchItems();
    } catch { toast.error('Failed'); }
  };

  const cycleStatus = async (item: WatchlistItem) => {
    const order = ['to_watch', 'watching', 'watched'];
    const next = order[(order.indexOf(item.status) + 1) % order.length];
    try {
      await watchlistAPI.update(item._id, { status: next });
      fetchItems();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <span className="badge badge-warning">{items.length}</span>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary text-sm"><Plus size={16} /> Add</button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ value: 'all', label: 'All' }, ...watchlistCategories].map(cat => (
          <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: activeCategory === cat.value ? 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' : 'var(--bg-surface-light)', color: activeCategory === cat.value ? 'white' : 'var(--text-secondary)' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Film size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
          <button onClick={() => openForm()} className="btn btn-primary mt-4"><Plus size={16} /> Add to Watchlist</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((item, i) => {
              const StatusIcon = statusIcons[item.status] || Clock;
              const isExpanded = expandedId === item._id;
              const progress = item.totalParts ? ((item.completedParts || 0) / item.totalParts) * 100 : 0;

              return (
                <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} layout className="card-interactive p-0 overflow-hidden">
                  {/* Poster placeholder */}
                  <div className="h-32 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${statusColors[item.status]}30, var(--bg-surface-light))` }}>
                    <Film size={40} style={{ color: statusColors[item.status], opacity: 0.5 }} />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button onClick={() => cycleStatus(item)} className="badge text-[10px] cursor-pointer" style={{ background: `${statusColors[item.status]}20`, color: statusColors[item.status] }}>
                        <StatusIcon size={10} className="mr-1" />
                        {watchlistStatuses.find(s => s.value === item.status)?.label}
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold truncate flex-1">{item.title}</h3>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <StarRating rating={item.rating || 0} readonly />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category}</span>
                    </div>

                    {/* Progress */}
                    {item.totalParts && item.totalParts > 1 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                          <span>Progress</span>
                          <span>{item.completedParts || 0}/{item.totalParts}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-light)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: statusColors[item.status] }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <button onClick={() => setExpandedId(isExpanded ? null : item._id)} className="btn btn-ghost btn-icon p-1">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => openForm(item)} className="btn btn-ghost btn-icon p-1.5"><Edit size={14} /></button>
                        <button onClick={() => requestDelete(item)} className="btn btn-ghost btn-icon p-1.5" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Expanded */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-3 mt-3 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
                            {item.notes && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.notes}</p>}
                            {item.parts && item.parts.length > 0 && (
                              <div className="space-y-1">
                                {item.parts.map(part => (
                                  <label key={part.partNumber} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                                    <input type="checkbox" checked={part.completed} onChange={() => togglePart(item, part.partNumber)} className="accent-[var(--accent-purple)]" />
                                    <span style={{ textDecoration: part.completed ? 'line-through' : 'none', color: part.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                      Part {part.partNumber}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <button onClick={() => openForm()} className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-pink))' }}>
        <Plus size={24} className="text-white" />
      </button>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete watchlist item?">
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This will permanently delete {confirmDelete?.title ? `"${confirmDelete.title}"` : 'this item'}.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Item' : 'Add to Watchlist'}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="input" placeholder="Movie or series name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="input">
                {watchlistCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="input">
                {watchlistStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Rating</label>
            <StarRating rating={formRating} onChange={setFormRating} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Total Parts</label>
            <input type="number" min={1} value={formTotalParts} onChange={e => setFormTotalParts(+e.target.value)} className="input" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} className="input" rows={3} placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <span className="spinner" /> : editItem ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
