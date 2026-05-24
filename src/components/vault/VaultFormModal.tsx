import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { vaultAPI } from '../../services/api';
import { vaultCategories } from '../../utils/categories';
import { encodeKey } from '../../utils/crypto';
import { getPasswordStrength } from '../../utils/password-generator';
import { useEncryptionKey } from '../../hooks/useEncryptionKey';
import Modal from '../ui/Modal';
import { getApiErrorMessage } from '../../utils/api-error';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem: { _id: string; title: string; username: string; category: string } | null;
}

export default function VaultFormModal({ open, onClose, onSaved, editItem }: Props) {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { pin } = useEncryptionKey();

  const decodeBase64 = (value: string) => {
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
  };

  useEffect(() => {
    if (!open) return;
    let active = true;
    const loadEditData = async () => {
      if (!editItem) {
        setTitle('');
        setUsername('');
        setPassword('');
        setNotes('');
        setCategory('other');
        return;
      }

      setTitle(editItem.title);
      setUsername(editItem.username);
      setCategory(editItem.category);
      setPassword('');
      setNotes('');

      if (!pin) return;

      try {
        const key = encodeKey(pin);
        const res = await vaultAPI.decrypt(editItem._id, key);
        if (!active) return;
        const passwordValue = decodeBase64(res.data?.password || '');
        setPassword(passwordValue);
        setNotes(res.data?.notes || '');
      } catch {
        if (active) toast.error('Failed to load password');
      }
    };

    loadEditData();
    return () => { active = false; };
  }, [editItem, open, pin]);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !username || !password) { toast.error('Fill all required fields'); return; }
    if (!pin) { toast.error('Enter your encryption PIN'); return; }
    setSaving(true);
    try {
      const key = encodeKey(pin);
      if (editItem) {
        await vaultAPI.update({ id: editItem._id, title, username, password, notes, category, key });
        toast.success('Updated');
      } else {
        await vaultAPI.add({ title, username, password, category, key });
        toast.success('Added to vault');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err, 'Failed to save'));
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editItem ? 'Edit Credential' : 'Add Credential'}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="e.g. Gmail" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Username / Email *</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input" placeholder="user@example.com" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Password *</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md"
              style={{ color: 'var(--text-secondary)', background: 'transparent' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <span className="text-base leading-none">{showPassword ? '🙈' : '🙉'}</span>
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-light)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(strength.score / 6) * 100}%`, background: strength.color }} />
              </div>
              <span className="text-xs mt-1 block" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {vaultCategories.map(cat => (
              <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${category === cat.value ? 'ring-2 ring-[var(--accent-purple)]' : ''}`}
                style={{ background: category === cat.value ? 'var(--bg-surface-lighter)' : 'var(--bg-surface-light)' }}>
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input" rows={3} placeholder="Optional notes..." />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <span className="spinner" /> : editItem ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
