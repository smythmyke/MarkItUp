/**
 * Background removal via a sandboxed iframe (extension) or direct library call (web).
 *
 * In Chrome extensions, ONNX Runtime creates blob: worker URLs which MV3 CSP blocks.
 * The sandbox page has relaxed CSP, so we run the actual removal there via postMessage.
 *
 * On the web, there's no CSP restriction, so we can import and run the library directly.
 */

import { isExtension } from './platform';

export type BgRemovalPhase = 'downloading' | 'processing';

export interface BgRemovalProgress {
  phase: BgRemovalPhase;
  progress: number; // 0-1
}

// --- Extension sandbox approach ---

let sandboxIframe: HTMLIFrameElement | null = null;
let sandboxReady = false;
let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve;
});

function ensureSandbox(): HTMLIFrameElement {
  if (sandboxIframe) return sandboxIframe;

  sandboxIframe = document.createElement('iframe');
  sandboxIframe.src = chrome.runtime.getURL('sandbox.html');
  sandboxIframe.style.display = 'none';
  document.body.appendChild(sandboxIframe);

  return sandboxIframe;
}

window.addEventListener('message', (event) => {
  if (event.data?.type === 'bg-removal-ready') {
    sandboxReady = true;
    readyResolve?.();
  }
});

let requestCounter = 0;

function removeViaExtensionSandbox(
  dataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void,
): Promise<string> {
  const iframe = ensureSandbox();

  const waitReady = sandboxReady ? Promise.resolve() : readyPromise;

  return waitReady.then(() => {
    const id = `bgr-${++requestCounter}`;

    return new Promise<string>((resolve, reject) => {
      function handler(event: MessageEvent) {
        const msg = event.data;
        if (!msg || msg.id !== id) return;

        switch (msg.type) {
          case 'bg-removal-progress':
            onProgress?.({ phase: msg.phase, progress: msg.progress });
            break;
          case 'bg-removal-result':
            window.removeEventListener('message', handler);
            resolve(msg.dataUrl);
            break;
          case 'bg-removal-error':
            window.removeEventListener('message', handler);
            reject(new Error(msg.error));
            break;
        }
      }

      window.addEventListener('message', handler);

      iframe.contentWindow!.postMessage(
        { type: 'bg-removal-start', id, dataUrl },
        '*',
      );
    });
  });
}

// --- Web direct approach ---

async function removeViaDirectLibrary(
  dataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void,
): Promise<string> {
  // Use a variable so Vite/Rollup can't statically analyse the specifier and
  // won't bundle @imgly/background-removal into the extension's editor chunk.
  // In the extension build this function is never called (isExtension === true),
  // but Vite would still bundle the dynamic import if the string were a literal.
  const mod = '@imgly/background-removal';
  const { removeBackground } = await import(/* @vite-ignore */ mod);

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const resultBlob = await removeBackground(blob, {
    progress: (key: string, current: number, total: number) => {
      const pct = total > 0 ? current / total : 0;
      const phase: BgRemovalPhase = key.includes('download') ? 'downloading' : 'processing';
      onProgress?.({ phase, progress: pct });
    },
  });

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read result'));
    reader.readAsDataURL(resultBlob);
  });
}

/** Remove background from a data URL image. Returns a data URL with transparent background. */
export async function removeImageBackground(
  dataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void,
): Promise<string> {
  if (isExtension) {
    return removeViaExtensionSandbox(dataUrl, onProgress);
  }
  return removeViaDirectLibrary(dataUrl, onProgress);
}
