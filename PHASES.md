# MarkItUp — Phased Build Plan

## Phase 1: Core Extension Shell ✅
**Status**: Complete

**Scope**: WXT + React + TypeScript scaffold, tab-based editor, image import (drag-drop, file picker, clipboard paste), Fabric.js canvas with pan/zoom.

**Deliverables**:
- WXT project structure with React module
- `entrypoints/editor/` — full-page editor tab
- `entrypoints/background.ts` — service worker opens editor on icon click
- `components/ImageImport.tsx` — drag-drop + file input + paste
- `components/Canvas.tsx` — Fabric.js v7 canvas with image rendering
- Deep Space theme tokens in `assets/main.css` (Tailwind v4 `@theme`)
- Logo, icon, wordmark assets

---

## Phase 2: Annotation Tools + Themes + Export ✅
**Status**: Complete

**Scope**: Manual annotation tools (box, arrow, highlight), 10 pre-built themes with live switching, PNG/JPEG export, toolbar, sidebar layout.

**Deliverables**:
- `components/Toolbar.tsx` — add box/arrow/highlight, delete, undo, clear
- `components/ThemePicker.tsx` — 10 theme selector with color previews
- `components/ContextInput.tsx` — AI instructions textarea (placeholder)
- `components/ExportPanel.tsx` — format toggle, quality slider, export button
- `lib/annotations.ts` — Fabric.js annotation creation & theme application
- `lib/themes.ts` — 10 theme definitions
- `lib/utils.ts` — ID generation, default annotations, download helper
- `types/index.ts` — Annotation, Theme, ExportOptions, CanvasAPI types

---

## Phase 3: Firebase Auth + Credits + AI Integration ✅
**Status**: Complete

**Scope**: Firebase project setup, Gmail sign-in via Chrome Identity API, Firestore credit system with real-time balance, Cloud Function as AI gateway (auth + credits + Claude proxy), Stripe credit purchases.

**Deliverables**:
- `lib/firebase.ts` — Firebase app init, auth + db exports
- `lib/api.ts` — Cloud Function HTTP client
- `contexts/AuthContext.tsx` — Firebase Auth + Chrome Identity API
- `contexts/CreditContext.tsx` — Firestore real-time credit balance
- `hooks/useCreditGate.ts` — credit-gated async operations
- `components/AuthButton.tsx` — sign in/out + avatar dropdown
- `components/CreditDisplay.tsx` — credit balance pill
- `components/CreditPurchase.tsx` — credit pack purchase UI
- `components/InsufficientCreditsModal.tsx` — out-of-credits modal
- `functions/` — Cloud Functions (annotate, credits, stripe)
- `firestore.rules` — security rules
- Wired AI flow: context input → credit gate → Claude API → canvas annotations

---

## Phase 4: Polish + Edge Cases ✅
**Status**: Complete

**Scope**: Error handling, loading states, retry logic, input validation, keyboard shortcuts, canvas resize, accessibility.

**Deliverables**:
- Toast notification system (error/success/info, auto-dismiss, stackable)
- API robustness: AbortController timeout (30s), single retry on network errors, safer JSON parsing
- Annotation validation: type checking, field validation, coordinate clamping to image bounds
- Input validation: file size limit (20MB), file type feedback, image resize >4096px, char limit (2000)
- Keyboard shortcuts: Delete/Backspace for selected annotation, Escape to close modals, Ctrl+Enter to annotate
- Canvas resize handling via ResizeObserver + CSS transform scaling
- Removed dead undo code (never functional)
- Accessibility: aria-labels, aria-current, role=dialog, aria-modal, focus traps, aria-expanded on dropdown
- Loading states: cancel button during AI generation, export button disable, popup blocker detection
- Avatar image onError fallback to initial letter

---

## Phase 5: Image Editor ✅
**Status**: Complete

**Scope**: Client-side image editing tools (crop, resize, rotate/flip, brightness/contrast, background removal) accessible via an "Edit Image" button in the sidebar, opening a modal editor with undo/redo. All operations run in the browser — no server cost, no credits spent.

