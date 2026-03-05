import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { CreditProvider } from '../../contexts/CreditContext';
import { ToastProvider, useToast } from '../../contexts/ToastContext';
import HeroLanding from '../../components/HeroLanding';
import TemplatePicker from '../../components/TemplatePicker';
import DescriptionInput from '../../components/DescriptionInput';
import OutputSizePicker from '../../components/OutputSizePicker';
import VariationGrid from '../../components/VariationGrid';
import ExportPanel from '../../components/ExportPanel';
import AuthButton from '../../components/AuthButton';
import InsufficientCreditsModal from '../../components/InsufficientCreditsModal';
import CreditPurchase from '../../components/CreditPurchase';
import ImageEditor from '../../components/ImageEditor';
import FramedPreview from '../../components/FramedPreview';
import type { ExportOptions, PresentationTemplate, TextAnalysis } from '../../types';
import { defaultTemplate } from '../../lib/presentationTemplates';
import { downloadDataUrl } from '../../lib/utils';
import { useCreditGate } from '../../hooks/useCreditGate';
import { generateVisual, regenVariation } from '../../lib/api';
import {
  DEFAULT_OUTPUT_SIZE_ID,
  findPresetById,
  resolveGeminiConfig,
  resizeImageToTarget,
} from '../../lib/outputSizes';

import { isExtension } from '../../lib/platform';
import logoUrl from '../../assets/logo.png';

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
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null);
  const [regenLoadingIndex, setRegenLoadingIndex] = useState(-1);
  const [freeRegenUsed, setFreeRegenUsed] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 0.9,
  });

  const abortRef = useRef<AbortController | null>(null);
  const { execute, loading: generating, error: gateError, showInsufficientModal, dismissModal } = useCreditGate();
  const { showToast } = useToast();
  const { user, signIn, error: authError, clearError: clearAuthError } = useAuth();
  const pendingGenerateRef = useRef(false);

  // Shared target dimensions (used by FramedPreview + handleGenerate + VariationGrid label)
  const { targetWidth, targetHeight } = useMemo(() => {
    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    return {
      targetWidth: preset ? preset.width : customWidth,
      targetHeight: preset ? preset.height : customHeight,
    };
  }, [selectedPresetId, customWidth, customHeight]);

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

  // Ref to latest handleGenerate so the post-sign-in effect can call it without stale closures
  const generateRef = useRef<() => void>(() => {});

  const handleGenerate = useCallback(() => {
    if (!imageDataUrl) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Resolve output size config
    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
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
      setTextAnalysis(result.text);
      setFreeRegenUsed(false);

      if (result.variations.length < 2) {
        showToast(
          `${result.variations.length}/2 variations generated — some failed`,
          'info',
        );
      }

      return result;
    });
  }, [imageDataUrl, description, selectedTemplate.id, selectedPresetId, customWidth, customHeight, targetWidth, targetHeight, execute, showToast]);

  // Keep ref in sync so post-sign-in effect uses latest closure
  generateRef.current = handleGenerate;

  // Auto-generate after sign-in completes (triggered by handleSignInToGenerate)
  useEffect(() => {
    console.log('[App] user effect fired, user:', user?.email, 'pendingGenerate:', pendingGenerateRef.current);
    if (user && pendingGenerateRef.current) {
      pendingGenerateRef.current = false;
      console.log('[App] auto-generating after sign-in, delaying 1.5s for credit init...');
      const timer = setTimeout(() => generateRef.current(), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSignInToGenerate = useCallback(() => {
    console.log('[App] handleSignInToGenerate called, setting pendingGenerate=true');
    pendingGenerateRef.current = true;
    signIn();
  }, [signIn]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleCancelGenerate = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  // --- Regen ---

  const handleRegen = useCallback((index: number) => {
    if (!imageDataUrl || regenLoadingIndex >= 0) return;
    if (!variations[index]) return;

    const chargeCredit = freeRegenUsed;
    setRegenLoadingIndex(index);

    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    const gemini = preset
      ? { aspectRatio: preset.geminiAspectRatio, imageSize: preset.geminiImageSize }
      : resolveGeminiConfig(customWidth, customHeight);

    const doRegen = async () => {
      try {
        const result = await regenVariation(
          variations[index],
          imageDataUrl,
          textAnalysis,
          selectedTemplate.id,
          index,
          gemini.aspectRatio,
          gemini.imageSize,
          chargeCredit,
        );

        const resized = await resizeImageToTarget(result.variation, targetWidth, targetHeight);

        setVariations((prev) => {
          const next = [...prev];
          next[index] = resized;
          return next;
        });

        if (result.textCorrected) {
          setTextAnalysis(result.text);
          showToast('Variation regenerated with improved text', 'success');
        } else {
          showToast('Variation regenerated', 'success');
        }

        setFreeRegenUsed(true);
      } catch (err: any) {
        if (!err.cancelled) {
          console.error('[handleRegen] error:', err);
          showToast(err.message || 'Regen failed', 'error');
        }
      } finally {
        setRegenLoadingIndex(-1);
      }
    };

    if (chargeCredit) {
      execute(doRegen);
    } else {
      doRegen();
    }
  }, [imageDataUrl, textAnalysis, regenLoadingIndex, variations, freeRegenUsed, selectedPresetId, customWidth, customHeight, selectedTemplate.id, targetWidth, targetHeight, execute, showToast]);

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
    setTextAnalysis(null);
    setRegenLoadingIndex(-1);
    setFreeRegenUsed(false);
  }, []);

  const handleEditDone = useCallback((editedDataUrl: string) => {
    setImageDataUrl(editedDataUrl);
    setVariations([]);
    setSelectedVariation(0);
    setCheckedVariations(new Set());
    setShowEditor(false);
    setTextAnalysis(null);
    setFreeRegenUsed(false);
    showToast('Image updated', 'success');
  }, [showToast]);

  const hasResult = variations.length > 0;

  return (
    <div className="flex h-screen flex-col bg-ds-surface text-ds-text">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-ds-border px-4">
        <img src={logoUrl} alt="MarkItUp" className="h-8" />
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
        {/* Landing hero (full width, no sidebar) */}
        {!imageDataUrl ? (
          <main className="flex flex-1 overflow-hidden bg-ds-bg">
            <HeroLanding onImageImport={setImageDataUrl} compact={isExtension} />
          </main>
        ) : (<>
        <main className="flex flex-1 items-center justify-center overflow-auto bg-ds-bg p-4">
          {hasResult ? (
            /* Show selected variation */
            <img
              src={variations[selectedVariation]}
              alt={`Selected variation ${selectedVariation + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
            />
          ) : (
            /* Show source image with zoom/pan crop frame */
            <FramedPreview
              imageDataUrl={imageDataUrl}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
              onCrop={(cropped) => {
                setImageDataUrl(cropped);
                setVariations([]);
                setSelectedVariation(0);
                setCheckedVariations(new Set());
                showToast('Image cropped to output size', 'success');
              }}
            />
          )}
        </main>

        {/* Sidebar */}
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
              onSignInToGenerate={handleSignInToGenerate}
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
                  outputSizeLabel={`${targetWidth} \u00d7 ${targetHeight}`}
                  onRegen={handleRegen}
                  regenLoadingIndex={regenLoadingIndex}
                  freeRegenAvailable={!freeRegenUsed}
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
        </>)}
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
