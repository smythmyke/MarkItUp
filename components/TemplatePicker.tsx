import { useCallback, useEffect, useRef, useState } from 'react';
import type { PresentationTemplate, TemplateCategory } from '../types';
import { TEMPLATE_CATEGORIES } from '../types';
import { presentationTemplates, getTemplatesByCategory } from '../lib/presentationTemplates';

interface TemplatePickerProps {
  selectedTemplateId: string;
  onTemplateChange: (template: PresentationTemplate) => void;
  onBrowseAll?: () => void;
}

export default function TemplatePicker({
  selectedTemplateId,
  onTemplateChange,
  onBrowseAll,
}: TemplatePickerProps) {
  const selectedTemplate = presentationTemplates.find((t) => t.id === selectedTemplateId);
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>(
    selectedTemplate?.category ?? 'product'
  );

  // Auto-switch category tab when selected template changes (e.g. from library)
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.category !== activeCategory) {
      setActiveCategory(selectedTemplate.category);
    }
  }, [selectedTemplateId]);

  const filteredTemplates = getTemplatesByCategory(activeCategory);

  // Scroll arrows for category tabs
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  function scrollTabs(dir: 'left' | 'right') {
    tabsRef.current?.scrollBy({ left: dir === 'left' ? -100 : 100, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">
        Template
      </h3>

      {/* Selected template summary */}
      {selectedTemplate && (
        <div className="flex items-center gap-2.5 rounded-lg border border-ds-accent/30 bg-ds-accent/5 px-2.5 py-2">
          <img
            src={selectedTemplate.previewUrl}
            alt={selectedTemplate.name}
            className="h-9 w-14 shrink-0 rounded object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-ds-accent">{selectedTemplate.name}</div>
            <div className="text-[10px] capitalize text-ds-text-dim">{selectedTemplate.category}</div>
          </div>
          <span className="shrink-0 rounded-full bg-ds-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ds-accent">
            Selected
          </span>
        </div>
      )}

      {/* Category tab bar with scroll arrows */}
      <div className="flex items-center gap-1">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="shrink-0 rounded p-0.5 text-ds-text-muted hover:text-ds-accent"
            aria-label="Scroll categories left"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div
          ref={tabsRef}
          className="flex flex-1 gap-0.5 overflow-x-auto scrollbar-hidden rounded-md border border-ds-border bg-ds-elevated"
        >
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                activeCategory === cat.id
                  ? 'bg-ds-accent-emphasis text-white'
                  : 'text-ds-text-muted hover:text-ds-text'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="shrink-0 rounded p-0.5 text-ds-text-muted hover:text-ds-accent"
            aria-label="Scroll categories right"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredTemplates.map((template) => {
          const isActive = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              title={template.description}
              aria-label={`${template.name} template`}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => onTemplateChange(template)}
              className={`flex flex-col gap-1 rounded-lg border overflow-hidden text-left transition-all ${
                isActive
                  ? 'border-ds-accent ring-1 ring-ds-accent-border'
                  : 'border-ds-border-light bg-ds-elevated hover:border-ds-accent/50'
              }`}
            >
              {/* Thumbnail preview */}
              <img
                src={template.previewUrl}
                alt={`${template.name} preview`}
                loading="lazy"
                className="h-20 w-full object-cover"
              />
              <span
                className={`px-2 pb-1.5 text-xs font-medium ${
                  isActive ? 'text-ds-accent' : 'text-ds-text-muted'
                }`}
              >
                {template.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Browse all */}
      {onBrowseAll && (
        <button
          type="button"
          onClick={onBrowseAll}
          className="flex items-center justify-center gap-1.5 rounded-md border border-ds-border-light px-2 py-1.5 text-[11px] text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-accent"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Browse All Templates
        </button>
      )}

    </div>
  );
}
