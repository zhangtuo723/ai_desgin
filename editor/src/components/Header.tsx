interface HeaderProps {
  editMode: boolean;
  selectMode: boolean;
  selectedPage: string | null;
}

export default function Header({ editMode, selectMode, selectedPage }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-blue-100 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">可视化页面编辑器</h1>
          <p className="text-[11px] text-slate-500">Visual Page Editor</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {selectedPage && (
          <span className="text-xs text-slate-500 hidden sm:inline bg-slate-100 px-2.5 py-1 rounded-full">
            {selectedPage}
          </span>
        )}
        {editMode && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              selectMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectMode ? 'bg-blue-500' : 'bg-amber-500'}`} />
            {selectMode ? '选择元素中' : '编辑中'}
          </span>
        )}
      </div>
    </header>
  );
}
