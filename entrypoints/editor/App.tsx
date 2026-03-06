import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { CreditProvider, useCredits } from '../../contexts/CreditContext';
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
import GeneratingPreview from '../../components/GeneratingPreview';
import HighlightOverlay from '../../components/HighlightOverlay';
import TemplateLibrary from '../../components/TemplateLibrary';
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
  checkResizeCompatibility,
} from '../../lib/outputSizes';

import { isExtension } from '../../lib/platform';
import { applyWatermark } from '../../lib/watermark';
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
  const [showLibrary, setShowLibrary] = useState(false);
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

  const [includeText, setIncludeText] = useState(true);
  const [hasHighlights, setHasHighlights] = useState(false);
  const highlightCompositeRef = useRef<(() => Promise<string | null>) | null>(null);

  // Raw Gemini outputs (before resize) — used for free resize when switching output sizes
  const [rawVariations, setRawVariations] = useState<string[]>([]);
  const [genGeminiConfig, setGenGeminiConfig] = useState<{ aspectRatio: string; imageSize: string } | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const { execute, loading: generating, error: gateError, showInsufficientModal, dismissModal } = useCreditGate();
  const { showToast } = useToast();
  const { user, signIn, error: authError, clearError: clearAuthError } = useAuth();
  const { isFreeUser } = useCredits();
  const pendingGenerateRef = useRef(false);

  // Shared target dimensions (used by FramedPreview + handleGenerate + VariationGrid label)
  const { targetWidth, targetHeight } = useMemo(() => {
    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    return {
      targetWidth: preset ? preset.width : customWidth,
      targetHeight: preset ? preset.height : customHeight,
    };
  }, [selectedPresetId, customWidth, customHeight]);

  // Handle ?purchase=success/cancelled query param (Stripe redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchase = params.get('purchase');
    if (purchase === 'success') {
      showToast('Credits purchased successfully!', 'success');
    } else if (purchase === 'cancelled') {
      showToast('Purchase cancelled', 'error');
    }
    // Clean up the URL so refresh doesn't re-trigger
    if (purchase) {
      const url = new URL(window.location.href);
      url.searchParams.delete('purchase');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

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

  const isLifestyle = selectedTemplate.category === 'lifestyle';

  // Auto-toggle includeText when switching to/from Lifestyle
  useEffect(() => {
    setIncludeText(!isLifestyle);
  }, [isLifestyle]);

  // Free resize when output size changes after generation
  useEffect(() => {
    if (rawVariations.length === 0 || !genGeminiConfig) return;

    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    const newGemini = preset
      ? { aspectRatio: preset.geminiAspectRatio, imageSize: preset.geminiImageSize }
      : resolveGeminiConfig(customWidth, customHeight);
    const newMaxDim = Math.max(targetWidth, targetHeight);

    const compat = checkResizeCompatibility(
      genGeminiConfig.aspectRatio,
      genGeminiConfig.imageSize,
      newGemini.aspectRatio,
      newMaxDim,
    );

    if (compat.compatible) {
      // Free instant resize from raw Gemini outputs
      Promise.all(
        rawVariations.map((v) => resizeImageToTarget(v, targetWidth, targetHeight)),
      ).then((resized) => {
        setVariations(resized);
        setCheckedVariations(new Set(resized.map((_, i) => i)));
      });
    } else {
      // Incompatible — show warning, keep current variations but mark as mismatched
      showToast(compat.reason || 'Regenerate for best results at this size.', 'info');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPresetId, customWidth, customHeight, targetWidth, targetHeight]);

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

    // Clear previous results so loading state is consistent for both first-gen and re-gen
    setVariations([]);
    setRawVariations([]);
    setSelectedVariation(0);
    setCheckedVariations(new Set());
    setTextAnalysis(null);
    setFreeRegenUsed(false);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Resolve output size config
    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    const gemini = preset
      ? { aspectRatio: preset.geminiAspectRatio, imageSize: preset.geminiImageSize }
      : resolveGeminiConfig(customWidth, customHeight);

    // First-time AI disclaimer
    if (!localStorage.getItem('markitup:aiDisclaimerSeen')) {
      localStorage.setItem('markitup:aiDisclaimerSeen', '1');
      showToast(
        'AI-generated images may contain misspellings or visual artifacts. Always review before publishing.',
        'info',
      );
    }

    execute(async () => {
      // Composite highlighted image if user drew highlights
      const annotatedImage = highlightCompositeRef.current
        ? await highlightCompositeRef.current()
        : null;

      const result = await generateVisual(
        imageDataUrl,
        description.trim(),
        selectedTemplate.id,
        gemini.aspectRatio,
        gemini.imageSize,
        controller.signal,
        annotatedImage,
        includeText,
        targetWidth,
        targetHeight,
      );

      // Store raw Gemini outputs + config for free resize later
      setRawVariations(result.variations);
      setGenGeminiConfig(gemini);

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
  }, [imageDataUrl, description, selectedTemplate.id, selectedPresetId, customWidth, customHeight, targetWidth, targetHeight, execute, showToast, includeText]);

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

        // Update raw variations for free resize
        setRawVariations((prev) => {
          const next = [...prev];
          next[index] = result.variation;
          return next;
        });

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

  const handleExport = useCallback(async () => {
    if (checkedVariations.size === 0) return;

    const ext = exportOptions.format === 'jpeg' ? 'jpg' : 'png';
    const sorted = [...checkedVariations].sort();

    for (const i of sorted) {
      let dataUrl = variations[i];
      if (!dataUrl) continue;

      // Apply watermark for free-credit users
      if (isFreeUser) {
        try {
          dataUrl = await applyWatermark(dataUrl, exportOptions.format, exportOptions.quality);
        } catch (err) {
          console.error('Watermark failed, exporting without:', err);
        }
      }

      const suffix = sorted.length > 1 ? `-${i + 1}` : '';
      downloadDataUrl(dataUrl, `markitup-export${suffix}.${ext}`);
    }

    showToast(
      sorted.length === 1 ? 'Image exported!' : `${sorted.length} images exported!`,
      'success',
    );
  }, [variations, checkedVariations, exportOptions, isFreeUser, showToast]);

  // --- New Image ---

  const handleNewImage = useCallback(() => {
    setImageDataUrl(null);
    setDescription('');
    setVariations([]);
    setRawVariations([]);
    setGenGeminiConfig(null);
    setSelectedVariation(0);
    setCheckedVariations(new Set());
    setSelectedTemplate(defaultTemplate);
    setTextAnalysis(null);
    setRegenLoadingIndex(-1);
    setFreeRegenUsed(false);
    setHasHighlights(false);
  }, []);

  const handleEditDone = useCallback((editedDataUrl: string) => {
    setImageDataUrl(editedDataUrl);
    setVariations([]);
    setRawVariations([]);
    setGenGeminiConfig(null);
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
          {generating ? (
            /* Generating — template carousel */
            <GeneratingPreview selectedTemplateName={selectedTemplate.name} />
          ) : hasResult ? (
            /* Show selected variation */
            <img
              src={variations[selectedVariation]}
              alt={`Selected variation ${selectedVariation + 1}`}
              className="h-full w-full rounded-lg object-contain shadow-lg"
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

            {/* Highlight Areas */}
            {!generating && !hasResult && (
              <HighlightOverlay
                imageDataUrl={imageDataUrl}
                onHighlightsChange={setHasHighlights}
                compositeRef={highlightCompositeRef}
              />
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
              isLifestyle={isLifestyle}
              includeText={includeText}
              onIncludeTextChange={setIncludeText}
            />

            <div className="h-px bg-ds-border" />

            {/* Template Picker */}
            <TemplatePicker
              selectedTemplateId={selectedTemplate.id}
              onTemplateChange={setSelectedTemplate}
              onBrowseAll={() => setShowLibrary(true)}
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

      {showLibrary && (
        <TemplateLibrary
          selectedTemplateId={selectedTemplate.id}
          onSelect={setSelectedTemplate}
          onClose={() => setShowLibrary(false)}
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
