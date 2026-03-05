import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { getBalance, initCredits, createCheckoutSession } from '../lib/api';
import type { CreditBalance, CreditPack } from '../types';

interface CreditContextType {
  balance: CreditBalance | null;
  loading: boolean;
  error: string | null;
  canUseAI: boolean;
  purchaseCredits: (packId: string) => Promise<Window | null>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

const CreditContext = createContext<CreditContextType>({
  balance: null,
  loading: true,
  error: null,
  canUseAI: false,
  purchaseCredits: async () => null,
  refreshBalance: async () => {},
  clearError: () => {},
});

export const useCredits = () => useContext(CreditContext);

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_10', credits: 10, price: 200, label: '10 credits', perCredit: '$0.20' },
  { id: 'pack_25', credits: 25, price: 450, label: '25 credits', perCredit: '$0.18' },
  { id: 'pack_50', credits: 50, price: 800, label: '50 credits', perCredit: '$0.16' },
  { id: 'pack_100', credits: 100, price: 1500, label: '100 credits', perCredit: '$0.15' },
];

export function CreditProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Firestore listener on credits/{uid}
  useEffect(() => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'credits', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setBalance({
            balance: data.balance || 0,
            freeCreditsGranted: data.freeCreditsGranted || false,
            totalUsed: data.totalUsed || 0,
          });
        } else {
          // No doc yet — fresh user, initialize free credits
          initCredits().catch((err) => {
            console.error('Failed to init credits:', err);
          });
          // onSnapshot will fire again once initCredits creates the doc
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to credits:', err);
        // Fallback: fetch via API
        refreshBalance().catch(() => {});
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const canUseAI = balance !== null && balance.balance > 0;

  const refreshBalance = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [user]);

  const purchaseCredits = useCallback(async (packId: string): Promise<Window | null> => {
    setError(null);
    try {
      const { url } = await createCheckoutSession(packId);
      const win = window.open(url, '_blank');
      return win;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start checkout';
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <CreditContext.Provider
      value={{ balance, loading, error, canUseAI, purchaseCredits, refreshBalance, clearError }}
    >
      {children}
    </CreditContext.Provider>
  );
}
