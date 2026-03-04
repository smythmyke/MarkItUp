# MarkItUp - AI-Powered Image Annotation Chrome Extension

## Overview

MarkItUp is a Chrome extension that takes in any image (screenshot, document, photo) along with user context describing what to highlight or call out, then uses AI vision to automatically generate professional annotations — boxes, arrows, callouts, labels — which the user can fully edit before exporting.

## Problem Statement

Marking up images with text, arrows, and callouts for store listings, documentation, bug reports, and marketing is tedious and manual. Existing tools are either:
- **Workflow recorders** (Scribe, Tango) — require you to perform a live process; can't annotate existing images
- **Manual editors** (Markup Hero, ScreenClip) — fast but fully manual, no AI assistance
- **No tool** fills the gap of: hand an image to AI, describe what to annotate, get a marked-up result

## Target Users

- Indie developers creating Chrome Web Store / App Store listings
- Support teams annotating screenshots for bug reports
- Marketers creating product visuals
- Technical writers building documentation
- Anyone who needs a quick, professional image markup

## Core User Flow

1. User opens MarkItUp (new tab editor)
2. User imports a screenshot via file picker, drag-and-drop, **or clipboard paste**
3. *(Optional)* User clicks "Edit Image" to crop, resize, rotate, adjust, or remove background — all free, client-side operations with undo/redo
4. User picks a **presentation template** (Glassmorphic, Clean Minimal, Bold Marketing, Dark Professional, Documentation) — each shows a preview thumbnail of the expected output style
5. User describes what the image shows, what to highlight, and the target audience
6. User clicks "Generate" → two-step AI pipeline: Claude analyzes the image and writes marketing copy → Gemini renders 3 polished visual variations using the template style
7. User views 3 variations side by side and clicks to select their favorite
8. User exports the final image (PNG/JPEG)
9. *(Optional)* User clicks "Regenerate" with a tweaked description (costs 1 additional credit)

## Technical Stack

| Layer              | Choice                  | Rationale                                           |
|--------------------|-------------------------|-----------------------------------------------------|
| Extension type     | Manifest V3, tab-based  | Full editor UI needs space; MV3 required for store  |
| Extension framework| WXT (wxt.dev)           | Purpose-built for extensions, active maintenance, HMR, manifest gen |
| UI framework       | React + TypeScript      | Ecosystem support, canvas lib integration           |
| Styling            | Tailwind CSS            | Utility-first, fast to build polished UI, small bundle with purging |
| Canvas editor      | Fabric.js v6            | Built-in editable objects, handles, serialization, native TS support |
| AI vision          | Claude API (via Firebase Cloud Function) | Strong vision + structured output; Cloud Function proxies calls server-side |
| Build tool         | Vite (via WXT)          | WXT uses Vite under the hood; best DX with HMR     |
| Backend            | Firebase (Auth + Firestore + Cloud Functions) | Auth, credit tracking, Stripe webhooks, AI proxy — Bull-Generator pattern |
| Auth               | Firebase Auth (Gmail sign-in) | Google sign-in via Chrome Identity API, familiar UX |
| Database           | Firestore               | Real-time credit balance updates via onSnapshot listener |
| Payments           | Stripe (Hosted Checkout) | Credit pack purchases, webhook-based credit provisioning |
| Themes             | Bundled JSON configs    | Simple, fast, works offline (applied locally, no AI call) |
| Export             | Canvas toDataURL/toBlob | PNG/JPEG export                                     |

## Architecture Details

### Chrome Extension Structure (WXT + React)

