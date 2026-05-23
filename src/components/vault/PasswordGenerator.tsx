import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { generatePassword, getPasswordStrength } from '../../utils/password-generator';
import Modal from '../ui/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect?: (password: string) => void;
}

const presets = [
  { label: 'PIN (4)', length: 4, uppercase: false, lowercase: false, numbers: true, symbols: false },
  { label: 'PIN (6)', length: 6, uppercase: false, lowercase: false, numbers: true, symbols: false },
  { label: 'Short (12)', length: 12, uppercase: true, lowercase: true, numbers: true, symbols: false },
  { label: 'Strong (20)', length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true },
  { label: 'Ultra (32)', length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true },
];

export default function PasswordGenerator({ open, onClose, onSelect }: Props) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() => generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }));
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = () => {
    const p = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    setPassword(p);
    setHistory(prev => [p, ...prev.slice(0, 4)]);
    setCopied(false);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setLength(preset.length);
    setUppercase(preset.uppercase);
    setLowercase(preset.lowercase);
    setNumbers(preset.numbers);
    setSymbols(preset.symbols);
    const p = generatePassword(preset);
    setPassword(p);
    setHistory(prev => [p, ...prev.slice(0, 4)]);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = getPasswordStrength(password);

  return (
    <Modal open={open} onClose={onClose} title="Password Generator">
      <div className="p-6 space-y-5">
        {/* Generated password */}
        <div className="p-4 rounded-lg font-mono text-lg break-all text-center" style={{ background: 'var(--bg-surface-light)' }}>
          {password}
        </div>

        {/* Strength bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: strength.color }}>{strength.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>{password.length} chars</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-light)' }}>
            <motion.div className="h-full rounded-full" animate={{ width: `${(strength.score / 6) * 100}%` }} style={{ background: strength.color }} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={generate} className="btn btn-secondary flex-1"><RefreshCw size={16} /> Regenerate</button>
          <button onClick={() => copy(password)} className="btn btn-primary flex-1">
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
          </button>
        </div>

        {/* Presets */}
        <div>
          <label className="text-sm font-medium mb-2 block">Presets</label>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="btn btn-secondary text-xs px-3 py-1.5">{p.label}</button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="text-sm font-medium mb-2 block">Length: {length}</label>
          <input type="range" min={4} max={64} value={length} onChange={e => setLength(+e.target.value)} className="w-full accent-[var(--accent-purple)]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['Uppercase (A-Z)', uppercase, setUppercase],
            ['Lowercase (a-z)', lowercase, setLowercase],
            ['Numbers (0-9)', numbers, setNumbers],
            ['Symbols (!@#)', symbols, setSymbols],
          ].map(([label, val, setter]) => (
            <label key={label as string} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={val as boolean} onChange={e => (setter as (v: boolean) => void)(e.target.checked)} className="accent-[var(--accent-purple)]" />
              {label as string}
            </label>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>Recent</label>
            <div className="space-y-1">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md text-xs font-mono" style={{ background: 'var(--bg-surface-light)' }}>
                  <span className="truncate flex-1 mr-2">{h}</span>
                  <button onClick={() => copy(h)} className="btn btn-ghost btn-icon p-1"><Copy size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {onSelect && (
          <button onClick={() => { onSelect(password); onClose(); }} className="btn btn-primary w-full">Use this password</button>
        )}
      </div>
    </Modal>
  );
}