**Deliverables**:
- `components/ImageEditor.tsx` — Modal overlay editor with tool panel + live preview
- `components/editor/CropTool.tsx` — Drag-to-select crop region, aspect ratio presets (free, 16:9, 4:3, 1:1)
- `components/editor/ResizeTool.tsx` — Width/height inputs with lock aspect ratio toggle
- `components/editor/RotateTool.tsx` — 90° rotate left/right, horizontal/vertical flip
- `components/editor/AdjustTool.tsx` — Brightness, contrast, saturation sliders (CSS filters applied via OffscreenCanvas)
- `components/editor/BackgroundRemovalTool.tsx` — Remove background using `@imgly/background-removal` (ONNX model, runs in browser via WASM/WebGL)
- `lib/imageEditor.ts` — Core edit operations (crop, resize, rotate, flip, adjust, bg removal) operating on ImageData/OffscreenCanvas
- `hooks/useEditHistory.ts` — Undo/redo stack for image edits (stores data URL snapshots, max ~10 steps)
- Sidebar "Edit Image" button (visible after image import, before annotation)
- "Done" commits edits to image data URL (replaces canvas background), "Cancel" discards
- Progress indicator for background removal (~3-10s on first use, model cached after)
- First-use model download notice (~30MB, one-time, cached in browser storage)

**Dependencies**:
- `@imgly/background-removal` — ONNX-based background removal, Apache 2.0, runs entirely client-side

**Key decisions**:
- All edit tools are free (no credits) — only AI annotation costs credits
- Edits happen on the source image before annotation, not on annotated canvas
- Undo/redo within editor modal only; "Done" is a one-way commit
- Background removal model (~30MB) downloads on first use, then cached by the browser

---

## Phase 6: Presentation Engine ✅
**Status**: Deployed (Cloud Functions live, pending Stripe keys + end-to-end testing)

**Scope**: Replace the Fabric.js annotation pipeline with a two-step AI generation pipeline (Claude for text/analysis → Gemini for image rendering). Users upload a screenshot, pick a presentation template, describe the purpose, and receive 3 polished marketing visual variations to choose from. This is the core pivot from "annotation overlay tool" to "AI marketing visual generator."

**Architecture — Two-Step AI Pipeline:**
```
Cloud Function: POST /generate
  ├─ Verify auth + deduct credit
  ├─ Step 1: Claude API (analysis + copywriting)
  │   Input: screenshot + user description + template type
  │   Output: { headline, subHeadline, highlightTarget, tooltipText, marketingCopy }
  │   Cost: ~$0.02
  ├─ Step 2: Gemini 2.0 Flash API (image generation × 3, parallel)
  │   Input: screenshot + template rendering prompt + Claude's exact text
  │   Output: 3 variation images (base64)
  │   Cost: ~$0.04 × 3 = $0.12
  └─ Return: { text: Claude's JSON, variations: [img1, img2, img3] }
  Total raw cost: ~$0.14 per generation
```

**Templates (5 for v1):**
1. **Glassmorphic** — Frosted glass panel, gradient backdrop, iridescent edges, sparkle accents (SaaS marketing, app store listings)
2. **Clean Minimal** — White/light background, thin borders, subtle shadow, clean typography (documentation, blog posts)
3. **Bold Marketing** — Vibrant gradient, large headline, neon glow highlights (social media, ads, landing pages)
4. **Dark Professional** — Dark backdrop, sharp contrast, gold/cyan accents (enterprise, pitch decks)
5. **Documentation** — Numbered callouts, clean arrows, step indicators, neutral palette (help docs, onboarding)

**Deliverables — Backend:** ✅
- `functions/src/generate.ts` — Two-step pipeline: Claude analysis → Gemini rendering × 3
- `functions/src/templates.ts` — Server-side template prompt pairs (Claude prompt + Gemini prompt per template)
- `functions/src/index.ts` — New `/generate` endpoint added, `/annotate` kept for legacy
- `@google/generative-ai` SDK installed
- Error handling: Claude failure → abort, Gemini partial failure → return available variations
- `functions/.env` — GEMINI_API_KEY set, CLAUDE_API_KEY needs user's Anthropic key
- `functions/.env.example` — Template for env vars

**Deliverables — Frontend:** ✅
- `components/TemplatePicker.tsx` — 2-column grid with gradient previews, click to select
- `components/VariationGrid.tsx` — 3-column grid showing generated variations with loading state
- `components/DescriptionInput.tsx` — Description textarea with Generate/Regenerate buttons
- `lib/presentationTemplates.ts` — Client-side template metadata (5 templates)
- `lib/api.ts` — `generateVisual()` function with 120s timeout
- `types/index.ts` — PresentationTemplate, ClaudeAnalysis, GenerateResponse types
- `entrypoints/editor/App.tsx` — New flow: Import → Template + Description → Generate → Pick → Export

**Deliverables — Cleanup:** ✅
- Removed `components/Canvas.tsx`, `Toolbar.tsx`, `ThemePicker.tsx`, `ContextInput.tsx`
- Removed `lib/annotations.ts`, `lib/validateAnnotations.ts`, `lib/themes.ts`
- Removed `fabric` dependency from `package.json`
- Bundle size: 890KB → 602KB

