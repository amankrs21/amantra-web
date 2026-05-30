export const PIN_STORAGE_KEY = 'vaultPin';
const PIN_EVENT = 'amantra:pin-changed';

export function encodeKey(raw: string): string {
  return btoa(raw);
}

export function decodeKey(encoded: string): string {
  return atob(encoded);
}

export function readStoredPin(): string {
  if (typeof localStorage === 'undefined') return '';
  const stored = localStorage.getItem(PIN_STORAGE_KEY);
  if (!stored) return '';
  try {
    return decodeKey(stored);
  } catch {
    return '';
  }
}

export function storePin(raw: string): void {
  if (typeof localStorage === 'undefined') return;
  if (raw) localStorage.setItem(PIN_STORAGE_KEY, encodeKey(raw));
  else localStorage.removeItem(PIN_STORAGE_KEY);
  window.dispatchEvent(new Event(PIN_EVENT));
}

export function clearStoredPin(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PIN_STORAGE_KEY);
  window.dispatchEvent(new Event(PIN_EVENT));
}
