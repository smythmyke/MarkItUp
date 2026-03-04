import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { CreditProvider } from '../../contexts/CreditContext';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import ImageImport from '../../components/ImageImport';
import TemplatePicker from '../../components/TemplatePicker';
import DescriptionInput from '../../components/DescriptionInput';
import VariationGrid from '../../components/VariationGrid';
import ExportPanel from '../../components/ExportPanel';
import AuthButton from '../../components/AuthButton';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import CreditPurchase from '../../components/CreditPurchase';
import type { ExportOptions, PresentationTemplate } from '../../types';
import { defaultTemplate } from '../../lib/presentationTemplates';
import { downloadDataUrl } from '../../lib/utils';
import { useCreditGate } from '../../hooks/useCreditGate';
import { generateVisual } from '../../lib/api';

import headerLogoUrl from '../../assets/header-logo.png';

function Editor() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>(defaultTemplate);
  const [description, setDescription] = useState('');
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [checkedVariations, setCheckedVariations] = useState<Set<number>>(new Set());
  const [showPurchase, setShowPurchase] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.9,
  });

  const abortRef = useRef<AbortController | null>(null);
  const { execute, loading: generating, error: gateError, showInsufficientModal, dismissModal } = useCreditGate();
  const { showToast } = useToast();
  const { error: authError, clearError: clearAuthError } = useAuth();

  // Show auth errors as toasts
  useEffect(() => {
    if (authError) {
      showToast(authError, 'error');
      clearAuthError();
    }
  }, [authError, showToast, clearAuthError]);

  // Show credit gate errors as toasts (non-402 errors)
  useEffect(() => {
    if (gateError && !showInsufficientModal) {
      showToast(gateError, 'error');
    }
  }, [gateError, showInsufficientModal, showToast]);

  // Listen for "Buy Credits" from AuthButton dropdown
  useEffect(() => {
    function handleOpenPurchase() {
      setShowPurchase(true);
    }
    document.addEventListener('markitup:open-purchase', handleOpenPurchase);
    return () => document.removeEventListener('markitup:open-purchase', handleOpenPurchase);
  }, []);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showPurchase) {
          setShowPurchase(false);
          return;
        }
        if (showInsufficientModal) {
          dismissModal();
          return;
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPurchase, showInsufficientModal, dismissModal]);

  // --- Generate ---

  const handleGenerate = useCallback(() => {
    if (!imageDataUrl || !description.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    execute(async () => {
      const result = await generateVisual(
        imageDataUrl,
        description.trim(),
        selectedTemplate.id,
        controller.signal,
      );

      setVariations(result.variations);
      setSelectedVariation(0);
      setCheckedVariations(new Set(result.variations.map((_, i) => i)));

      if (result.variations.length < 3) {
        showToast(
          `${result.variations.length}/3 variations generated — some failed`,
          'info',
        );
      }

      return result;
    });
  }, [imageDataUrl, description, selectedTemplate.id, execute, showToast]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleCancelGenerate = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // --- Export ---

  const handleToggleCheck = useCallback((index: number) => {
    setCheckedVariations((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    if (checkedVariations.size === 0) return;

    const ext = exportOptions.format === 'jpeg' ? 'jpg' : 'png';
    const sorted = [...checkedVariations].sort();

    for (const i of sorted) {
      const dataUrl = variations[i];
      if (!dataUrl) continue;
      const suffix = sorted.length > 1 ? `-${i + 1}` : '';
      downloadDataUrl(dataUrl, `markitup-export${suffix}.${ext}`);
    }

    showToast(
      sorted.length === 1 ? 'Image exported!' : `${sorted.length} images exported!`,
      'success',
    );
  }, [variations, checkedVariations, exportOptions.format, showToast]);

  // --- New Image ---

  const handleNewImage = useCallback(() => {
    setImageDataUrl(null);
    setDescription('');
    setVariations([]);
    setSelectedVariation(0);
    setCheckedVariations(new Set());
    setSelectedTemplate(defaultTemplate);
  }, []);

  const hasResult = variations.length > 0;

  return (
    <div className="flex h-screen flex-col bg-ds-surface text-ds-text">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-ds-border px-4">
        <img src={headerLogoUrl} alt="MarkItUp" className="h-7" />
        <div className="flex items-center gap-3">
          {imageDataUrl && (
            <button
              type="button"
              onClick={handleNewImage}
              className="rounded-md border border-ds-border-light px-3 py-1 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
            >
              New Image
            </button>
          )}
          <AuthButton />
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas / Preview area */}
        <main className="flex flex-1 items-center justify-center overflow-auto bg-ds-bg p-4">
          {!imageDataUrl ? (
            <ImageImport onImageImport={setImageDataUrl} />
          ) : hasResult ? (
            /* Show selected variation */
            <img
              src={variations[selectedVariation]}
              alt={`Selected variation ${selectedVariation + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            />
          ) : (
            /* Show source image before generation */
            <img
              src={imageDataUrl}
              alt="Source image"
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            />
          )}
        </main>

        {/* Sidebar */}
        {imageDataUrl && (
          <aside className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto scrollbar-hidden border-l border-ds-border bg-ds-surface p-4">
            {/* Description */}
            <DescriptionInput
              description={description}
              onDescriptionChange={setDescription}
              loading={generating}
              hasResult={hasResult}
              onGenerate={handleGenerate}
              onRegenerate={handleRegenerate}
              onCancel={handleCancelGenerate}
            />

            <div className="h-px bg-ds-border" />

            {/* Template Picker */}
            <TemplatePicker
              selectedTemplateId={selectedTemplate.id}
              onTemplateChange={setSelectedTemplate}
            />

            {/* Variation selector (shown below main when results exist) */}
            {(hasResult || generating) && (
              <>
                <div className="h-px bg-ds-border" />
                <VariationGrid
                  variations={variations}
                  selectedIndex={selectedVariation}
                  onSelect={setSelectedVariation}
                  checkedIndices={checkedVariations}
                  onToggleCheck={handleToggleCheck}
                  loading={generating}
                />
              </>
            )}

            {/* Export (only when a variation is selected) */}
            {hasResult && (
              <>
                <div className="h-px bg-ds-border" />
                <ExportPanel
                  options={exportOptions}
                  onOptionsChange={setExportOptions}
                  onExport={handleExport}
                  checkedCount={checkedVariations.size}
                />
              </>
            )}
          </aside>
        )}
      </div>

      {/* Modals */}
      {showInsufficientModal && (
        <InsufficientCreditsModal
          onDismiss={dismissModal}
          onBuyCredits={() => {
            dismissModal();
            setShowPurchase(true);
          }}
        />
      )}

      {showPurchase && <CreditPurchase onClose={() => setShowPurchase(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CreditProvider>
          <Editor />
        </CreditProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