**Completed deployment steps:**
- ✅ Upgraded Firebase project to Blaze plan (billing linked)
- ✅ Added CLAUDE_API_KEY to `functions/.env`
- ✅ Added GEMINI_API_KEY to `functions/.env`
- ✅ Deployed Cloud Functions (`api` + `stripeWebhook` live)

**Remaining before live testing:**
- Add Stripe keys to `functions/.env` and redeploy
- Generate real template preview thumbnails using the pipeline
- End-to-end test: upload image → generate → view variations → export

**User flow:**
```
Upload screenshot
  → (Optional) Edit Image: crop, resize, rotate, adjust, remove background
  → Pick a presentation template (see preview of each style)
  → Describe: what the image shows, what to highlight, target audience
  → Click "Generate" (1 credit)
  → View 3 variations side by side
  → Click to select favorite
  → Export (PNG/JPEG download)
  → (Optional) "Regenerate" with tweaked description (1 more credit)
```

**Credit model:**
- 1 credit = 1 generation (3 variations included)
- Regeneration = 1 additional credit
- Image editing remains free (client-side)
- Raw cost ~$0.14 per generation — credit pricing TBD after testing

---

## Phase 7: Website + GitHub Pages ✅
**Status**: Complete

**Scope**: Full-featured web app on GitHub Pages (`/docs` folder). Landing page IS the app — upload zone front-and-center, marketing content below the fold. Chrome Web Store compliance pages (privacy, terms, support). Platform abstraction layer so the same codebase runs as both extension and web app.

**Deliverables — Web Build Infrastructure:** ✅
- `vite.web.config.ts` — Separate Vite config for web build, outputs to `/docs/`
- `src/web/main.tsx` + `src/web/index.html` — Web entry point (mounts same React app)
- `lib/platform.ts` — `isExtension` detection via `chrome.runtime.id`
- `tsconfig.web.json` — TypeScript config for web build
- npm scripts: `dev:web`, `build:web`, `preview:web`

**Deliverables — Platform Abstraction:** ✅
- `contexts/AuthContext.tsx` — `signInWithPopup` for web, Chrome Identity API for extension
- `lib/backgroundRemoval.ts` — Direct `@imgly/background-removal` on web, sandbox iframe on extension
- `lib/platform.ts` — Single `isExtension` flag used by all platform-aware code
- `functions/src/index.ts` — `smythmyke.github.io` added to CORS allowed origins
- `lib/presentationTemplates.ts` — Uses `import.meta.env.BASE_URL` for asset paths
- `components/HeroLanding.tsx` — Uses `import.meta.env.BASE_URL` for showcase assets

**Deliverables — Static Pages (Deep Space themed, mobile responsive):** ✅
- `/docs/index.html` — Landing page with embedded web app (upload zone visible immediately)
- `/docs/privacy.html` — Privacy Policy (CWS required)
- `/docs/terms.html` — Terms of Service (CWS required)
- `/docs/support.html` — Support/FAQ (CWS required)
- `/docs/404.html` — SPA fallback for direct URL access

**Deliverables — Showcase Assets:** ✅
- `public/showcase/` — L1-L7.png, R1-R7.png, space-bg.mp4 (all 15 files)
- HeroLanding: full mode (video bg + two scrolling columns) on web, compact mode on extension

**Remaining manual steps (Firebase Console):**
- Add `smythmyke.github.io` as an authorized domain in Firebase Auth settings
- Enable Google sign-in provider in Firebase Console (if not already)
- Deploy updated Cloud Functions with new CORS (`firebase deploy --only functions`)

**Key decisions:**
- `/docs` folder in main repo, served via GitHub Pages (`smythmyke.github.io/MarkItUp`)
- Full feature parity with extension — all templates, sizes, editor, export
- Same React app for both builds — platform detection at runtime
- `base: '/MarkItUp/'` in web Vite config for correct asset paths on GitHub Pages

---

## Phase 8: Launch Prep ⬚
**Status**: Not Started

**Scope**: Chrome Web Store listing, production Firebase/Stripe config, monitoring, analytics.

**Deliverables**:
- Chrome Web Store assets (screenshots, descriptions, promo images)
- CWS listing URLs: homepage → GitHub Pages, privacy → /privacy.html, support → /support.html
- Production environment configuration
- Firebase security audit
- Stripe production mode setup
- Error monitoring (Sentry or equivalent)
- Usage analytics dashboard
