import { useEffect, useRef, useState } from 'react';
import type { PresentationTemplate, TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES } from '../types';
import { presentationTemplates, searchTemplates, getTemplatesByCategory } from '../lib/presentationTemplates';

interface TemplateLibraryProps {
  selectedTemplateId: string;
  onSelect: (template: PresentationTemplate) => void;
  onClose: () => void;
}

export default function TemplateLibrary({ selectedTemplateId, onSelect, onClose }: TemplateLibraryProps) {
  const [search, setSearch] = useState('');
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

  function handleSelect(template: PresentationTemplate) {
    onSelect(template);
    onClose();
  }

  // When searching, show flat grid results
  const isSearching = !!search.trim();
  const searchResults = isSearching ? searchTemplates(search) : [];

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

      {/* Search */}
      <div className="shrink-0 border-b border-ds-border px-6 py-3">
        <div className="relative">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        {isSearching ? (
          /* Search results — flat grid */
          searchResults.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-ds-text-dim">
              No templates match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {searchResults.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={selectedTemplateId === template.id}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )
        ) : (
          /* Category rows with marquee */
          <div className="flex flex-col gap-8 py-6">
            {TEMPLATE_CATEGORIES.map((cat, catIndex) => {
              const templates = getTemplatesByCategory(cat.id);
              if (templates.length === 0) return null;
              return (
                <CategoryRow
                  key={cat.id}
                  label={cat.label}
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onSelect={handleSelect}
                  direction={catIndex % 2 === 0 ? 'left' : 'right'}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-ds-border px-6 py-3 text-center text-xs text-ds-text-dim">
        {presentationTemplates.length} templates available
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  templates,
  selectedTemplateId,
  onSelect,
  direction,
}: {
  label: string;
  templates: PresentationTemplate[];
  selectedTemplateId: string;
  onSelect: (template: PresentationTemplate) => void;
  direction: 'left' | 'right';
}) {
  const [paused, setPaused] = useState(false);

  // Double the templates for seamless infinite loop
  const doubled = [...templates, ...templates];
  const speed = 30 + templates.length * 5; // seconds — slower for more items

  return (
    <div className="flex flex-col gap-3">
      <h3 className="px-6 text-sm font-semibold uppercase tracking-wider text-ds-text-dim">
        {label}
      </h3>
      <div
        className="overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex gap-4 w-max"
          style={{
            animation: `marquee${direction === 'left' ? 'Left' : 'Right'} ${speed}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {doubled.map((template, i) => (
            <div key={`${template.id}-${i}`} className="w-56 shrink-0">
              <TemplateCard
                template={template}
                isActive={selectedTemplateId === template.id}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  isActive,
  onSelect,
}: {
  template: PresentationTemplate;
  isActive: boolean;
  onSelect: (template: PresentationTemplate) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={`group flex w-full flex-col overflow-hidden rounded-xl border text-left transition-all hover:shadow-lg hover:shadow-black/30 ${
        isActive
          ? 'border-ds-accent ring-2 ring-ds-accent/40'
          : 'border-ds-border-light hover:border-ds-accent/50'
      }`}
    >
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
      <div className="flex flex-col gap-0.5 p-2.5">
        <span className={`text-sm font-medium ${isActive ? 'text-ds-accent' : 'text-ds-text'}`}>
          {template.name}
        </span>
        <p className="line-clamp-2 text-xs leading-relaxed text-ds-text-muted">
          {template.description}
        </p>
      </div>
    </button>
  );
}
