import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import Modal from '../components/ui/Modal';
import { clearStoredPin, encodeKey, readStoredPin, storePin } from '../utils/crypto';
import { pinAPI } from '../services/api';

type KeyMode = 'set' | 'verify';

interface EncryptionKeyContextType {
    pin: string;
    verified: boolean;
    hasServerKey: boolean;
    setHasServerKey: (value: boolean) => void;
    clearKey: () => void;
    openPrompt: (mode?: KeyMode) => void;
    requireKey: () => Promise<string | null>;
}

const EncryptionKeyContext = createContext<EncryptionKeyContextType>(null!);

export function EncryptionKeyProvider({ children }: { children: ReactNode }) {
    const [pin, setPin] = useState(() => readStoredPin());
    const [verified, setVerified] = useState(false);
    const [hasServerKey, setHasServerKey] = useState(false);
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<KeyMode>('verify');
    const [submitting, setSubmitting] = useState(false);
    const [showValue, setShowValue] = useState(false);
    const [pendingResolve, setPendingResolve] = useState<((value: string | null) => void) | null>(null);
    const pendingPromiseRef = useRef<Promise<string | null> | null>(null);

    useEffect(() => {
        const handler = () => {
            setPin(readStoredPin());
            setVerified(false);
        };
        window.addEventListener('amantra:pin-changed', handler);
        return () => window.removeEventListener('amantra:pin-changed', handler);
    }, []);

    const clearKey = useCallback(() => {
        clearStoredPin();
        setPin('');
        setVerified(false);
    }, []);

    const openPrompt = useCallback(
        (nextMode?: KeyMode) => {
            setMode(nextMode ?? (hasServerKey ? 'verify' : 'set'));
            setOpen(true);
        },
        [hasServerKey]
    );

    const requireKey = useCallback(() => {
        if (pin && verified) return Promise.resolve(encodeKey(pin));
        if (pendingPromiseRef.current) return pendingPromiseRef.current;
        const nextPromise = new Promise<string | null>((resolve) => {
            setPendingResolve(() => resolve);
            openPrompt();
        });
        pendingPromiseRef.current = nextPromise;
        return nextPromise;
    }, [pin, verified, openPrompt]);

    const closeModal = useCallback(() => {
        setOpen(false);
        setShowValue(false);
        if (pendingResolve) {
            pendingResolve(null);
            setPendingResolve(null);
        }
        pendingPromiseRef.current = null;
    }, [pendingResolve]);

    const handleSubmit = useCallback(async () => {
        if (pin.length < 4) {
            toast.error('PIN must be at least 4 characters');
            return;
        }
        setSubmitting(true);
        try {
            const key = encodeKey(pin);
            if (mode === 'set') {
                await pinAPI.set(key);
                setHasServerKey(true);
            } else {
                await pinAPI.verify(key);
            }
            storePin(pin);
            setVerified(true);
            setOpen(false);
            setShowValue(false);
            if (pendingResolve) {
                pendingResolve(key);
                setPendingResolve(null);
            }
            pendingPromiseRef.current = null;
        } catch {
            toast.error('Invalid PIN');
        } finally {
            setSubmitting(false);
        }
    }, [pin, mode, pendingResolve]);

    const title = mode === 'set' ? 'Set Encryption Key' : 'Enter Encryption Key';
    const subtitle = mode === 'set'
        ? 'Set your encryption key to secure vault and notes.'
        : 'Enter your encryption key to access vault and notes.';

    const value = useMemo(() => ({
        pin,
        verified,
        hasServerKey,
        setHasServerKey,
        clearKey,
        openPrompt,
        requireKey,
    }), [pin, verified, hasServerKey, clearKey, openPrompt, requireKey]);

    return (
        <EncryptionKeyContext.Provider value={value}>
            {children}
            <Modal open={open} onClose={closeModal} title={title}>
                <div className="p-6 space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {subtitle}
                    </p>

                    <div className="relative">
                        <input
                            type={showValue ? 'text' : 'password'}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="input pr-10"
                            placeholder="Encryption key"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowValue(!showValue)}
                            aria-label={showValue ? 'Hide key' : 'Show key'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md"
                            style={{ color: 'var(--text-secondary)', background: 'transparent' }}
                        >
                            <span className="text-base leading-none">{showValue ? '🙈' : '🙉'}</span>
                        </button>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={closeModal} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
                            {submitting ? <span className="spinner" /> : mode === 'set' ? 'Set Key' : 'Unlock'}
                        </button>
                    </div>
                </div>
            </Modal>
        </EncryptionKeyContext.Provider>
    );
}

export function useEncryptionKey() {
    return useContext(EncryptionKeyContext);
}
