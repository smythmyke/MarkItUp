/**
 * Sandbox page script for background removal.
 * Runs in a sandboxed iframe with relaxed CSP, allowing ONNX Runtime
 * to create blob: worker URLs that the main extension page cannot.
 *
 * Communication is via window.postMessage with the parent frame.
 */
import { removeBackground, type Config } from '@imgly/background-removal';

interface BgRemovalRequest {
  type: 'bg-removal-start';
  id: string;
  dataUrl: string;
}

interface BgRemovalProgress {
  type: 'bg-removal-progress';
  id: string;
  phase: 'downloading' | 'processing';
  progress: number;
}

interface BgRemovalResult {
  type: 'bg-removal-result';
  id: string;
  dataUrl: string;
}

interface BgRemovalError {
  type: 'bg-removal-error';
  id: string;
  error: string;
}

// Signal to parent that sandbox is ready
window.parent.postMessage({ type: 'bg-removal-ready' }, '*');

window.addEventListener('message', async (event) => {
  const msg = event.data as BgRemovalRequest;
  if (msg?.type !== 'bg-removal-start') return;

  const { id, dataUrl } = msg;

  try {
    const config: Config = {
      progress: (key: string, current: number, total: number) => {
        const pct = total > 0 ? current / total : 0;
        const phase = key.includes('fetch') || key.includes('download')
          ? 'downloading'
          : 'processing';
        const progressMsg: BgRemovalProgress = {
          type: 'bg-removal-progress',
          id,
          phase,
          progress: pct,
        };
        window.parent.postMessage(progressMsg, '*');
      },
    };

    const blob = await removeBackground(dataUrl, config);

    // Convert blob to data URL
    const reader = new FileReader();
    const resultDataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const resultMsg: BgRemovalResult = {
      type: 'bg-removal-result',
      id,
      dataUrl: resultDataUrl,
    };
    window.parent.postMessage(resultMsg, '*');
  } catch (err: any) {
    const errorMsg: BgRemovalError = {
      type: 'bg-removal-error',
      id,
      error: err.message || 'Background removal failed',
    };
    window.parent.postMessage(errorMsg, '*');
  }
});
