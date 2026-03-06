import { useEffect, useRef, useState } from 'react';
import type { PresentationTemplate, TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES } from '../types';
import { presentationTemplates, searchTemplates, getTemplatesByCategory } from '../lib/presentationTemplates';

interface TemplateLibraryProps {
  selectedTemplateId: string;
  onSelect: (template: PresentationTemplate) => void;
  onClose: () => void;
}

const ALL_FILTER = 'all' as const;
type FilterCategory = TemplateCategory | typeof ALL_FILTER;

export default function TemplateLibrary({ selectedTemplateId, onSelect, onClose }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(ALL_FILTER);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Filter templates
  let filtered: PresentationTemplate[];
  if (search.trim()) {
    filtered = searchTemplates(search);
    // Further filter by category if not "all"
    if (activeFilter !== ALL_FILTER) {
      filtered = filtered.filter((t) => t.category === activeFilter);
    }
  } else if (activeFilter !== ALL_FILTER) {
    filtered = getTemplatesByCategory(activeFilter);
  } else {
    filtered = presentationTemplates;
  }

  function handleSelect(template: PresentationTemplate) {
    onSelect(template);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-ds-bg/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-ds-border px-6 py-4">
        <h2 className="text-lg font-semibold text-ds-text">Template Library</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-ds-text-muted transition-colors hover:bg-ds-elevated hover:text-ds-text"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="shrink-0 border-b border-ds-border px-6 py-3">
        <div className="relative mb-3">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ds-text-dim" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates... e.g. dark, neon, retro, minimal"
            className="w-full rounded-lg border border-ds-border-light bg-ds-elevated py-2.5 pl-10 pr-4 text-sm text-ds-text placeholder-ds-text-dim focus:border-ds-accent focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ds-text-dim hover:text-ds-text"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All"
            active={activeFilter === ALL_FILTER}
            count={search ? searchTemplates(search).length : presentationTemplates.length}
            onClick={() => setActiveFilter(ALL_FILTER)}
          />
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count = search
              ? searchTemplates(search).filter((t) => t.category === cat.id).length
              : getTemplatesByCategory(cat.id).length;
            return (
              <FilterChip
                key={cat.id}
                label={cat.label}
                active={activeFilter === cat.id}
                count={count}
                onClick={() => setActiveFilter(cat.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-ds-text-dim">
            No templates match "{search}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((template) => {
              const isActive = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-all hover:shadow-lg hover:shadow-black/30 ${
                    isActive
                      ? 'border-ds-accent ring-2 ring-ds-accent/40'
                      : 'border-ds-border-light hover:border-ds-accent/50'
                  }`}
                >
                  {/* Preview image */}
                  <div className="relative overflow-hidden bg-ds-elevated">
                    <img
                      src={template.previewUrl}
                      alt={`${template.name} preview`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isActive && (
                      <div className="absolute right-2 top-2 rounded-full bg-ds-accent px-2 py-0.5 text-[11px] font-medium text-white">
                        Selected
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-col gap-1 p-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isActive ? 'text-ds-accent' : 'text-ds-text'}`}>
                        {template.name}
                      </span>
                      <span className="rounded-full bg-ds-elevated px-2 py-0.5 text-[10px] font-medium capitalize text-ds-text-dim">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-ds-text-muted">
                      {template.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-ds-border px-6 py-3 text-center text-xs text-ds-text-dim">
        {filtered.length} template{filtered.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-ds-accent-emphasis text-white'
          : 'bg-ds-elevated text-ds-text-muted hover:text-ds-text'
      }`}
    >
      {label}
      <span className={`ml-1 ${active ? 'text-white/70' : 'text-ds-text-dim'}`}>
        {count}
      </span>
    </button>
  );
}
