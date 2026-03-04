import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { CreditProvider } from '../../contexts/CreditContext';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import ImageImport from '../../components/ImageImport';
import TemplatePicker from '../../components/TemplatePicker';
import DescriptionInput from '../../components/DescriptionInput';
import OutputSizePicker from '../../components/OutputSizePicker';
import VariationGrid from '../../components/VariationGrid';
import ExportPanel from '../../components/ExportPanel';
import AuthButton from '../../components/AuthButton';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import CreditPurchase from '../../components/CreditPurchase';
import ImageEditor from '../../components/ImageEditor';
import type { ExportOptions, PresentationTemplate } from '../../types';
import { defaultTemplate } from '../../lib/presentationTemplates';
import { downloadDataUrl } from '../../lib/utils';
import { useCreditGate } from '../../hooks/useCreditGate';
import { generateVisual } from '../../lib/api';
import {
  DEFAULT_OUTPUT_SIZE_ID,
  findPresetById,
  resolveGeminiConfig,
  resizeImageToTarget,
} from '../../lib/outputSizes';

import headerLogoUrl from '../../assets/header-logo.png';

function Editor() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>(defaultTemplate);
  const [description, setDescription] = useState('');
  const [variations, setVariations] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);
  const [checkedVariations, setCheckedVariations] = useState<Set<number>>(new Set());
  const [showPurchase, setShowPurchase] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    () => localStorage.getItem('markitup:outputSize') || DEFAULT_OUTPUT_SIZE_ID,
  );
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
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

  // Persist selected output size
  useEffect(() => {
    localStorage.setItem('markitup:outputSize', selectedPresetId);
  }, [selectedPresetId]);

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
        // Editor modal handles its own Escape
        if (showEditor) return;
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
  }, [showEditor, showPurchase, showInsufficientModal, dismissModal]);

  // --- Generate ---

  const handleGenerate = useCallback(() => {
    if (!imageDataUrl || !description.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Resolve output size config
    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    const targetWidth = preset ? preset.width : customWidth;
    const targetHeight = preset ? preset.height : customHeight;
    const gemini = preset
      ? { aspectRatio: preset.geminiAspectRatio, imageSize: preset.geminiImageSize }
      : resolveGeminiConfig(customWidth, customHeight);

    execute(async () => {
      const result = await generateVisual(
        imageDataUrl,
        description.trim(),
        selectedTemplate.id,
        gemini.aspectRatio,
        gemini.imageSize,
        controller.signal,
      );

      // Resize all variations to exact target dimensions
      const resized = await Promise.all(
        result.variations.map((v) => resizeImageToTarget(v, targetWidth, targetHeight)),
      );

      setVariations(resized);
      setSelectedVariation(0);
      setCheckedVariations(new Set(resized.map((_, i) => i)));

      if (result.variations.length < 3) {
        showToast(
          `${result.variations.length}/3 variations generated — some failed`,
          'info',
        );
      }

      return result;
    });
  }, [imageDataUrl, description, selectedTemplate.id, selectedPresetId, customWidth, customHeight, execute, showToast]);

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

  const handleEditDone = useCallback((editedDataUrl: string) => {
    setImageDataUrl(editedDataUrl);
    setVariations([]);
    setSelectedVariation(0);
    setCheckedVariations(new Set());
    setShowEditor(false);
    showToast('Image updated', 'success');
  }, [showToast]);

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
            {/* Edit Image */}
            {!generating && (
              <button
                type="button"
                onClick={() => setShowEditor(true)}
                className="flex items-center justify-center gap-2 rounded-md border border-ds-border-light px-3 py-2 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Image
              </button>
            )}

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

            <div className="h-px bg-ds-border" />

            {/* Output Size */}
            <OutputSizePicker
              selectedPresetId={selectedPresetId}
              customWidth={customWidth}
              customHeight={customHeight}
              onPresetChange={setSelectedPresetId}
              onCustomSizeChange={(w, h) => { setCustomWidth(w); setCustomHeight(h); }}
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
                  outputSizeLabel={(() => {
                    const p = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
                    const w = p ? p.width : customWidth;
                    const h = p ? p.height : customHeight;
                    return `${w} \u00d7 ${h}`;
                  })()}
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

      {showEditor && imageDataUrl && (
        <ImageEditor
          imageDataUrl={imageDataUrl}
          onDone={handleEditDone}
          onCancel={() => setShowEditor(false)}
        />
      )}
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
