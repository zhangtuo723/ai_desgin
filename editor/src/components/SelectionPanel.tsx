import { useEffect, useMemo, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { DslOp } from '@/lib/ast-utils';

interface ElementInfo {
  sourceid: string;
  filePath: string;
  astPath: string;
  start: { line: number; column: number; index: number };
  end: { line: number; column: number; index: number };
  code?: string;
}

interface SelectionPanelProps {
  sourceid: string | null;
  initialText: string;
  tagName: string;
  attributes: Record<string, string>;
  hasElementChildren: boolean;
  editMode?: boolean;
  onOpsChange?: (sourceid: string, ops: DslOp[]) => void;
}

const FONT_SIZES = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'];
const FONT_WEIGHTS = ['normal', 'medium', 'semibold', 'bold'];
const SPACING = ['0', '1', '2', '3', '4', '6', '8'];
const DISPLAYS = ['block', 'inline', 'flex', 'grid', 'hidden'];

function classNames(...list: Array<string | false | undefined>) {
  return list.filter(Boolean).join(' ');
}

function parseClassName(className: string): string[] {
  return className.trim().split(/\s+/).filter(Boolean);
}

function hasClass(classes: string[], prefix: string): boolean {
  return classes.some((c) => c.startsWith(prefix));
}

function removeByPrefix(classes: string[], prefix: string): string[] {
  return classes.filter((c) => !c.startsWith(prefix));
}

function getActiveSize(classes: string[], prefix: string): string | null {
  const found = classes.find((c) => c.startsWith(prefix));
  return found || null;
}

function toCamelCase(key: string): string {
  return key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toKebabCase(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function parseStyleString(value: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value) return result;
  const pairs = value.split(';');
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex < 0) continue;
    const key = pair.slice(0, colonIndex).trim();
    const val = pair.slice(colonIndex + 1).trim();
    if (key) result[toCamelCase(key)] = val;
  }
  return result;
}

function buildStyleString(style: Record<string, string>): string {
  return Object.entries(style)
    .filter(([, val]) => val)
    .map(([key, val]) => `${toKebabCase(key)}: ${val}`)
    .join('; ');
}

