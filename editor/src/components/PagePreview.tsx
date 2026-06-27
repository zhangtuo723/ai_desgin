import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export const PAGES_ORIGIN = 'http://localhost:5174';

export type DeviceType = 'desktop' | 'mobile';
export type PreviewMode = 'interaction' | 'edit' | 'preview';

export interface PagePreviewRef {
  postMessage: (message: unknown) => void;
  reload: () => void;
}

interface PagePreviewProps {
  pageName: string;
  device?: DeviceType;
  mode?: PreviewMode;
  onSelect?: (
    sourceid: string,
    initialText: string,
    tagName: string,
    attributes: Record<string, string>,
    hasElementChildren: boolean
  ) => void;
}

const DEVICE_VIEWPORT = {
  desktop: { width: '100%', height: '100%' },
  mobile: { width: 375, height: 667 },
};

const PagePreview = forwardRef<PagePreviewRef, PagePreviewProps>(
  ({ pageName, device = 'desktop', mode = 'interaction', onSelect }, ref) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      postMessage: (message: unknown) => {
        iframeRef.current?.contentWindow?.postMessage(message, PAGES_ORIGIN);
      },
      reload: () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        iframe.src = iframe.src;
      },
    }));

    useEffect(() => {
      if (!onSelect) return;
      const handler = (event: MessageEvent) => {
        if (event.origin !== PAGES_ORIGIN) return;
        if (event.data?.type !== 'ELEMENT_SELECTED') return;

        const { sourceid, text, tagName, attributes, hasElementChildren } = event.data;
        if (sourceid) {
          onSelect(sourceid, text || '', tagName || '', attributes || {}, !!hasElementChildren);
        }
      };

      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [onSelect]);

    const isMobile = device === 'mobile';
    const viewport = DEVICE_VIEWPORT[device];

    const src = `${PAGES_ORIGIN}/?page=${encodeURIComponent(pageName)}${mode !== 'interaction' ? `&mode=${mode}` : ''}`;

    return (
      <div className={`w-full h-full ${isMobile ? 'overflow-auto flex items-start justify-center bg-gray-100 p-4' : ''}`}>
        <iframe
          ref={iframeRef}
          src={src}
          style={{
            width: viewport.width,
            height: viewport.height,
            border: 'none',
            background: '#f8f9fa',
            ...(isMobile ? { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', borderRadius: '8px' } : {}),
          }}
          title="page-preview"
        />
      </div>
    );
  }
);

PagePreview.displayName = 'PagePreview';

export default PagePreview;
