import { Shield, Banknote, Briefcase, Tv, Code, ShoppingBag, Plane, Heart, GraduationCap, Gamepad2, MoreHorizontal, User, Lightbulb, Film, Clapperboard } from 'lucide-react';

export const vaultCategories = [
  { value: 'social', label: 'Social', icon: User },
  { value: 'finance', label: 'Finance', icon: Banknote },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'entertainment', label: 'Entertainment', icon: Tv },
  { value: 'dev', label: 'Dev', icon: Code },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

export const noteCategories = [
  { value: 'personal', label: 'Personal', icon: User },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'ideas', label: 'Ideas', icon: Lightbulb },
  { value: 'finance', label: 'Finance', icon: Banknote },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'travel', label: 'Travel', icon: Plane },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
] as const;

export const watchlistCategories = [
  { value: 'movie', label: 'Movie', icon: Film },
  { value: 'series', label: 'Series', icon: Clapperboard },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
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
