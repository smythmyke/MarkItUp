// --- Annotation Types ---

interface BaseAnnotation {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface BoxAnnotation extends BaseAnnotation {
  type: 'box';
  width: number;
  height: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  toX: number;
  toY: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  width: number;
  height: number;
}

export type Annotation = BoxAnnotation | ArrowAnnotation | HighlightAnnotation;
export type AnnotationType = Annotation['type'];

// --- Theme ---

export interface Theme {
  id: string;
  name: string;
  calloutBg: string;
  calloutText: string;
  calloutBorder: string;
  arrowColor: string;
  boxStroke: string;
  boxStrokeWidth: number;
  highlightColor: string;
  fontFamily: string;
  fontSize: number;
  cornerRadius: number;
  shadowEnabled: boolean;
  shadowColor: string;
}

// --- Export ---

export interface ExportOptions {
  format: 'png' | 'jpeg';
  quality: number; // 0-1, only relevant for JPEG
}

// --- Canvas API ---

export interface CanvasAPI {
  addAnnotation: (annotation: Annotation, theme: Theme) => void;
  addAnnotations: (annotations: Annotation[], theme: Theme) => void;
  clearAnnotations: () => void;
  removeSelected: () => void;
  applyTheme: (theme: Theme) => void;
  exportImage: (options: ExportOptions) => string | null;
  getAnnotationCount: () => number;
  getImageDimensions: () => { width: number; height: number };
}

// --- Auth ---

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// --- Credits ---

export interface CreditBalance {
  balance: number;
  freeCreditsGranted: boolean;
  totalUsed: number;
  totalPurchased: number;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number; // cents
  label: string;
  perCredit: string;
}

// --- AI ---

export interface AnnotateRequest {
  imageDataUrl: string;
  context: string;
  existingAnnotations?: Annotation[];
}

export interface AnnotateResponse {
  annotations: Annotation[];
}

// --- Presentation Templates ---

export type TemplateCategory = 'product' | 'professional' | 'technical' | 'creative' | 'decade' | 'lifestyle';

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'professional', label: 'Professional' },
  { id: 'technical', label: 'Technical' },
  { id: 'creative', label: 'Creative' },
  { id: 'decade', label: 'Decade' },
  { id: 'lifestyle', label: 'Lifestyle' },
];

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: TemplateCategory;
  tags: string[];
}

// --- Output Size Presets ---

export type OutputSizeCategory = 'social' | 'marketing' | 'product' | 'banners' | 'store';

export interface OutputSizePreset {
  id: string;
  label: string;              // "Instagram Square"
  platform: string;           // "Instagram" — for search matching
  width: number;
  height: number;
  category: OutputSizeCategory;
  geminiAspectRatio: string;  // "1:1"
  geminiImageSize: string;    // "2K"
}

export interface TextAnalysis {
  headline: string;
  subHeadline: string;
  highlightTarget: string;
  tooltipText: string;
  marketingCopy: string;
}

export interface GenerateResponse {
  text: TextAnalysis | null; // null for scenic mode (no description)
  variations: string[];      // base64 data URLs
}

export interface RegenResponse {
  variation: string;              // base64 data URL
  text: TextAnalysis | null;      // null for scenic mode; possibly updated with synonyms
  textCorrected: boolean;         // true if synonyms were swapped
}

// --- Image Editor ---

export type EditorTool = 'crop' | 'resize' | 'rotate' | 'adjust' | 'bgremoval';

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatioPreset = 'free' | '16:9' | '4:3' | '1:1' | '9:16' | '3:4';

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
}

export interface ImageDimensions {
  width: number;
  height: number;
}

// --- Toast ---

export type ToastVariant = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}
