import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../contexts/CreditContext';

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuth();
  const { balance } = useCredits();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.photoURL]);

  if (loading) {
    return (
      <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-ds-elevated" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={signIn}
        className="flex items-center gap-1.5 rounded-md border border-ds-border-light px-3 py-1 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
        </svg>
        Sign in
      </button>
    );
  }

  const initial = (user.displayName?.[0] || user.email?.[0] || '?').toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2"
      >
        {/* Credit balance pill */}
        {balance && (
          <span className="flex items-center gap-1 rounded-full bg-ds-elevated px-2 py-0.5 text-xs text-ds-text-muted">
            <svg className="h-3 w-3 text-ds-accent" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" opacity="0.2" />
              <circle cx="12" cy="12" r="6" />
            </svg>
            {balance.balance}
          </span>
        )}

        {/* Avatar */}
        {user.photoURL && !avatarError ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            className="h-7 w-7 rounded-full border border-ds-border"
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ds-accent text-xs font-semibold text-ds-bg">
            {initial}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-ds-border bg-ds-surface shadow-xl"
        >
          {/* User info */}
          <div className="border-b border-ds-border px-4 py-3">
            <p className="truncate text-sm font-medium text-ds-text">
              {user.displayName || 'User'}
            </p>
            <p className="truncate text-xs text-ds-text-dim">{user.email}</p>
          </div>

          {/* Credit balance */}
          <div className="border-b border-ds-border px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ds-text-muted">Credits</span>
              <span className="flex items-center gap-1 text-sm font-medium text-ds-text">
                <svg className="h-3.5 w-3.5 text-ds-accent" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" opacity="0.2" />
                  <circle cx="12" cy="12" r="6" />
                </svg>
                {balance?.balance ?? 0}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                document.dispatchEvent(new CustomEvent('markitup:open-purchase'));
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ds-text-muted transition-colors hover:bg-ds-elevated hover:text-ds-text"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Buy Credits
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ds-text-muted transition-colors hover:bg-ds-elevated hover:text-ds-text"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
