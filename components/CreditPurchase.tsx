import { useState, useEffect, useRef } from 'react';
import { useCredits, CREDIT_PACKS } from '../contexts/CreditContext';
import { useToast } from '../contexts/ToastContext';

interface CreditPurchaseProps {
  onClose: () => void;
}

export default function CreditPurchase({ onClose }: CreditPurchaseProps) {
  const { purchaseCredits, balance } = useCredits();
  const { showToast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus close button on mount
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Escape to close + focus trap
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handlePurchase(packId: string) {
    setPurchasing(packId);
    try {
      const win = await purchaseCredits(packId);
      if (!win) {
        showToast('Popup blocked — please allow popups for this site', 'error');
        return;
      }
      // Auto-close modal after checkout opens
      setTimeout(() => onClose(), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Purchase failed', 'error');
    } finally {
      setPurchasing(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-purchase-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl border border-ds-border bg-ds-surface p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 id="credit-purchase-title" className="text-lg font-semibold text-ds-text">Buy Credits</h2>
            <p className="text-sm text-ds-text-muted">
              Current balance: {balance?.balance ?? 0} credits
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ds-text-dim transition-colors hover:bg-ds-elevated hover:text-ds-text"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Packs */}
        <div className="space-y-3">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing !== null}
              className="flex w-full items-center justify-between rounded-lg border border-ds-border-light bg-ds-elevated px-4 py-3 text-left transition-colors hover:border-ds-accent disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-medium text-ds-text">{pack.label}</p>
                <p className="text-xs text-ds-text-dim">{pack.perCredit} per credit</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ds-accent">
                  ${(pack.price / 100).toFixed(2)}
                </p>
                {purchasing === pack.id && (
                  <p className="text-xs text-ds-text-dim">Opening...</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-ds-text-dim">
          1 credit = 1 AI annotation call
        </p>
      </div>
    </div>
  );
}
