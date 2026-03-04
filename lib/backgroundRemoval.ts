/**
 * Background removal via a sandboxed iframe.
 *
 * ONNX Runtime (used by @imgly/background-removal) creates blob: worker URLs
 * which Chrome MV3 extension CSP blocks. The sandbox page has relaxed CSP,
 * so we run the actual removal there and communicate via postMessage.
 */

export type BgRemovalPhase = 'downloading' | 'processing';

export interface BgRemovalProgress {
  phase: BgRemovalPhase;
  progress: number; // 0-1
}

let sandboxIframe: HTMLIFrameElement | null = null;
let sandboxReady = false;
let readyResolve: (() => void) | null = null;
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve;
});

/** Create the hidden sandbox iframe (once). */
function ensureSandbox(): HTMLIFrameElement {
  if (sandboxIframe) return sandboxIframe;

  sandboxIframe = document.createElement('iframe');
  sandboxIframe.src = chrome.runtime.getURL('sandbox.html');
  sandboxIframe.style.display = 'none';
  document.body.appendChild(sandboxIframe);

  return sandboxIframe;
}

// Listen for messages from sandbox
window.addEventListener('message', (event) => {
  if (event.data?.type === 'bg-removal-ready') {
    sandboxReady = true;
    readyResolve?.();
  }
});

let requestCounter = 0;

/** Remove background from a data URL image. Returns a data URL with transparent background. */
export async function removeImageBackground(
  dataUrl: string,
  onProgress?: (progress: BgRemovalProgress) => void,
): Promise<string> {
  const iframe = ensureSandbox();

  // Wait for sandbox to be ready
  if (!sandboxReady) {
    await readyPromise;
  }

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
}
