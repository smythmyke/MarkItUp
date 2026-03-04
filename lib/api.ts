import { auth } from './firebase';
import type { Annotation, CreditBalance, GenerateResponse } from '../types';

const API_BASE_URL = 'https://us-central1-markitup-ext.cloudfunctions.net/api';
const REQUEST_TIMEOUT_MS = 30_000;
const GENERATE_TIMEOUT_MS = 120_000; // Generate pipeline takes longer (text analysis + 3x image gen)

async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be signed in');
  }
  return user.getIdToken(true);
}

async function callAPI<T>(
  endpoint: string,
  body: Record<string, unknown> = {},
  signal?: AbortSignal,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const token = await getAuthToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // If an external signal is provided, abort our controller when it fires
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  async function attempt(): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) message = errorData.error;
      } catch {
        // Response wasn't JSON — use default message
      }
      const err = new Error(message);
      (err as any).status = response.status;
      throw err;
    }

    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error('Invalid response from server');
    }
    return result.data as T;
  }

  try {
    return await attempt();
  } catch (err: any) {
    // Retry once on network errors (not 4xx/5xx HTTP errors, not aborts)
    const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
    if (isNetworkError && !controller.signal.aborted) {
      return await attempt();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// --- AI ---

export function annotateImage(
  imageDataUrl: string,
  context: string,
  existingAnnotations?: Annotation[],
  signal?: AbortSignal,
): Promise<{ annotations: Annotation[] }> {
  return callAPI<{ annotations: Annotation[] }>(
    '/annotate',
    { imageDataUrl, context, existingAnnotations },
    signal,
  );
}

// --- Generate (two-step pipeline) ---

export function generateVisual(
  imageDataUrl: string,
  description: string,
  templateId: string,
  aspectRatio: string,
  imageSize: string,
  signal?: AbortSignal,
): Promise<GenerateResponse> {
  return callAPI<GenerateResponse>(
    '/generate',
    { imageDataUrl, description, templateId, aspectRatio, imageSize },
    signal,
    GENERATE_TIMEOUT_MS,
  );
}

// --- Credits ---

export async function getBalance(): Promise<CreditBalance> {
  return callAPI<CreditBalance>('/credits/balance');
}

export async function createCheckoutSession(
  packId: string,
): Promise<{ url: string; sessionId: string }> {
  return callAPI<{ url: string; sessionId: string }>('/credits/checkout', { packId });
}

export async function getCreditPacks(): Promise<{ packs: Array<{ id: string; credits: number; price: number; label: string; perCredit: string }> }> {
  return callAPI('/credits/packs');
}
