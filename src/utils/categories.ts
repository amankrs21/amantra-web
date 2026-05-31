import { Users, Mail, Landmark, ShoppingBag, Briefcase, MoreHorizontal, Lightbulb, Film, Tv, Newspaper, Bot, Atom, Cpu, BellRing, Shield } from 'lucide-react';

export const vaultCategories = [
  { value: 'dev', label: 'Dev', icon: Shield, color: '#2563eb' },
  { value: 'email', label: 'Email', icon: Mail, color: '#8b5cf6' },
  { value: 'work', label: 'Work', icon: Briefcase, color: '#0ea5e9' },
  { value: 'banking', label: 'Bank', icon: Landmark, color: '#10b981' },
  { value: 'social', label: 'Social', icon: Users, color: '#3b82f6' },
  { value: 'shopping', label: 'Shop', icon: ShoppingBag, color: '#f59e0b' },
  { value: 'media', label: 'Media', icon: Film, color: '#ec4899' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b' },
] as const;

export const noteCategories = [
  { value: 'dev', label: 'Dev', icon: Shield, color: '#2563eb' },
  { value: 'work', label: 'Work', icon: Briefcase, color: '#0ea5e9' },
  { value: 'banking', label: 'Bank', icon: Landmark, color: '#10b981' },
  { value: 'ideas', label: 'Ideas', icon: Lightbulb, color: '#f59e0b' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b' },
] as const;

export const watchlistCategories = [
  { value: 'movie', label: 'Movies', icon: Film, color: '#2563eb' },
  { value: 'series', label: 'Series', icon: Tv, color: '#8b5cf6' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#64748b' },
] as const;

export const newsletterCategories = [
  { value: 'all', label: 'All', icon: Newspaper },
  { value: 'ai', label: 'AI', icon: Bot },
  { value: 'quantum', label: 'Quantum', icon: Atom },
  { value: 'tech', label: 'Tech', icon: Cpu },
  { value: 'watchlist', label: 'My Watchlist', icon: BellRing },
] as const;

export const watchlistStatuses = [
  { value: 'to_watch', label: 'To Watch' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
] as const;

export function getCategoryIcon(categories: readonly { value: string; icon: React.ComponentType }[], value: string) {
  return categories.find(c => c.value === value)?.icon ?? Shield;
}

export function getCategoryLabel(categories: readonly { value: string; label: string }[], value: string) {
  return categories.find(c => c.value === value)?.label ?? value;
}
