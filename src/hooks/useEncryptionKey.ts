import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { decodeKey, encodeKey, PIN_STORAGE_KEY } from '../utils/crypto';
import { pinAPI } from '../services/api';

export function useEncryptionKey() {
  const [pin, setPinState] = useState(() => {
    if (typeof localStorage === 'undefined') return '';
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (!stored) return '';
    try {
      return decodeKey(stored);
    } catch {
      return '';
    }
  });
  const [verified, setVerified] = useState(false);

  const setPin = useCallback((value: string) => {
    setPinState(value);
    if (typeof localStorage === 'undefined') return;
    if (value) localStorage.setItem(PIN_STORAGE_KEY, encodeKey(value));
    else localStorage.removeItem(PIN_STORAGE_KEY);
  }, []);

  const getEncodedKey = useCallback(() => {
    if (!pin) {
      toast.error('Please enter your encryption PIN');
      return null;
    }
    return encodeKey(pin);
  }, [pin]);

  const verifyPin = useCallback(async () => {
    const key = encodeKey(pin);
    try {
      await pinAPI.verify(key);
      setVerified(true);
      return key;
    } catch {
      toast.error('Invalid PIN');
      return null;
    }
  }, [pin]);

  return { pin, setPin, verified, setVerified, getEncodedKey, verifyPin };
}
