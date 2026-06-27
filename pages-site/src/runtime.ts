/// <reference types="vite/client" />

const EDITOR_ORIGIN = 'http://localhost:5173';
const HOVER_CLASS = '__sourceid-editor-hover__';
const SELECTED_CLASS = '__sourceid-editor-selected__';

type RuntimeMode = 'interaction' | 'edit' | 'preview';

export interface ElementAttributes {
  [key: string]: string;
}

export interface ElementSelectedMessage {
  type: 'ELEMENT_SELECTED';
  sourceid: string;
  text: string;
  tagName: string;
  attributes: ElementAttributes;
  hasElementChildren: boolean;
}

export interface DslOp {
  sourceid: string;
  op: 'setText' | 'setAttr' | 'removeAttr';
  value?: string;
  name?: string;
}

export interface PreviewOpsMessage {
  type: 'PREVIEW_OPS';
  ops: DslOp[];
}

export interface PreviewClearMessage {
  type: 'PREVIEW_CLEAR';
}

export interface SetEditModeMessage {
  type: 'SET_EDIT_MODE';
  editMode: boolean;
}

export interface SetSelectModeMessage {
  type: 'SET_SELECT_MODE';
  selectMode: boolean;
}

let currentMode: RuntimeMode = 'interaction';
let selectMode = false;
let hoveredEl: HTMLElement | null = null;
let selectedEl: HTMLElement | null = null;

interface OriginalState {
  text: string | null;
  className: string | null;
  attrs: Record<string, string | null>;
}

const previewOriginals = new Map<string, OriginalState>();

function getInitialMode(): RuntimeMode {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'edit' || mode === 'preview') return mode;
  return 'interaction';
}

function injectHoverStyles() {
  if (document.getElementById('sourceid-hover-styles')) return;
  const style = document.createElement('style');
  style.id = 'sourceid-hover-styles';
  style.textContent = `
    .${HOVER_CLASS} {
      box-shadow: inset 0 0 0 2px #3b82f6 !important;
      cursor: pointer !important;
    }
    .${SELECTED_CLASS} {
      box-shadow: inset 0 0 0 3px #f59e0b !important;
      cursor: pointer !important;
    }
  `;
  document.head.appendChild(style);
}

function setHover(target: EventTarget | null) {
  const el = (target as HTMLElement | null)?.closest('[data-sourceid]') as HTMLElement | null;
  if (hoveredEl === el) return;
  if (hoveredEl) hoveredEl.classList.remove(HOVER_CLASS);
  hoveredEl = el;
  if (hoveredEl) hoveredEl.classList.add(HOVER_CLASS);
}

function setSelected(target: EventTarget | null) {
  document.querySelectorAll(`.${SELECTED_CLASS}`).forEach((el) => el.classList.remove(SELECTED_CLASS));
  const el = (target as HTMLElement | null)?.closest('[data-sourceid]') as HTMLElement | null;
  selectedEl = el;
  if (selectedEl) selectedEl.classList.add(SELECTED_CLASS);
}

function clearSelection() {
  setHover(null);
  setSelected(null);
}

function handleMouseOver(event: MouseEvent) {
  setHover(event.target);
}

function handleMouseOut(event: MouseEvent) {
  const related = event.relatedTarget as HTMLElement | null;
  if (!related || !related.closest('[data-sourceid]')) {
    setHover(null);
  }
}

function handleClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const el = target.closest('[data-sourceid]') as HTMLElement | null;
  if (!el) return;

  event.preventDefault();
  event.stopPropagation();

  const sourceid = el.getAttribute('data-sourceid') || '';
  const hasElementChildren = el.querySelector('*') !== null;
  const text = hasElementChildren ? '' : el.innerText || '';
  const tagName = el.tagName.toLowerCase();

  const attributes: ElementAttributes = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === 'data-sourceid') continue;
    attributes[attr.name] = attr.value;
  }

  setSelected(el);

  window.parent.postMessage(
    {
      type: 'ELEMENT_SELECTED',
      sourceid,
      text,
      tagName,
      attributes,
      hasElementChildren,
    } satisfies ElementSelectedMessage,
    EDITOR_ORIGIN
  );
}

function attachEditListeners() {
  injectHoverStyles();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleClick, true);
}

function detachEditListeners() {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleClick, true);
  setHover(null);
}

