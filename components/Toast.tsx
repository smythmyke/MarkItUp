import type { Toast } from '../types';

const variantStyles: Record<Toast['variant'], string> = {
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  success: 'border-green-500/40 bg-green-500/10 text-green-300',
  info: 'border-ds-accent/40 bg-ds-accent/10 text-ds-accent',
};

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${variantStyles[toast.variant]}`}
        >
          <span className="text-sm">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="ml-auto shrink-0 opacity-60 transition-opacity hover:opacity-100"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
