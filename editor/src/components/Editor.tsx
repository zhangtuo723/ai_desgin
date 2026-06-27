import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Header from './Header';
import ChatPanel from './ChatPanel';
import PagePreview, { DeviceType, PagePreviewRef, PAGES_ORIGIN } from './PagePreview';
import SelectionPanel from './SelectionPanel';
import { DslOp } from '@/lib/ast-utils';

export default function Editor() {
  const previewRef = useRef<PagePreviewRef>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [editMode, setEditMode] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [pendingOps, setPendingOps] = useState<DslOp[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [initialText, setInitialText] = useState('');
  const [selectedTagName, setSelectedTagName] = useState('');
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedHasElementChildren, setSelectedHasElementChildren] = useState(false);

  useEffect(() => {
    fetch('/api/pages')
      .then((res) => res.json())
      .then((data: { pages: string[] }) => {
        setPages(data.pages);
        if (data.pages.length > 0 && !selectedPage) {
          setSelectedPage(data.pages[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    previewRef.current?.postMessage({ type: 'SET_EDIT_MODE', editMode });
  }, [editMode]);

  useEffect(() => {
    previewRef.current?.postMessage({ type: 'SET_SELECT_MODE', selectMode });
  }, [selectMode]);

  useEffect(() => {
    if (!editMode) return;
    previewRef.current?.postMessage({ type: 'PREVIEW_OPS', ops: pendingOps });
  }, [pendingOps, editMode]);

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== PAGES_ORIGIN) return;
      if (event.data?.type !== 'EXPORT_TO_FIGMA_RESULT') return;

      if (!event.data.success) {
        toast.error(`导出到 Figma 失败：${event.data.error || '未知错误'}`);
        return;
      }

      try {
        const html: string = event.data.html || '';
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({ 'text/html': blob });
        await navigator.clipboard.write([item]);
        toast.success(`“${event.data.name}” 已复制到剪贴板，在 Figma 中粘贴即可`, { duration: 3000 });
      } catch (err: any) {
        toast.error(`复制到剪贴板失败：${err.message || '未知错误'}`);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSelect = (
    sourceid: string,
    text: string,
    tagName: string,
    attributes: Record<string, string>,
    hasElementChildren: boolean
  ) => {
    if (!editMode) return;
    if (sourceid === selectedSourceId) return;
    setSelectedSourceId(sourceid);
    setInitialText(text);
    setSelectedTagName(tagName);
    setSelectedAttributes(attributes);
    setSelectedHasElementChildren(hasElementChildren);
  };

  const clearEditState = () => {
    setSelectedSourceId(null);
    setInitialText('');
    setSelectedTagName('');
    setSelectedAttributes({});
    setSelectedHasElementChildren(false);
    setPendingOps([]);
  };

  const setPreviewEditMode = (next: boolean) => {
    setEditMode(next);
    setSelectMode(false);
    if (next) {
      toast.info('点击“选择元素”后，在预览区点击要编辑的 DOM', { duration: 1000 });
    } else {
      previewRef.current?.postMessage({ type: 'PREVIEW_CLEAR' });
      clearEditState();
    }
  };

  const handleCancel = () => {
    setPreviewEditMode(false);
  };

  const handleOpsChange = (sourceid: string, ops: DslOp[]) => {
    setPendingOps((prev) => {
      const prevForSource = prev.filter((op) => op.sourceid === sourceid);
      if (JSON.stringify(prevForSource) === JSON.stringify(ops)) return prev;
      const next = prev.filter((op) => op.sourceid !== sourceid);
      next.push(...ops);
      return next;
    });
  };

  const handleApply = async () => {
    if (pendingOps.length === 0) return;
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingOps),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('[apply] non-JSON response:', res.status, text.slice(0, 500));
        throw new Error(`服务器返回非 JSON 响应 (${res.status})`);
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Apply failed');
      setPreviewEditMode(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '保存失败');
    }
  };

  const handleAgentEdit = () => {
    // Agent may have modified the page source file. Reload the preview iframe
    // so the user sees the updated page.
    previewRef.current?.reload();
    toast.success('页面已更新，正在刷新预览', { duration: 1500 });
  };

  const handleExportToFigma = () => {
    if (!selectedPage) {
      toast.info('请先选择一个页面');
      return;
    }
    previewRef.current?.postMessage({ type: 'EXPORT_TO_FIGMA', name: selectedPage });
    toast.info('正在导出到 Figma…', { duration: 1500 });
  };

  const handlePageChange = (page: string) => {
    setSelectedPage(page);
    setPreviewEditMode(false);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Header editMode={editMode} selectMode={selectMode} selectedPage={selectedPage} />

      <div className="flex-1 flex gap-3 p-3 overflow-hidden">
        {!editMode && (
          <aside className="w-56 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">页面列表</h2>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors rounded-lg mb-1 ${
                    selectedPage === page
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between px-3 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={() => setSelectMode(!selectMode)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    选择元素
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={pendingOps.length === 0}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      pendingOps.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    完成编辑
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setPreviewEditMode(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  编辑页面
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setDevice('desktop')}
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                  device === 'desktop'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                电脑
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md transition-colors ${
                  device === 'mobile'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                手机
              </button>
            </div>

            <button
              onClick={handleExportToFigma}
              disabled={!selectedPage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 text-white transition-colors"
              title="导出当前页面到 Figma"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 10h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              导出到 Figma
            </button>
          </div>

          <div className="flex-1 overflow-hidden rounded-xl bg-slate-100/50 border border-slate-200/60 p-3">
            {selectedPage ? (
              <div
                className={`h-full mx-auto transition-all duration-200 ${
                  device === 'mobile' ? 'max-w-[375px]' : 'w-full'
                }`}
              >
                <div
                  className={`h-full bg-white overflow-hidden transition-all ${
                    device === 'mobile'
                      ? 'rounded-[2rem] shadow-xl border-[6px] border-slate-800'
                      : `rounded-xl shadow-sm border ${editMode ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`
                  }`}
                >
                  <PagePreview
                    ref={previewRef}
                    key={`${selectedPage}-${device}`}
                    pageName={selectedPage}
                    device={device}
                    onSelect={handleSelect}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                未选择页面。
              </div>
            )}
          </div>
        </main>

        {editMode && selectedSourceId && (
          <aside className="fixed right-3 top-28 bottom-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden z-10">
            <SelectionPanel
              key={selectedSourceId}
              sourceid={selectedSourceId}
              initialText={initialText}
              tagName={selectedTagName}
              attributes={selectedAttributes}
              hasElementChildren={selectedHasElementChildren}
              editMode={editMode}
              onOpsChange={handleOpsChange}
            />
          </aside>
        )}
      </div>

      <ChatPanel currentPage={selectedPage} onAgentEdit={handleAgentEdit} />
    </div>
  );
}
