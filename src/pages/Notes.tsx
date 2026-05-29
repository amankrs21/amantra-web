import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid3X3, List, FileText, SortAsc, SortDesc } from 'lucide-react';
import { toast } from 'sonner';
import { notesAPI } from '../services/api';
import { noteCategories } from '../utils/categories';
import NoteCard from '../components/notes/NoteCard';
import Modal from '../components/ui/Modal';
import { useEncryptionKey } from '../hooks/useEncryptionKey';
import { getApiErrorMessage } from '../utils/api-error';

interface NoteItem {
  _id: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const [items, setItems] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortAsc, setSortAsc] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<NoteItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<NoteItem | null>(null);
  const { requireKey } = useEncryptionKey();

  const fetchItems = useCallback(async () => {
    try {
      const res = await notesAPI.fetch();
      setItems(res.data.items || res.data || []);
    } catch { toast.error('Failed to load notes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = items
    .filter(item => {
      const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || item.category === category;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

  const requestDelete = (item: NoteItem) => {
    setConfirmDelete(item);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete._id;
    try {
      await notesAPI.delete(id);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setConfirmDelete(null);
    }
  };

  const openForm = (item?: NoteItem) => {
    if (item) {
      setEditItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setFormContent('');
    } else {
      setEditItem(null);
      setFormTitle('');
      setFormContent('');
      setFormCategory('personal');
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formContent) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      const key = await requireKey();
      if (!key) return;
      if (editItem) {
        await notesAPI.update({ id: editItem._id, title: formTitle, content: formContent, key, category: formCategory });
        toast.success('Updated');
      } else {
        await notesAPI.add({ title: formTitle, content: formContent, key, category: formCategory });
        toast.success('Note created');
      }
      fetchItems();
      setShowForm(false);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to save'));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notes</h1>
          <span className="badge badge-cyan">{items.length}</span>
        </div>
        <button onClick={() => openForm()} className="btn btn-primary text-sm"><Plus size={16} /> New Note</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="input" style={{ paddingLeft: "2.5rem" }} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={`btn btn-ghost btn-icon ${view === 'grid' ? 'bg-[var(--bg-surface-light)]' : ''}`}><Grid3X3 size={16} /></button>
          <button onClick={() => setView('list')} className={`btn btn-ghost btn-icon ${view === 'list' ? 'bg-[var(--bg-surface-light)]' : ''}`}><List size={16} /></button>
          <button onClick={() => setSortAsc(!sortAsc)} className="btn btn-ghost btn-icon">{sortAsc ? <SortAsc size={16} /> : <SortDesc size={16} />}</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ value: 'all', label: 'All' }, ...noteCategories].map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
            style={{ background: category === cat.value ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' : 'var(--bg-surface-light)', color: category === cat.value ? 'white' : 'var(--text-secondary)' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Create your first encrypted note</p>
          <button onClick={() => openForm()} className="btn btn-primary"><Plus size={16} /> New Note</button>
        </div>
      ) : (
        <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <NoteCard item={item} onEdit={() => openForm(item)} onDelete={() => requestDelete(item)} requireKey={requireKey} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <button onClick={() => openForm()} className="fixed bottom-6 right-6 md:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))' }}>
        <Plus size={24} className="text-white" />
      </button>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete note?">
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This will permanently delete {confirmDelete?.title ? `"${confirmDelete.title}"` : 'this note'}.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Note' : 'New Note'}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="input" placeholder="Note title" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Content *</label>
            <textarea value={formContent} onChange={e => setFormContent(e.target.value)} className="input" rows={6} placeholder="Write your note..." />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {noteCategories.map(cat => (
                <button key={cat.value} type="button" onClick={() => setFormCategory(cat.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${formCategory === cat.value ? 'ring-2 ring-[var(--accent-cyan)]' : ''}`}
                  style={{ background: formCategory === cat.value ? 'var(--bg-surface-lighter)' : 'var(--bg-surface-light)' }}>
                  <cat.icon size={12} /> {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? <span className="spinner" /> : editItem ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
