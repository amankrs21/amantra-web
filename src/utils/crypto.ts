export const PIN_STORAGE_KEY = 'vaultPin';

export function encodeKey(raw: string): string {
  return btoa(raw);
}

export function decodeKey(encoded: string): string {
  return atob(encoded);
}
