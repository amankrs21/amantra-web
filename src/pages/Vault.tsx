import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid3X3, List, Lock, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { vaultAPI } from '../services/api';
import { useEncryptionKey } from '../hooks/useEncryptionKey';
import { vaultCategories } from '../utils/categories';
import VaultCard from '../components/vault/VaultCard';
import VaultFormModal from '../components/vault/VaultFormModal';
import PasswordGenerator from '../components/vault/PasswordGenerator';
import Modal from '../components/ui/Modal';

interface VaultItem {
  _id: string;
  title: string;
  username: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const PAGE_SIZES = [30, 50];
const PAGE_SIZE_STORAGE_KEY = 'vaultPageSize';

export default function Vault() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<VaultItem | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof localStorage === 'undefined') return PAGE_SIZES[0];
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    return PAGE_SIZES.includes(stored) ? stored : PAGE_SIZES[0];
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'username'>('updated');
  const [confirmDelete, setConfirmDelete] = useState<VaultItem | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { pin, setPin, verifyPin } = useEncryptionKey();
  const suggestionListId = 'vault-search-suggestions';

  const fetchPage = useCallback(async (nextOffset: number, append: boolean) => {
    const res = await vaultAPI.fetch({ pageSize, offSet: nextOffset });
    const data = res.data.items || res.data || [];
    setItems(prev => (append ? [...prev, ...data] : data));
    setOffset(nextOffset + data.length);
    setHasMore(data.length === pageSize);
  }, [pageSize]);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPage(0, false);
    } catch {
      toast.error('Failed to load vault');
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await fetchPage(offset, true);
    } catch {
      toast.error('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setSelectedIds(new Set());
    setBulkMode(false);
    loadInitial();
  }, [loadInitial, pageSize]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => items.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.username.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || item.category === category;
    return matchSearch && matchCategory;
  }), [items, search, category]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    if (sortBy === 'title') next.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'username') next.sort((a, b) => a.username.localeCompare(b.username));
    else next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return next;
  }, [filtered, sortBy]);

  const suggestions = useMemo(() => {
    const pool = items.flatMap(item => [item.title, item.username]);
    return Array.from(new Set(pool.filter(Boolean))).slice(0, 10);
  }, [items]);

  const categoryCount = (cat: string) => cat === 'all' ? items.length : items.filter(i => i.category === cat).length;

  const requestDelete = (item: VaultItem) => {
    setConfirmDelete(item);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    try {
      await vaultAPI.delete(id);
      setItems(prev => prev.filter(i => i._id !== id));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      setConfirmBulkDelete(false);
      return;
    }
    try {
      await Promise.all(ids.map(id => vaultAPI.delete(id)));
      setItems(prev => prev.filter(i => !selectedIds.has(i._id)));
      setSelectedIds(new Set());
      setBulkMode(false);
      toast.success(`Deleted ${ids.length} items`);
    } catch {
      toast.error('Failed to delete some items');
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Vault</h1>
          <span className="badge badge-purple">{items.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGenerator(true)} className="btn btn-secondary text-sm"><KeyRound size={16} /> Generator</button>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn btn-primary text-sm"><Plus size={16} /> Add</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input ref={searchRef} type="text" placeholder="Search vault..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: "2.5rem" }} list={suggestionListId} />
          <datalist id={suggestionListId}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Sort vault"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'updated' | 'title' | 'username')}
            className="input text-sm py-2"
          >
            <option value="updated">Recently Updated</option>
            <option value="title">Title (A-Z)</option>
            <option value="username">Username (A-Z)</option>
          </select>
          <select
            aria-label="Items per page"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="input text-sm py-2"
          >
            {PAGE_SIZES.map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <button onClick={() => setView('grid')} className={`btn btn-ghost btn-icon ${view === 'grid' ? 'bg-[var(--bg-surface-light)]' : ''}`}><Grid3X3 size={16} /></button>
          <button onClick={() => setView('list')} className={`btn btn-ghost btn-icon ${view === 'list' ? 'bg-[var(--bg-surface-light)]' : ''}`}><List size={16} /></button>
          <button onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }} className={`btn text-sm ${bulkMode ? 'btn-danger' : 'btn-secondary'}`}>
            {bulkMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {[{ value: 'all', label: 'All' }, ...vaultCategories].map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${category === cat.value ? 'text-white' : ''}`}
            style={{ background: category === cat.value ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'var(--bg-surface-light)', color: category === cat.value ? 'white' : 'var(--text-secondary)' }}>
            {cat.label} ({categoryCount(cat.value)})
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-3 flex items-center justify-between">
            <span className="text-sm">{selectedIds.size} selected</span>
            <button onClick={() => setConfirmBulkDelete(true)} className="btn btn-danger text-sm"><Trash2 size={14} /> Delete</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Items */}
      {loading ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Lock size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {search ? 'Try a different search term' : 'Add your first password to get started'}
          </p>
          {!search && <button onClick={() => setShowForm(true)} className="btn btn-primary"><Plus size={16} /> Add Password</button>}
        </motion.div>
      ) : (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          <AnimatePresence>
            {sorted.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                <VaultCard
                  item={item}
                  onEdit={() => { setEditItem(item); setShowForm(true); }}
                  onDelete={() => requestDelete(item)}
                  bulkMode={bulkMode}
                  selected={selectedIds.has(item._id)}
                  onToggleSelect={() => toggleSelect(item._id)}
                  pin={pin}
                  setPin={setPin}
                  verifyPin={verifyPin}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {!loading && hasMore && sorted.length > 0 && (
        <div className="flex justify-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn btn-secondary">
            {loadingMore ? <span className="spinner" /> : `Load more (${pageSize})`}
          </button>
        </div>
      )}

      {/* FAB mobile */}
      <button onClick={() => { setEditItem(null); setShowForm(true); }} className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
        <Plus size={24} className="text-white" />
      </button>

      {/* Modals */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete vault item?">
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
      <Modal open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} title="Delete selected items?">
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This will permanently delete {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'}.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmBulkDelete(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleBulkDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
      <VaultFormModal open={showForm} onClose={() => { setShowForm(false); setEditItem(null); }} onSaved={loadInitial} editItem={editItem} />
      <PasswordGenerator open={showGenerator} onClose={() => setShowGenerator(false)} />
    </div>
  );
}
