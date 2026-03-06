// v2: text quality upgrades, API key fix, model upgrades (2026-03-05)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { handleAnnotateRequest } from "./annotate";
import { handleGenerateRequest, handleRegenRequest, handleExtendRequest } from "./generate";
import { handleCreditRequest, getBalance } from "./credits";
import { handleWebhookEvent } from "./stripe";

admin.initializeApp();

/**
 * Set CORS headers manually to support chrome-extension:// origins.
 * The `cors` npm package sometimes drops non-http(s) origins.
 */
function setCorsHeaders(
  req: functions.https.Request,
  res: functions.Response
): void {
  const origin = req.headers.origin || "";
  // Allow chrome-extension origins, GitHub Pages, and localhost for dev
  const allowedOrigins = [
    "chrome-extension://",
    "http://localhost",
    "https://smythmyke.github.io",
  ];
  if (
    allowedOrigins.some((prefix) => origin.startsWith(prefix))
  ) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    res.set("Access-Control-Allow-Origin", "*");
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Max-Age", "3600");
}

// Rate limiting: userId -> { count, resetTime }
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

async function verifyAuth(
  req: functions.https.Request
): Promise<admin.auth.DecodedIdToken> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Missing or invalid Authorization header"
    );
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid or expired token"
    );
  }
}

// Main API endpoint
export const api = functions
  .runWith({ timeoutSeconds: 300, memory: "512MB" })
  .https.onRequest(async (req, res) => {
  setCorsHeaders(req, res);

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyAuth(req);

    if (!checkRateLimit(decodedToken.uid)) {
      res.status(429).json({ error: "Rate limit exceeded. Try again later." });
      return;
    }

    const path = req.path;

    // Credit endpoints
    if (path.startsWith("/credits/")) {
      const result = await handleCreditRequest(path, req.body, decodedToken);
      res.status(200).json({ data: result });
      return;
    }

    // Generate endpoint — two-step AI pipeline (text analysis + image generation)
    if (path === "/generate") {
      const db = admin.firestore();
      const balance = await getBalance(db, decodedToken.uid);
      if (balance.balance <= 0) {
        res.status(402).json({
          error: "No credits remaining. Purchase credits to continue.",
        });
        return;
      }

      const result = await handleGenerateRequest(req.body, decodedToken);
      res.status(200).json({ data: result });
      return;
    }

    // Regen endpoint — OCR-check + synonym swap + regenerate single variation
    if (path === "/regen") {
      const { chargeCredit } = req.body || {};
      if (chargeCredit) {
        const db = admin.firestore();
        const balance = await getBalance(db, decodedToken.uid);
        if (balance.balance <= 0) {
          res.status(402).json({
            error: "No credits remaining. Purchase credits to continue.",
          });
          return;
        }
      }

      const result = await handleRegenRequest(req.body, decodedToken);
      res.status(200).json({ data: result });
      return;
    }

    // Extend endpoint — AI outpaint to fill a different aspect ratio (1 credit)
    if (path === "/extend") {
      const db = admin.firestore();
      const balance = await getBalance(db, decodedToken.uid);
      if (balance.balance <= 0) {
        res.status(402).json({
          error: "No credits remaining. Purchase credits to continue.",
        });
        return;
      }

      const result = await handleExtendRequest(req.body, decodedToken);
      res.status(200).json({ data: result });
      return;
    }

    // Annotate endpoint (legacy) — verify credits before processing
    if (path === "/annotate") {
      const db = admin.firestore();
      const balance = await getBalance(db, decodedToken.uid);
      if (balance.balance <= 0) {
        res.status(402).json({
          error: "No credits remaining. Purchase credits to continue.",
        });
        return;
      }

      const result = await handleAnnotateRequest(req.body, decodedToken);
      res.status(200).json({ data: result });
      return;
    }

    res.status(404).json({ error: "Not found" });
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      const statusCode =
        error.code === "resource-exhausted" ? 402 :
        error.code === "unauthenticated" ? 401 :
        error.code === "not-found" ? 404 :
        error.code === "invalid-argument" ? 400 :
        error.code === "permission-denied" ? 403 : 500;
      res.status(statusCode).json({ error: error.message });
      return;
    }
    console.error("API request error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// Stripe webhook (unauthenticated — verified by Stripe signature)
export const stripeWebhook = functions.https.onRequest((req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  handleWebhookEvent(req.rawBody, signature)
    .then(() => {
      res.status(200).json({ received: true });
    })
    .catch((error) => {
      console.error("Webhook error:", error);
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      res.status(400).json({ error: message });
    });
});