```
MarkItUp/
├── public/
│   └── icon/                   # Extension icons (16, 48, 128)
├── src/
│   ├── entrypoints/
│   │   ├── editor/             # Tab-based editor (WXT unlisted page)
│   │   │   ├── index.html      # Entry HTML
│   │   │   ├── main.tsx        # React mount point
│   │   │   └── App.tsx         # Root editor component
│   │   └── background.ts      # MV3 service worker (opens editor tab on icon click)
│   ├── components/
│   │   ├── Canvas.tsx          # Fabric.js canvas wrapper
│   │   ├── Toolbar.tsx         # Annotation tools (arrow, box, text, etc.)
│   │   ├── ThemePicker.tsx     # Theme/color scheme selector
│   │   ├── ContextInput.tsx    # User text input for AI instructions
│   │   ├── ImageImport.tsx     # File picker + drag-and-drop + clipboard paste
│   │   ├── ExportPanel.tsx     # Export options (PNG, JPEG, quality)
│   │   ├── AuthButton.tsx      # Gmail sign-in / sign-out + credit display
│   │   ├── CreditDisplay.tsx   # Credit balance pill (real-time via Firestore)
│   │   ├── CreditPurchase.tsx  # Credit pack purchase UI
│   │   └── InsufficientCreditsModal.tsx  # Shown when balance = 0
│   ├── contexts/
│   │   ├── AuthContext.tsx     # Firebase Auth state (user, loading, sign-in/out)
│   │   └── CreditContext.tsx   # Firestore real-time credit balance + useCreditGate
│   ├── hooks/
│   │   └── useCreditGate.ts   # Wraps AI calls with credit check/deduction
│   ├── lib/
│   │   ├── firebase.ts        # Firebase app init, Auth + Firestore instances
│   │   ├── api.ts             # Calls to Cloud Functions (annotate, credits, checkout)
│   │   ├── annotations.ts     # Convert AI response to Fabric.js objects
│   │   ├── themes.ts          # Theme definitions and application logic
│   │   └── storage.ts         # chrome.storage.local helpers (preferences)
│   ├── assets/
│   │   └── themes.json        # Bundled theme presets
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── functions/                  # Firebase Cloud Functions (deployed separately)
│   ├── src/
│   │   ├── index.ts           # Function exports, routing, auth middleware
│   │   ├── annotate.ts        # Proxy to Claude API (image + context → annotations JSON)
│   │   ├── credits.ts         # Credit balance, deduction (Firestore transactions), free tier
│   │   └── stripe.ts          # Checkout session creation, webhook handler
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules            # Users read own credits; writes via Admin SDK only
├── wxt.config.ts              # WXT configuration
├── tailwind.config.ts         # Tailwind CSS config
├── package.json
└── tsconfig.json
```

### AI Integration Strategy — Two-Step Pipeline

MarkItUp uses a **two-step AI pipeline** to produce high-quality marketing visuals:

**Step 1 — Claude (Analysis + Copywriting):**
Claude receives the screenshot + user description + template type and returns structured JSON with marketing copy and analysis. Claude excels at understanding UI context and writing precise, accurate text.

```json
{
  "headline": "Bulk Upload Listings in Seconds",
  "subHeadline": "Skip the manual grind — upload hundreds of Etsy listings with one click.",
  "highlightTarget": "Upload to Etsy button in the top-right",
  "tooltipText": "Click here to push all listings to your Etsy shop instantly",
  "marketingCopy": "BulkListingPro shows real-time metrics for successful, failed, and skipped listings."
}
```

**Step 2 — Gemini 2.0 Flash (Image Generation × 3):**
Gemini receives the screenshot + Claude's exact text + template rendering prompt and generates 3 polished visual variations. The prompt explicitly instructs Gemini to render Claude's text verbatim ("do not alter spelling or wording"). Gemini excels at visual composition, effects, and staging.

**Why two steps instead of one:**
- Gemini is prone to text hallucination (misspelling, phantom labels) — Claude writes all text
- Claude is better at understanding *what matters* in a UI screenshot
- Gemini focuses purely on visual rendering — its strength
- If Gemini still mangles text, we can fall back to client-side text overlay

**API providers:**
- **Claude API** (Anthropic) — vision analysis + copywriting. Called server-side from Cloud Function.
- **Gemini 2.0 Flash** (Google AI) — image generation. Called server-side from Cloud Function.
- Both API keys live server-side in Cloud Function env vars.