export default function SelectionPanel({
  sourceid,
  initialText,
  tagName,
  attributes,
  hasElementChildren,
  editMode = false,
  onOpsChange,
}: SelectionPanelProps) {
  const [text, setText] = useState(initialText);
  const [info, setInfo] = useState<ElementInfo | null>(null);
  const [infoError, setInfoError] = useState('');

  const initialClassName = attributes.class || attributes.className || '';
  const [className, setClassName] = useState(initialClassName);
  const [style, setStyle] = useState<Record<string, string>>({});
  const [customAttrs, setCustomAttrs] = useState<Record<string, string>>({});
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  useEffect(() => {
    setText(initialText);
    setClassName(attributes.class || attributes.className || '');
    setStyle(parseStyleString(attributes.style || ''));
    const rest: Record<string, string> = {};
    for (const [k, v] of Object.entries(attributes)) {
      if (k !== 'class' && k !== 'className' && k !== 'style') {
        rest[k] = v;
      }
    }
    setCustomAttrs(rest);
  }, [sourceid, initialText, attributes]);

  useEffect(() => {
    if (!sourceid || !onOpsChange || !editMode) return;
    const ops: DslOp[] = [];

    if (text !== initialText && !hasElementChildren) {
      ops.push({ sourceid, op: 'setText', value: text });
    }

    const newClassName = className.trim();
    const oldClassName = (attributes.class || attributes.className || '').trim();
    if (newClassName !== oldClassName) {
      ops.push({ sourceid, op: 'setAttr', name: 'className', value: newClassName });
    }

    const newStyle = buildStyleString(style);
    const oldStyle = attributes.style || '';
    if (newStyle !== oldStyle) {
      if (newStyle) {
        ops.push({ sourceid, op: 'setAttr', name: 'style', value: newStyle });
      } else {
        ops.push({ sourceid, op: 'removeAttr', name: 'style' });
      }
    }

    for (const [name, value] of Object.entries(customAttrs)) {
      const original = attributes[name];
      if (original !== value) {
        ops.push({ sourceid, op: 'setAttr', name, value });
      }
    }

    for (const name of Object.keys(attributes)) {
      if (name === 'class' || name === 'className' || name === 'style') continue;
      if (!(name in customAttrs)) {
        ops.push({ sourceid, op: 'removeAttr', name });
      }
    }

    if (ops.length > 0) {
      onOpsChange(sourceid, ops);
    }
  }, [sourceid, text, className, style, customAttrs, hasElementChildren, editMode, onOpsChange, initialText, attributes]);

  useEffect(() => {
    if (!sourceid) {
      setInfo(null);
      setInfoError('');
      return;
    }
    fetch(`/api/element-info?sourceid=${encodeURIComponent(sourceid)}`)
      .then((res) => res.json())
      .then((data: ElementInfo | { error: string }) => {
        if ('error' in data) {
          setInfoError(data.error);
          setInfo(null);
        } else {
          setInfo(data);
          setInfoError('');
        }
      })
      .catch((err) => {
        setInfoError(err.message);
        setInfo(null);
      });
  }, [sourceid]);

  const classes = useMemo(() => parseClassName(className), [className]);

  if (!sourceid) {
    return null;
  }

  const applyClassChange = (nextClasses: string[]) => {
    setClassName(nextClasses.join(' '));
  };

  const updateStyle = (key: string, value: string) => {
    setStyle((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSize = (prefix: string, value: string) => {
    const current = getActiveSize(classes, prefix);
    let next = removeByPrefix(classes, prefix);
    if (current !== `${prefix}-${value}` && current !== value) {
      next.push(`${prefix}-${value}`);
    }
    applyClassChange(next);
  };

  const toggleDisplay = (value: string) => {
    let next = classes.filter((c) => !DISPLAYS.includes(c));
    if (!classes.includes(value)) {
      next.push(value);
    }
    applyClassChange(next);
  };

  const addCustomAttr = () => {
    if (!newAttrName.trim()) return;
    setCustomAttrs((prev) => ({ ...prev, [newAttrName.trim()]: newAttrValue }));
    setNewAttrName('');
    setNewAttrValue('');
  };

  const removeCustomAttr = (name: string) => {
    setCustomAttrs((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const hasChanges =
    (!hasElementChildren && text !== initialText) ||
    className.trim() !== (attributes.class || attributes.className || '').trim() ||
    buildStyleString(style) !== (attributes.style || '') ||
    Object.keys(customAttrs).some((name) => customAttrs[name] !== attributes[name]) ||
    Object.keys(attributes).some(
      (name) => name !== 'class' && name !== 'className' && name !== 'style' && !(name in customAttrs)
    );

  const activeFontSize = classes.find((c) => FONT_SIZES.includes(c.replace('text-', '')));
  const activeFontWeight = classes.find((c) => FONT_WEIGHTS.includes(c.replace('font-', '')));

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">属性</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {info && (
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
            <div className="font-medium text-gray-900">{info.filePath}</div>
            <div className="text-gray-500">
              行 {info.start.line}, 列 {info.start.column}
            </div>
            {info.code && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                {info.code}
              </pre>
            )}
          </div>
        )}

        {infoError && <div className="text-red-600 text-xs">{infoError}</div>}

        <div className="text-xs text-gray-500 font-mono break-all">{sourceid}</div>

        <div className="text-sm">
          <span className="text-gray-500">标签:</span>{' '}
          <span className="font-mono font-medium text-gray-900">{tagName || '未知'}</span>
        </div>

        {!hasElementChildren ? (
          <section>
            <label className="block text-xs font-semibold text-gray-700 mb-2">文本</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[80px] p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
            />
          </section>
        ) : (
          <section className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
            该元素包含子元素。要编辑文本，请选择一个子文本元素。
          </section>
        )}

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">文字颜色</label>
          <div className="space-y-2">
            <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
              <HexColorPicker
                color={style.color || '#000000'}
                onChange={(color) => updateStyle('color', color)}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">#</span>
              <input
                value={(style.color || '#000000').replace(/^#/, '')}
                onChange={(e) => updateStyle('color', `#${e.target.value}`)}
                className="flex-1 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:border-blue-500 outline-none uppercase"
                maxLength={6}
              />
            </div>
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">背景</label>
          <div className="space-y-2">
            <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
              <HexColorPicker
                color={style.backgroundColor || '#ffffff'}
                onChange={(color) => updateStyle('backgroundColor', color)}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">#</span>
              <input
                value={(style.backgroundColor || '#ffffff').replace(/^#/, '')}
                onChange={(e) => updateStyle('backgroundColor', `#${e.target.value}`)}
                className="flex-1 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:border-blue-500 outline-none uppercase"
                maxLength={6}
              />
            </div>
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">字体大小</label>
          <div className="flex flex-wrap gap-1.5">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize('text-', size)}
                className={classNames(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  activeFontSize === `text-${size}`
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">字重</label>
          <div className="flex flex-wrap gap-1.5">
            {FONT_WEIGHTS.map((w) => (
              <button
                key={w}
                onClick={() => toggleSize('font-', w)}
                className={classNames(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  activeFontWeight === `font-${w}`
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">内边距</label>
          <div className="flex flex-wrap gap-1.5">
            {SPACING.map((s) => (
              <button
                key={`p-${s}`}
                onClick={() => toggleSize('p-', s)}
                className={classNames(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  classes.includes(`p-${s}`)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">外边距</label>
          <div className="flex flex-wrap gap-1.5">
            {SPACING.map((s) => (
              <button
                key={`m-${s}`}
                onClick={() => toggleSize('m-', s)}
                className={classNames(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  classes.includes(`m-${s}`)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">显示方式</label>
          <div className="flex flex-wrap gap-1.5">
            {DISPLAYS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDisplay(d)}
                className={classNames(
                  'px-2.5 py-1 text-xs rounded-md border transition-colors',
                  classes.includes(d)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">类名</label>
          <textarea
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full min-h-[60px] p-2.5 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
          />
        </section>

        <section>
          <label className="block text-xs font-semibold text-gray-700 mb-2">自定义属性</label>
          <div className="space-y-2">
            {Object.entries(customAttrs).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <input value={name} disabled className="w-20 px-2 py-1 text-xs border border-gray-200 rounded bg-gray-50" />
                <input
                  value={value}
                  onChange={(e) => setCustomAttrs((prev) => ({ ...prev, [name]: e.target.value }))}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
                />
                <button
                  onClick={() => removeCustomAttr(name)}
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                >
                  ×
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                placeholder="属性名"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
              <input
                placeholder="属性值"
                value={newAttrValue}
                onChange={(e) => setNewAttrValue(e.target.value)}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 outline-none"
              />
              <button
                onClick={addCustomAttr}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                添加
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {hasChanges
            ? '变更已实时预览。点击“完成编辑”保存。'
            : '无变更'}
        </div>
      </div>
    </div>
  );
}
