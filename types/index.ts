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

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
}

export interface TextAnalysis {
  headline: string;
  subHeadline: string;
  highlightTarget: string;
  tooltipText: string;
  marketingCopy: string;
}

export interface GenerateResponse {
  text: TextAnalysis;
  variations: string[]; // base64 data URLs
}

// --- Toast ---

export type ToastVariant = 'error' | 'success' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}
