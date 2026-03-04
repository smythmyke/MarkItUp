import { useEffect, useRef } from 'react';

interface InsufficientCreditsModalProps {
  onDismiss: () => void;
  onBuyCredits: () => void;
}

export default function InsufficientCreditsModal({
  onDismiss,
  onBuyCredits,
}: InsufficientCreditsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first button on mount
  useEffect(() => {
    firstButtonRef.current?.focus();
  }, []);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      // Focus trap: keep Tab within modal
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
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insufficient-credits-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm rounded-xl border border-ds-border bg-ds-surface p-6 text-center shadow-2xl"
      >
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ds-accent-subtle">
          <svg className="h-6 w-6 text-ds-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h3 id="insufficient-credits-title" className="mb-2 text-lg font-semibold text-ds-text">Out of Credits</h3>
        <p className="mb-6 text-sm text-ds-text-muted">
          You need credits to use AI annotations. Purchase a credit pack to continue.
        </p>

        <div className="flex gap-3">
          <button
            ref={firstButtonRef}
            onClick={onDismiss}
            className="flex-1 rounded-md border border-ds-border-light px-4 py-2 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
          >
            Dismiss
          </button>
          <button
            onClick={onBuyCredits}
            className="flex-1 rounded-md bg-ds-accent-emphasis px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ds-accent"
          >
            Buy Credits
          </button>
        </div>
      </div>
    </div>
  );
}
