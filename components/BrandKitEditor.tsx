import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useAuth } from '../contexts/AuthContext';
import { loadBrandKits, saveBrandKit, deleteBrandKit } from '../lib/brandKit';
import type { BrandKit, FontStyle, LogoPosition, LogoSize } from '../types';

interface BrandKitEditorProps {
  onClose: () => void;
  onKitsChange?: (kits: BrandKit[]) => void;
}

const FONT_STYLES: { id: FontStyle; label: string; sample: string }[] = [
  { id: 'modern-sans', label: 'Modern Sans', sample: 'font-sans' },
  { id: 'elegant-serif', label: 'Elegant Serif', sample: 'font-serif' },
  { id: 'bold-geometric', label: 'Bold Geometric', sample: 'font-sans font-black tracking-tight' },
  { id: 'handwritten', label: 'Handwritten', sample: 'italic' },
  { id: 'monospace', label: 'Monospace', sample: 'font-mono' },
];

const LOGO_POSITIONS: { id: LogoPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

const LOGO_SIZES: { id: LogoSize; label: string }[] = [
  { id: 'small', label: 'S' },
  { id: 'medium', label: 'M' },
  { id: 'large', label: 'L' },
];

function newBrandKit(): BrandKit {
  return {
    id: crypto.randomUUID(),
    name: '',
    tagline: '',
    logoDataUrl: '',
    logoPosition: 'bottom-right',
    logoSize: 'medium',
    colors: { primary: '#3898ff', secondary: '#1a1a2e', accent: '#e94560' },
    fontStyle: 'modern-sans',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function BrandKitEditor({ onClose, onKitsChange }: BrandKitEditorProps) {
  const { user } = useAuth();
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [editing, setEditing] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeColorPicker, setActiveColorPicker] = useState<'primary' | 'secondary' | 'accent' | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Load kits on mount
  useEffect(() => {
    if (!user) return;
    loadBrandKits(user.uid)
      .then((loaded) => {
        setKits(loaded);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [user]);

  // Close color picker on outside click
  useEffect(() => {
    if (!activeColorPicker) return;
    function handleClick(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setActiveColorPicker(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activeColorPicker]);

  const handleSave = useCallback(async () => {
    if (!user || !editing) return;
    if (!editing.name.trim()) {
      setError('Brand name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveBrandKit(user.uid, editing);
      const updated = await loadBrandKits(user.uid);
      setKits(updated);
      onKitsChange?.(updated);
      setEditing(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [user, editing, onKitsChange]);

  const handleDelete = useCallback(async (kitId: string) => {
    if (!user) return;
    try {
      await deleteBrandKit(user.uid, kitId);
      const updated = await loadBrandKits(user.uid);
      setKits(updated);
      onKitsChange?.(updated);
      if (editing?.id === kitId) setEditing(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user, editing, onKitsChange]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 500 * 1024) {
      setError('Logo must be under 500KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEditing({ ...editing, logoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }, [editing]);

  const updateEditing = useCallback((patch: Partial<BrandKit>) => {
    if (!editing) return;
    setEditing({ ...editing, ...patch });
  }, [editing]);

  const updateColor = useCallback((key: 'primary' | 'secondary' | 'accent', value: string) => {
    if (!editing) return;
    setEditing({ ...editing, colors: { ...editing.colors, [key]: value } });
  }, [editing]);

  // Escape to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (activeColorPicker) {
          setActiveColorPicker(null);
        } else if (editing) {
          setEditing(null);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [editing, activeColorPicker, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-[520px] max-w-[95vw] flex-col rounded-xl border border-ds-border bg-ds-surface shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-ds-border px-5 py-4">
          <h2 className="text-base font-semibold text-ds-text">
            {editing ? 'Edit Brand Kit' : 'Brand Kits'}
          </h2>
          <button
            type="button"
            onClick={editing ? () => setEditing(null) : onClose}
            className="rounded p-1 text-ds-text-muted transition-colors hover:bg-ds-elevated hover:text-ds-text"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {editing ? (
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden p-5">
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">
              {error}
              <button type="button" onClick={() => setError('')} className="ml-2 underline">dismiss</button>
            </div>
          )}

          {!editing ? (
            /* List view */
            <>
              {loading ? (
                <p className="text-sm text-ds-text-dim">Loading...</p>
              ) : kits.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <svg className="h-12 w-12 text-ds-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-ds-text-muted">No brand kits yet</p>
                  <p className="text-xs text-ds-text-dim">Create one to apply your brand to AI generations</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {kits.map((kit) => (
                    <div
                      key={kit.id}
                      className="flex items-center gap-3 rounded-lg border border-ds-border-light bg-ds-elevated p-3 transition-colors hover:border-ds-accent/50"
                    >
                      {/* Logo thumb */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ds-bg">
                        {kit.logoDataUrl ? (
                          <img src={kit.logoDataUrl} alt="" className="h-8 w-8 object-contain" />
                        ) : (
                          <svg className="h-5 w-5 text-ds-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-ds-text">{kit.name}</p>
                        <div className="mt-1 flex gap-1">
                          <span className="h-3 w-3 rounded-full border border-ds-border" style={{ backgroundColor: kit.colors.primary }} />
                          <span className="h-3 w-3 rounded-full border border-ds-border" style={{ backgroundColor: kit.colors.secondary }} />
                          <span className="h-3 w-3 rounded-full border border-ds-border" style={{ backgroundColor: kit.colors.accent }} />
                        </div>
                      </div>

                      {/* Actions */}
                      <button
                        type="button"
                        onClick={() => setEditing({ ...kit })}
                        className="rounded px-2 py-1 text-xs text-ds-accent transition-colors hover:bg-ds-accent/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(kit.id)}
                        className="rounded px-2 py-1 text-xs text-ds-text-dim transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {kits.length < 5 && (
                <button
                  type="button"
                  onClick={() => setEditing(newBrandKit())}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-ds-border-light px-3 py-3 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create Brand Kit
                </button>
              )}
            </>
          ) : (
            /* Edit view */
            <div className="flex flex-col gap-5">
              {/* Brand Name */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Brand Name *</span>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => updateEditing({ name: e.target.value })}
                  placeholder="Acme Corp"
                  maxLength={50}
                  className="rounded-md border border-ds-border-light bg-ds-elevated px-3 py-2 text-sm text-ds-text placeholder-ds-text-dim focus:border-ds-accent focus:outline-none"
                />
              </label>

              {/* Tagline */}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Tagline</span>
                <input
                  type="text"
                  value={editing.tagline}
                  onChange={(e) => updateEditing({ tagline: e.target.value })}
                  placeholder="Build faster, ship sooner"
                  maxLength={100}
                  className="rounded-md border border-ds-border-light bg-ds-elevated px-3 py-2 text-sm text-ds-text placeholder-ds-text-dim focus:border-ds-accent focus:outline-none"
                />
              </label>

              {/* Logo Upload */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Logo</span>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-ds-border-light bg-ds-bg">
                    {editing.logoDataUrl ? (
                      <img src={editing.logoDataUrl} alt="Logo" className="h-12 w-12 object-contain" />
                    ) : (
                      <svg className="h-6 w-6 text-ds-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="cursor-pointer rounded-md border border-ds-border-light px-3 py-1.5 text-xs text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text">
                      Upload Logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    {editing.logoDataUrl && (
                      <button
                        type="button"
                        onClick={() => updateEditing({ logoDataUrl: '' })}
                        className="text-left text-xs text-ds-text-dim hover:text-red-400"
                      >
                        Remove
                      </button>
                    )}
                    <span className="text-[10px] text-ds-text-dim">PNG, JPG, SVG, WebP. Max 500KB.</span>
                  </div>
                </div>
              </div>

              {/* Logo Position */}
              {editing.logoDataUrl && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Logo Position</span>
                  <div className="grid grid-cols-2 gap-2">
                    {LOGO_POSITIONS.map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => updateEditing({ logoPosition: pos.id })}
                        className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                          editing.logoPosition === pos.id
                            ? 'border-ds-accent bg-ds-accent/10 text-ds-accent'
                            : 'border-ds-border-light text-ds-text-muted hover:border-ds-accent/50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Logo Size */}
              {editing.logoDataUrl && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Logo Size</span>
                  <div className="flex gap-2">
                    {LOGO_SIZES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateEditing({ logoSize: s.id })}
                        className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                          editing.logoSize === s.id
                            ? 'border-ds-accent bg-ds-accent/10 text-ds-accent'
                            : 'border-ds-border-light text-ds-text-muted hover:border-ds-accent/50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Brand Colors</span>
                <div className="flex gap-3" ref={colorPickerRef}>
                  {(['primary', 'secondary', 'accent'] as const).map((key) => (
                    <div key={key} className="relative flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveColorPicker(activeColorPicker === key ? null : key)}
                        className={`h-10 w-10 rounded-lg border-2 transition-all ${
                          activeColorPicker === key ? 'border-ds-accent scale-110' : 'border-ds-border-light hover:border-ds-accent/50'
                        }`}
                        style={{ backgroundColor: editing.colors[key] }}
                      />
                      <span className="text-[10px] capitalize text-ds-text-dim">{key}</span>
                      <input
                        type="text"
                        value={editing.colors[key]}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateColor(key, v);
                        }}
                        className="w-[72px] rounded border border-ds-border-light bg-ds-bg px-1.5 py-0.5 text-center text-[10px] text-ds-text-muted focus:border-ds-accent focus:outline-none"
                      />
                      {activeColorPicker === key && (
                        <div className="absolute top-14 z-10">
                          <HexColorPicker
                            color={editing.colors[key]}
                            onChange={(c) => updateColor(key, c)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Font Style */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-ds-text-dim">Font Style</span>
                <div className="flex flex-col gap-1.5">
                  {FONT_STYLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => updateEditing({ fontStyle: f.id })}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                        editing.fontStyle === f.id
                          ? 'border-ds-accent bg-ds-accent/10'
                          : 'border-ds-border-light hover:border-ds-accent/50'
                      }`}
                    >
                      <span className={`text-sm text-ds-text ${f.sample}`}>
                        {editing.name || 'Brand Name'}
                      </span>
                      <span className="text-[10px] text-ds-text-dim">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (edit mode only) */}
        {editing && (
          <div className="shrink-0 border-t border-ds-border px-5 py-3">
            <button
              type="button"
              disabled={saving || !editing.name.trim()}
              onClick={handleSave}
              className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white transition-colors ${
                saving || !editing.name.trim()
                  ? 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
                  : 'bg-ds-accent-emphasis hover:bg-ds-accent'
              }`}
            >
              {saving ? 'Saving...' : 'Save Brand Kit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
