import { useState, useCallback } from 'react';
import { useCredits } from '../contexts/CreditContext';

export function useCreditGate() {
  const { canUseAI } = useCredits();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      setError(null);
      setShowInsufficientModal(false);

      if (!canUseAI) {
        setShowInsufficientModal(true);
        setError('No credits remaining. Purchase credits to continue.');
        return undefined;
      }

      setLoading(true);
      try {
        // The Cloud Function atomically deducts the credit.
        // If insufficient, it returns 402 and we catch it here.
        const result = await fn();
        return result;
      } catch (err: any) {
        // User-initiated cancel — don't show error
        if (err.cancelled) {
          return undefined;
        }
        console.error('[useCreditGate] error:', err);
        if (err.status === 402) {
          setShowInsufficientModal(true);
          setError('No credits remaining. Purchase credits to continue.');
        } else {
          setError(err.message || 'Something went wrong');
        }
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [canUseAI],
  );

  const dismissModal = useCallback(() => {
    setShowInsufficientModal(false);
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    showInsufficientModal,
    dismissModal,
  };
}