**Credit cost:** 1 credit = 1 generation (includes Claude analysis + 3 Gemini variations). Raw cost ~$0.14 per generation.

### Presentation Templates

5 bundled templates for v1, each consisting of a Claude prompt (what to analyze/write) and a Gemini prompt (how to render the visual):

| Template | Visual Style | Best For |
|----------|-------------|----------|
| **Glassmorphic** | Frosted glass panel, gradient backdrop, iridescent edges, sparkle accents | SaaS marketing, app store listings |
| **Clean Minimal** | White/light background, thin borders, subtle shadow, clean typography | Documentation, blog posts, tutorials |
| **Bold Marketing** | Vibrant gradient, large headline, neon glow highlights, energetic | Social media, ads, landing pages |
| **Dark Professional** | Dark backdrop, sharp contrast, gold/cyan accents, executive feel | Enterprise, pitch decks, case studies |
| **Documentation** | Numbered callouts, clean arrows, step indicators, neutral palette | Help docs, onboarding guides, how-tos |

Each template includes a **static preview thumbnail** (generated during development) so users see the expected output style before generating.

**Template structure:**
```typescript
interface Template {
  id: string;
  name: string;
  previewUrl: string;       // Static preview image in /assets/templates/
  description: string;      // Short description of the style
  claudePrompt: string;     // Instructions for Claude's analysis step
  geminiPrompt: string;     // Visual rendering instructions for Gemini
}
```

### Image Import

- **File picker** with drag-and-drop zone
- **Clipboard paste** (`Ctrl+V` / `Cmd+V`) — reads image from clipboard data
- Supported formats: PNG, JPEG, WebP, GIF (first frame), BMP, SVG
- Image loads onto the Fabric.js canvas as the background layer
- Canvas auto-sizes to image dimensions

### Export

- PNG (default, lossless)
- JPEG (with quality slider)
- Export at original resolution or scaled
- Fabric.js `toDataURL()` / `toBlob()` handles rendering

## Credit & Payment System

### Credit Model
- **1 credit = 1 generation** — produces 3 visual variations (Claude analysis + 3× Gemini rendering)
- Regeneration with tweaked description costs 1 additional credit
- Image editing (crop, resize, rotate, adjust, background removal) is free (client-side)
- Export is free

### Free Tier
- **3 free credits on first Gmail sign-in** — one-time grant, not recurring
- Enough to fully experience the product (1-2 images)
- After free credits exhausted, user must purchase

### Credit Packs (pricing TBD after testing)
- Starter, Standard, Pro, Power tiers with volume discounts
- Raw cost per credit: ~$0.015-0.02 (Claude Sonnet)
- Packs sold via Stripe Hosted Checkout
- Webhook credits user's Firestore balance on successful payment

### Credit Flow
```
User clicks "Annotate" or "Add more"
  → useCreditGate('annotate', 1, async () => { ... })
    → Cloud Function: POST /annotate
      ├─ Verify Firebase Auth token
      ├─ Deduct 1 credit (Firestore transaction, atomic)
      ├─ If 402 (insufficient): return error → show InsufficientCreditsModal
      ├─ Proxy image + context to Claude API
      └─ Return annotations JSON
    → Render annotations on Fabric.js canvas
    → Firestore onSnapshot updates credit display in real-time
```

### Purchase Flow
```
User clicks "Buy Credits"
  → Frontend: POST /credits/checkout (packId)
  → Cloud Function: creates Stripe checkout session
  → Opens Stripe Hosted Checkout in new tab
  → User pays → Stripe webhook → Cloud Function adds credits to Firestore
  → Firestore onSnapshot fires → UI updates credit balance in real-time
```

### Firestore Schema
```
credits/{uid}
  ├─ balance: number           # Available purchased credits
  ├─ freeCreditsGranted: boolean  # Whether 3 free credits were given
  ├─ totalPurchased: number    # Lifetime purchased
  ├─ totalUsed: number         # Lifetime used
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp

credits/{uid}/purchases/{id}
  ├─ date: Timestamp
  ├─ packId: string
  ├─ credits: number
  └─ amountPaid: number
```

