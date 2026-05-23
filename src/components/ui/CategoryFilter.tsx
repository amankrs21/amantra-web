import { motion } from 'framer-motion';

interface CategoryFilterProps {
  categories: readonly { value: string; label: string }[];
  selected: string;
  onSelect: (v: string) => void;
  allLabel?: string;
}

export default function CategoryFilter({ categories, selected, onSelect, allLabel = 'All' }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect('')}
        className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
        style={{
          background: selected === '' ? 'var(--accent-gradient)' : 'var(--bg-surface)',
          color: selected === '' ? 'white' : 'var(--text-secondary)',
          border: '1px solid var(--glass-border)',
        }}
      >
        {allLabel}
      </motion.button>
      {categories.map((cat) => (
        <motion.button
          key={cat.value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat.value)}
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          style={{
            background: selected === cat.value ? 'var(--accent-gradient)' : 'var(--bg-surface)',
            color: selected === cat.value ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {cat.label}
        </motion.button>
      ))}
    </div>
  );
}
