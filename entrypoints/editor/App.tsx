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
import type { HighlightTool, Stroke } from '../../components/HighlightOverlay';
import HighlightCanvas from '../../components/HighlightCanvas';
import TemplateLibrary from '../../components/TemplateLibrary';
import BrandKitEditor from '../../components/BrandKitEditor';
import BrandKitSelector from '../../components/BrandKitSelector';
import BatchExportModal from '../../components/BatchExportModal';
import type { BrandKit, ExportOptions, PresentationTemplate, TextAnalysis } from '../../types';
import { defaultTemplate } from '../../lib/presentationTemplates';
import { downloadDataUrl } from '../../lib/utils';
import { useCreditGate } from '../../hooks/useCreditGate';
import { generateVisual, regenVariation, extendImage } from '../../lib/api';
import {
  DEFAULT_OUTPUT_SIZE_ID,
  findPresetById,
  resolveGeminiConfig,
  resizeImageToTarget,
  checkResizeCompatibility,
} from '../../lib/outputSizes';

import { isExtension } from '../../lib/platform';
import { applyWatermark } from '../../lib/watermark';
import { compositeBrandLogo } from '../../lib/brandComposite';
import { loadBrandKits } from '../../lib/brandKit';
import { canDirectExport, incrementDirectExport, getDirectExportRemaining } from '../../lib/exportLimit';
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
  const [extending, setExtending] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'generate' | 'export'>('edit');
  const [showBrandEditor, setShowBrandEditor] = useState(false);
  const [showBatchExport, setShowBatchExport] = useState(false);
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const highlightCompositeRef = useRef<(() => Promise<string | null>) | null>(null);

  // Lifted highlight state (shared between sidebar controls + main canvas)
  const [highlightActive, setHighlightActive] = useState(false);
  const [highlightTool, setHighlightTool] = useState<HighlightTool>('brush');
  const [highlightBrushSize, setHighlightBrushSize] = useState(24);
  const [highlightStrokes, setHighlightStrokes] = useState<Stroke[]>([]);

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

  // Load brand kits when user signs in
  useEffect(() => {
    if (!user) {
      setBrandKits([]);
      setSelectedBrandId(null);
      return;
    }
    loadBrandKits(user.uid).then(setBrandKits).catch(console.error);
  }, [user]);

  // Restore last selected brand kit
  useEffect(() => {
    const saved = localStorage.getItem('markitup:selectedBrand');
    if (saved && brandKits.find((k) => k.id === saved)) {
      setSelectedBrandId(saved);
    }
  }, [brandKits]);

  // Persist selected brand kit
  useEffect(() => {
    if (selectedBrandId) {
      localStorage.setItem('markitup:selectedBrand', selectedBrandId);
    } else {
      localStorage.removeItem('markitup:selectedBrand');
    }
  }, [selectedBrandId]);

  const selectedBrandKit = brandKits.find((k) => k.id === selectedBrandId) || null;

  // Listen for "Buy Credits" and "Brand Kit" from AuthButton dropdown
  useEffect(() => {
    function handleOpenPurchase() {
      setShowPurchase(true);
    }
    function handleOpenBrandKit() {
      setShowBrandEditor(true);
    }
    document.addEventListener('markitup:open-purchase', handleOpenPurchase);
    document.addEventListener('markitup:open-brand-kit', handleOpenBrandKit);
    return () => {
      document.removeEventListener('markitup:open-purchase', handleOpenPurchase);
      document.removeEventListener('markitup:open-brand-kit', handleOpenBrandKit);
    };
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

      // Only send brand kit for paid users
      const brandForGen = (!isFreeUser && selectedBrandKit) ? selectedBrandKit : null;

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
        brandForGen,
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
      setActiveTab('export');

      if (result.variations.length < 2) {
        showToast(
          `${result.variations.length}/2 variations generated — some failed`,
          'info',
        );
      }

      return result;
    });
  }, [imageDataUrl, description, selectedTemplate.id, selectedPresetId, customWidth, customHeight, targetWidth, targetHeight, execute, showToast, includeText, isFreeUser, selectedBrandKit]);

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

      // Apply brand logo for paid users with a selected brand kit
      if (!isFreeUser && selectedBrandKit?.logoDataUrl) {
        try {
          dataUrl = await compositeBrandLogo(dataUrl, selectedBrandKit, exportOptions.format, exportOptions.quality);
        } catch (err) {
          console.error('Brand logo composite failed:', err);
        }
      }

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
  }, [variations, checkedVariations, exportOptions, isFreeUser, selectedBrandKit, showToast]);

  // --- Direct Export (no AI generation) ---

  const handleDirectExport = useCallback(async () => {
    if (!imageDataUrl) return;

    if (!canDirectExport()) {
      showToast(`Daily export limit reached (${getDirectExportRemaining()} remaining). Try again tomorrow.`, 'error');
      return;
    }

    const ext = exportOptions.format === 'jpeg' ? 'jpg' : 'png';

    // Resize to target output size
    let dataUrl: string;
    try {
      dataUrl = await resizeImageToTarget(imageDataUrl, targetWidth, targetHeight);
    } catch {
      showToast('Failed to resize image', 'error');
      return;
    }

    // Apply watermark for free users
    if (isFreeUser) {
      try {
        dataUrl = await applyWatermark(dataUrl, exportOptions.format, exportOptions.quality);
      } catch (err) {
        console.error('Watermark failed, exporting without:', err);
      }
    }

    // Convert to JPEG if needed
    if (exportOptions.format === 'jpeg') {
      const canvas = document.createElement('canvas');
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('Failed to load image'));
        i.src = dataUrl;
      });
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      dataUrl = canvas.toDataURL('image/jpeg', exportOptions.quality);
    }

    incrementDirectExport();
    downloadDataUrl(dataUrl, `markitup-export.${ext}`);
    const remaining = getDirectExportRemaining();
    showToast(`Image exported! (${remaining} free export${remaining === 1 ? '' : 's'} remaining today)`, 'success');
  }, [imageDataUrl, targetWidth, targetHeight, exportOptions, isFreeUser, showToast]);

  // --- AI Extend (outpaint to different aspect ratio) ---

  const handleAiExtend = useCallback(() => {
    const sourceImage = variations.length > 0 ? variations[selectedVariation] : imageDataUrl;
    if (!sourceImage) return;

    const preset = selectedPresetId !== 'custom' ? findPresetById(selectedPresetId) : null;
    const gemini = preset
      ? { aspectRatio: preset.geminiAspectRatio, imageSize: preset.geminiImageSize }
      : resolveGeminiConfig(customWidth, customHeight);

    setExtending(true);

    execute(async () => {
      const result = await extendImage(
        sourceImage,
        gemini.aspectRatio,
        gemini.imageSize,
        targetWidth,
        targetHeight,
      );

      // Resize to exact target dimensions
      const resized = await resizeImageToTarget(result.variation, targetWidth, targetHeight);

      // Replace current view with extended image
      setVariations([resized]);
      setRawVariations([result.variation]);
      setGenGeminiConfig(gemini);
      setSelectedVariation(0);
      setCheckedVariations(new Set([0]));
      setExtending(false);

      showToast('Image extended to new aspect ratio!', 'success');
      return result;
    }).catch(() => {
      setExtending(false);
    });
  }, [imageDataUrl, variations, selectedVariation, selectedPresetId, customWidth, customHeight, targetWidth, targetHeight, execute, showToast]);

  // Detect aspect ratio mismatch for AI Extend button
  const showAiExtend = useMemo(() => {
    if (!imageDataUrl || generating || extending) return false;
    // Load source image dimensions to compare ratios
    return true; // We'll check ratio mismatch in the component
  }, [imageDataUrl, generating, extending]);

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
    setHighlightActive(false);
    setHighlightStrokes([]);
    setActiveTab('edit');
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

  const handleAddStroke = useCallback((stroke: Stroke) => {
    setHighlightStrokes((prev) => [...prev, stroke]);
    setHasHighlights(true);
  }, []);

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
          {generating || extending ? (
            /* Generating or extending — template carousel */
            <GeneratingPreview selectedTemplateName={extending ? 'AI Extend' : selectedTemplate.name} />
          ) : hasResult ? (
            /* Show selected variation */
            <img
              src={variations[selectedVariation]}
              alt={`Selected variation ${selectedVariation + 1}`}
              className="h-full w-full rounded-lg object-contain shadow-lg"
            />
          ) : highlightActive ? (
            /* Highlight mode — drawing canvas over image */
            <HighlightCanvas
              imageDataUrl={imageDataUrl}
              tool={highlightTool}
              brushSize={highlightBrushSize}
              strokes={highlightStrokes}
              onAddStroke={handleAddStroke}
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
        <aside className="flex w-80 shrink-0 flex-col border-l border-ds-border bg-ds-surface">
          {/* Tab Bar */}
          <div className="flex shrink-0 border-b border-ds-border">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'edit'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-muted hover:text-ds-text hover:bg-ds-elevated'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'generate'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-muted hover:text-ds-text hover:bg-ds-elevated'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'export'
                  ? 'border-ds-accent text-ds-accent'
                  : 'border-transparent text-ds-text-muted hover:text-ds-text hover:bg-ds-elevated'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto scrollbar-hidden p-4">

            {/* === TAB: Edit === */}
            {activeTab === 'edit' && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">Image Tools</h3>

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
                    Open Image Editor
                  </button>
                )}
                <p className="text-xs text-ds-text-dim leading-relaxed">
                  Crop, resize, rotate, adjust brightness/contrast, and remove backgrounds — all free.
                </p>

                {/* Highlight Areas */}
                {!generating && !hasResult && (
                  <>
                    <div className="h-px bg-ds-border" />
                    <HighlightOverlay
                      imageDataUrl={imageDataUrl}
                      onHighlightsChange={setHasHighlights}
                      compositeRef={highlightCompositeRef}
                      active={highlightActive}
                      onActiveChange={setHighlightActive}
                      tool={highlightTool}
                      onToolChange={setHighlightTool}
                      brushSize={highlightBrushSize}
                      onBrushSizeChange={setHighlightBrushSize}
                      strokes={highlightStrokes}
                      onStrokesChange={setHighlightStrokes}
                    />
                  </>
                )}

                <div className="h-px bg-ds-border" />

                {/* Description */}
                <DescriptionInput
                  description={description}
                  onDescriptionChange={setDescription}
                  isLifestyle={isLifestyle}
                  includeText={includeText}
                  onIncludeTextChange={setIncludeText}
                />

                {/* Brand Kit */}
                {user && (
                  <>
                    <div className="h-px bg-ds-border" />
                    <BrandKitSelector
                      kits={brandKits}
                      selectedId={selectedBrandId}
                      onSelect={setSelectedBrandId}
                      onManage={() => setShowBrandEditor(true)}
                      disabled={isFreeUser}
                    />
                  </>
                )}
              </>
            )}

            {/* === TAB: Generate === */}
            {activeTab === 'generate' && (
              <>
                {/* Template Picker */}
                <TemplatePicker
                  selectedTemplateId={selectedTemplate.id}
                  onTemplateChange={setSelectedTemplate}
                  onBrowseAll={() => setShowLibrary(true)}
                />
              </>
            )}

            {/* === TAB: Export === */}
            {activeTab === 'export' && (
              <>
                {/* Generate / Regenerate */}
                <div className="flex gap-2">
                  {!hasResult ? (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => !user ? handleSignInToGenerate() : handleGenerate()}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors ${
                        !generating
                          ? 'bg-ds-accent-emphasis hover:bg-ds-accent'
                          : 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
                      }`}
                    >
                      {generating && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {generating ? 'Generating...' : user ? 'Generate (1 credit)' : 'Sign in & Generate — 5 free credits'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => !user ? handleSignInToGenerate() : handleRegenerate()}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors ${
                        !generating
                          ? 'bg-ds-accent-emphasis hover:bg-ds-accent'
                          : 'cursor-not-allowed bg-ds-accent-emphasis opacity-50'
                      }`}
                    >
                      {generating && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {generating ? 'Regenerating...' : user ? 'Regenerate (1 credit)' : 'Sign in & Generate — 5 free credits'}
                    </button>
                  )}

                  {generating && (
                    <button
                      type="button"
                      onClick={handleCancelGenerate}
                      className="rounded-md border border-ds-border-light px-3 py-2 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="h-px bg-ds-border" />

                {/* Output Size */}
                <OutputSizePicker
                  selectedPresetId={selectedPresetId}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  onPresetChange={setSelectedPresetId}
                  onCustomSizeChange={(w, h) => { setCustomWidth(w); setCustomHeight(h); }}
                />

                {/* Variation selector */}
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

                {/* Export — AI variations */}
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

                {/* Export — Direct (no AI generation) */}
                {!hasResult && !generating && (
                  <>
                    <div className="h-px bg-ds-border" />
                    <ExportPanel
                      options={exportOptions}
                      onOptionsChange={setExportOptions}
                      onExport={handleDirectExport}
                      checkedCount={1}
                      directExport
                    />
                  </>
                )}

                {/* AI Extend */}
                {showAiExtend && user && (
                  <>
                    <div className="h-px bg-ds-border" />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ds-text-dim">AI Extend</h3>
                      <p className="text-xs text-ds-text-muted">
                        Use AI to extend your image to fill the selected output size. Works best when the aspect ratio differs from your source image.
                      </p>
                      <button
                        type="button"
                        disabled={extending}
                        onClick={handleAiExtend}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-ds-accent-emphasis/20 border border-ds-accent/30 px-3 py-2 text-sm font-medium text-ds-accent transition-colors hover:bg-ds-accent-emphasis/30 disabled:opacity-50"
                      >
                        {extending ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" />
                            </svg>
                            Extending...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 3 21 3 21 9" />
                              <polyline points="9 21 3 21 3 15" />
                              <line x1="21" y1="3" x2="14" y2="10" />
                              <line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                            AI Extend — 1 credit
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Batch Export */}
                {(hasResult || imageDataUrl) && !generating && !extending && (
                  <>
                    <div className="h-px bg-ds-border" />
                    <button
                      type="button"
                      onClick={() => setShowBatchExport(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-ds-border-light px-3 py-2 text-sm text-ds-text-muted transition-colors hover:border-ds-accent hover:text-ds-text"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Batch Export All Sizes
                    </button>
                  </>
                )}
              </>
            )}

          </div>
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

      {showBrandEditor && (
        <BrandKitEditor
          onClose={() => setShowBrandEditor(false)}
          onKitsChange={setBrandKits}
        />
      )}

      {showBatchExport && imageDataUrl && (
        <BatchExportModal
          imageDataUrl={hasResult ? variations[selectedVariation] : imageDataUrl}
          genAspectRatio={genGeminiConfig?.aspectRatio || null}
          genImageSize={genGeminiConfig?.imageSize || null}
          exportOptions={exportOptions}
          isFreeUser={isFreeUser}
          brandKit={!isFreeUser ? selectedBrandKit : null}
          onClose={() => setShowBatchExport(false)}
          onToast={showToast}
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