## Key Design Decisions

1. **Fully editable annotations** — All AI-generated annotations are Fabric.js objects that can be moved, resized, re-colored, deleted, or have text edited
2. **AI required** — No offline/manual-only mode. The AI annotation is the core value proposition
3. **Firebase backend** — Auth (Gmail), Firestore (credits, real-time), Cloud Functions (AI proxy, Stripe webhooks). Bull-Generator pattern.
4. **Tab-based editor** — Not a popup or side panel. Full-page editor gives enough room for canvas + toolbars + panels
5. **1 credit = 1 AI call** — Simple billing model. Max 2 calls per image keeps costs bounded.
6. **Themes are local** — No AI call to apply a theme. Instant preview by updating Fabric.js object properties.

## Market Research Summary

### Existing tools reviewed:
- **Scribe** — Workflow recorder, auto-generates annotated guides. Not for static images.
- **Tango** — Same category as Scribe. Records processes, not static markup.
- **DocsHound** — AI analyzes UI and auto-annotates. Closest competitor but tied to their documentation platform.
- **Markup Hero** — Chrome extension, 20+ manual markup tools. No AI.
- **ScreenClip** — Chrome extension, manual annotations.
- **ScreenPick** — Capture + annotate + OCR.
- **Dr.Explain** — Desktop app, auto-detects UI elements. Not a browser extension.
- **Pixelle / Screenshots.pro / Hotpot** — App store screenshot generators. Marketing-focused, different use case.

### Gap confirmed:
No existing tool lets you upload an arbitrary image, describe what to annotate in natural language, and get editable AI-generated annotations. MarkItUp fills this gap.

## V1 Scope

- [ ] Chrome extension scaffold (Manifest V3 + WXT + React + Tailwind)
- [ ] Firebase project setup (Auth, Firestore, Cloud Functions)
- [ ] Gmail sign-in (Firebase Auth via Chrome Identity API)
- [ ] Tab-based editor UI with React
- [ ] Image import (file picker + drag-and-drop + clipboard paste)
- [ ] Fabric.js v6 canvas with image rendering
- [ ] AI integration (Claude API via Cloud Function — send image + context, parse structured response)
- [ ] Annotation rendering (boxes, arrows, callouts, highlights as Fabric.js objects)
- [ ] Full editing (move, resize, delete, edit text on all annotations)
- [ ] Iterative annotation ("Add more" — max 2 AI calls per image, 1 credit each)
- [ ] Credit system (Firestore real-time balance, useCreditGate hook, 3 free credits on first login)
- [ ] Stripe integration (credit pack purchase, hosted checkout, webhook provisioning)
- [ ] Credit purchase UI (packs, balance display, insufficient credits modal)
- [ ] Theme picker with 8-12 presets (instant local application)
- [ ] Export to PNG/JPEG
- [ ] Basic error handling and loading states

## Image Editing (Phase 5)

Client-side image editing tools, all free (no credits), running entirely in the browser:

- **Crop** — Drag-to-select region, aspect ratio presets (free, 16:9, 4:3, 1:1)
- **Resize** — Width/height with locked aspect ratio
- **Rotate / Flip** — 90° rotation, horizontal/vertical flip
- **Brightness / Contrast / Saturation** — Slider adjustments via OffscreenCanvas
- **Background Removal** — `@imgly/background-removal` (ONNX model, WASM/WebGL, ~30MB one-time download, cached)

Accessed via "Edit Image" button in sidebar → opens modal editor → undo/redo within editor → "Done" commits to canvas, "Cancel" discards. Edits happen on the source image before annotation.

## Future Considerations (Post-V1)

- Multiple AI provider support (OpenAI, Gemini)
- Capture current browser tab directly
- Annotation templates (store listing, bug report, tutorial, etc.)
- Batch processing (annotate multiple images)
- Cloud save / annotation history
- Shared theme marketplace
