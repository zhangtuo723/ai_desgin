import { createFigmaConverter } from '@figit/dom-to-figma';

const EDITOR_ORIGIN = 'http://localhost:5173';

function getPageNameFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') || 'Home.tsx';
}

function postResult(source: MessageEventSource | null, origin: string, payload: unknown) {
  try {
    (source as Window | null)?.postMessage(payload, origin);
  } catch {
    // Result is best-effort; ignore cross-origin post errors.
  }
}

export function initExportToFigma() {
  window.addEventListener('message', async (event) => {
    if (event.origin !== EDITOR_ORIGIN) return;
    if (event.data?.type !== 'EXPORT_TO_FIGMA') return;

    const name = event.data.name || getPageNameFromUrl();
    try {
      const root = document.getElementById('root') || document.body;
      const rect = root.getBoundingClientRect();

      const figma = createFigmaConverter();
      const result = await figma.convert({
        element: root,
        width: Math.max(1, Math.ceil(rect.width)),
        height: Math.max(1, Math.ceil(rect.height)),
        name,
      });

      postResult(event.source, event.origin, {
        type: 'EXPORT_TO_FIGMA_RESULT',
        success: true,
        name,
        html: result.toClipboardHtml(),
      });
    } catch (err: any) {
      console.error('[export-to-figma] failed:', err);
      postResult(event.source, event.origin, {
        type: 'EXPORT_TO_FIGMA_RESULT',
        success: false,
        name,
        error: err.message || 'Export failed',
      });
    }
  });
}