function setSelectMode(active: boolean) {
  if (selectMode === active) return;
  selectMode = active;
  if (selectMode) {
    attachEditListeners();
  } else {
    detachEditListeners();
    setSelected(null);
  }
}

function setMode(mode: RuntimeMode) {
  if (currentMode === mode) return;
  currentMode = mode;

  if (mode !== 'edit') {
    setSelectMode(false);
    clearSelection();
  }
}

function getOriginalState(el: HTMLElement, attrNames: string[]): OriginalState {
  const hasElementChildren = el.querySelector('*') !== null;
  const editorClasses = new Set([HOVER_CLASS, SELECTED_CLASS]);
  const originalClassName = el.className
    .split(/\s+/)
    .filter((c) => !editorClasses.has(c))
    .join(' ');
  return {
    text: hasElementChildren ? null : el.innerText,
    className: originalClassName,
    attrs: Object.fromEntries(attrNames.map((name) => [name, el.getAttribute(name)])),
  };
}

function parseStyleValue(value: string): string | null {
  try {
    const obj = JSON.parse(value);
    if (typeof obj !== 'object' || obj === null) return null;
    return Object.entries(obj)
      .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${v}`)
      .join('; ');
  } catch {
    return value;
  }
}

function applyOpToElement(el: HTMLElement, op: DslOp) {
  if (op.op === 'setText') {
    if (el.querySelector('*')) return;
    el.textContent = op.value ?? '';
  } else if (op.op === 'setAttr') {
    const name = op.name ?? '';
    const value = op.value ?? '';
    if (name === 'className' || name === 'class') {
      el.className = value;
    } else if (name === 'style') {
      const cssText = parseStyleValue(value);
      if (cssText) el.setAttribute('style', cssText);
    } else {
      el.setAttribute(name, value);
    }
  } else if (op.op === 'removeAttr') {
    const name = op.name ?? '';
    if (name === 'className' || name === 'class') {
      el.removeAttribute('class');
    } else {
      el.removeAttribute(name);
    }
  }
}

function collectAttrNames(ops: DslOp[]): string[] {
  const names = new Set<string>();
  for (const op of ops) {
    if (op.op === 'setAttr' || op.op === 'removeAttr') {
      if (op.name) names.add(op.name === 'className' ? 'class' : op.name);
    }
  }
  return Array.from(names);
}

function applyPreviewOps(ops: DslOp[]) {
  const opsBySourceId = new Map<string, DslOp[]>();
  for (const op of ops) {
    const list = opsBySourceId.get(op.sourceid) ?? [];
    list.push(op);
    opsBySourceId.set(op.sourceid, list);
  }

  for (const [sourceid, sourceOps] of opsBySourceId) {
    const el = document.querySelector(`[data-sourceid="${sourceid}"]`) as HTMLElement | null;
    if (!el) continue;

    if (!previewOriginals.has(sourceid)) {
      previewOriginals.set(sourceid, getOriginalState(el, collectAttrNames(sourceOps)));
    }

    for (const op of sourceOps) {
      applyOpToElement(el, op);
    }
  }
}

function clearPreview() {
  for (const [sourceid, original] of previewOriginals) {
    const el = document.querySelector(`[data-sourceid="${sourceid}"]`) as HTMLElement | null;
    if (!el) continue;

    if (original.text !== null) {
      el.textContent = original.text;
    }
    if (original.className !== null) {
      el.className = original.className;
    }
    for (const [name, value] of Object.entries(original.attrs)) {
      if (value === null) {
        el.removeAttribute(name);
      } else {
        el.setAttribute(name, value);
      }
    }
  }
  previewOriginals.clear();
}

export function initSourceidMessenger() {
  setMode(getInitialMode());

  window.addEventListener('message', (event) => {
    if (event.origin !== EDITOR_ORIGIN) return;
    const data = event.data as PreviewOpsMessage | PreviewClearMessage | SetEditModeMessage | SetSelectModeMessage;

    if (data?.type === 'SET_EDIT_MODE') {
      setMode(data.editMode ? 'edit' : 'interaction');
    } else if (data?.type === 'SET_SELECT_MODE') {
      setSelectMode(data.selectMode);
    } else if (data?.type === 'PREVIEW_OPS') {
      clearPreview();
      applyPreviewOps(data.ops);
    } else if (data?.type === 'PREVIEW_CLEAR') {
      clearPreview();
    }
  });
}
