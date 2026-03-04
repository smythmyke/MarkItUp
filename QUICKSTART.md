# MarkItUp — Quick Start Reference

## To Resume Development

Open this folder in VS Code, then start Claude Code. The full plan is in `PROJECT_PLAN.md`.

## First Steps (in order)

1. Initialize WXT project: `npx wxt@latest init . --template react`
2. Install extension dependencies:
   - `fabric` (v6) — Canvas editor with editable objects, native TS
   - `tailwindcss` + `@tailwindcss/vite` — Utility-first styling
   - `firebase` — Auth + Firestore client
3. Set up Firebase project (Auth, Firestore, Cloud Functions)
4. Initialize Cloud Functions: `firebase init functions` (in `/functions`)
   - `stripe` — Checkout + webhooks
   - `@anthropic-ai/sdk` or direct fetch — Claude API proxy
5. Configure `wxt.config.ts` for the editor tab entrypoint
6. Set up project structure per the plan
7. Build the image import + canvas rendering first (visual feedback loop)
8. Add Firebase Auth (Gmail sign-in) + credit system
9. Add AI integration (Cloud Function proxying Claude API)
10. Add Stripe integration (credit purchases)
11. Add themes and export last

## Key Dependencies

### Extension (`/`)
```
npm install fabric firebase
npm install -D tailwindcss @tailwindcss/vite
```

### Cloud Functions (`/functions`)
```
npm install stripe @anthropic-ai/sdk firebase-admin firebase-functions
```

## Reference Projects

- **Bull-Generator** (`C:\Projects\Bull-Generator`) — Firebase Auth + Firestore credits + Stripe + Cloud Functions. Primary reference for backend pattern.
- **TubePilot** (`C:\Projects\TubePilot`) — Chrome extension credit system. Reference for extension-specific patterns.

## Environment Variables (Cloud Functions)

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```
