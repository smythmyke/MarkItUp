import { useCredits } from '../contexts/CreditContext';

export default function CreditDisplay() {
  const { balance, loading } = useCredits();

  if (loading) {
    return (
      <div className="flex animate-pulse items-center gap-1 rounded-full bg-ds-elevated px-3 py-1">
        <div className="h-3 w-3 rounded-full bg-ds-border" />
        <div className="h-3 w-6 rounded bg-ds-border" />
      </div>
    );
  }

  if (!balance) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-ds-elevated px-3 py-1 text-xs">
      <svg className="h-3.5 w-3.5 text-ds-accent" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity="0.2" />
        <circle cx="12" cy="12" r="6" />
      </svg>
      <span className="font-medium text-ds-text">{balance.balance}</span>
      <span className="text-ds-text-dim">credits</span>
    </div>
  );
}
