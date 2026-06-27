import { createRequire } from 'module';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

export interface SetTextOp {
  sourceid: string;
  op: 'setText';
  value: string;
}

export interface SetAttrOp {
  sourceid: string;
  op: 'setAttr';
  name: string;
  value: string;
}

export interface RemoveAttrOp {
  sourceid: string;
  op: 'removeAttr';
  name: string;
}

export type DslOp = SetTextOp | SetAttrOp | RemoveAttrOp;

const SOURCE_ID_ATTR = 'data-sourceid';

export function resolveAstPath(ast: t.File, astPath: string): t.JSXElement | null {
  const segments = astPath.split('.');
  let currentNode: any = ast;

  for (const segment of segments) {
    const match = segment.match(/^(\w+)\[(\d+)]$/);
    if (!match) return null;
    const [, key, indexStr] = match;
    const index = parseInt(indexStr, 10);

    let container: t.JSXElement[] = [];

    if (key === 'jsxElement') {
      if (currentNode.type === 'File') {
        container = collectTopLevelJsxElements(currentNode);
      } else if (currentNode.type === 'JSXElement') {
        container = currentNode.children.filter((c: t.Node): c is t.JSXElement =>
          t.isJSXElement(c)
        );
      }
    }

    if (!container || index >= container.length) {
      return null;
    }
    currentNode = container[index];
  }

  return currentNode && currentNode.type === 'JSXElement' ? currentNode : null;
}

function collectTopLevelJsxElements(ast: t.File): t.JSXElement[] {
  const elements: t.JSXElement[] = [];
  traverse(ast, {
    JSXElement(nodePath: NodePath<t.JSXElement>) {
      if (!nodePath.findParent((p: NodePath<t.Node>) => p.isJSXElement())) {
        elements.push(nodePath.node);
      }
    },
  });
  return elements;
}

export function setJsxText(element: t.JSXElement, value: string): boolean {
  const hasElementChildren = element.children.some((child) => t.isJSXElement(child));
  if (hasElementChildren) {
    throw new Error('Cannot set text on an element that contains child elements');
  }

  const textChildIndex = element.children.findIndex(
    (child) => t.isJSXText(child) || t.isJSXExpressionContainer(child)
  );

  if (textChildIndex >= 0) {
    element.children[textChildIndex] = t.jsxText(value);
    return true;
  }

  element.children.unshift(t.jsxText(value));
  return true;
}

function jsxAttrName(name: string): t.JSXIdentifier | t.JSXNamespacedName {
  if (name.includes(':')) {
    const [namespace, local] = name.split(':');
    return t.jsxNamespacedName(t.jsxIdentifier(namespace), t.jsxIdentifier(local));
  }
  return t.jsxIdentifier(name);
}

function parseStyleValue(value: string): t.ObjectExpression | null {
  try {
    const obj = JSON.parse(value);
    if (typeof obj !== 'object' || obj === null) return null;

    const properties: t.ObjectProperty[] = [];
    for (const [key, val] of Object.entries(obj)) {
      properties.push(
        t.objectProperty(t.identifier(key), t.stringLiteral(String(val)))
      );
    }
    return t.objectExpression(properties);
  } catch {
    // Try CSS-like format: "color: red; font-size: 14px"
    const properties: t.ObjectProperty[] = [];
    const pairs = value.split(';');
    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex < 0) continue;
      const key = pair.slice(0, colonIndex).trim();
      const val = pair.slice(colonIndex + 1).trim();
      if (!key) continue;
      properties.push(
        t.objectProperty(
          t.identifier(key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())),
          t.stringLiteral(val)
        )
      );
    }
    return properties.length > 0 ? t.objectExpression(properties) : null;
  }
}

export function setJsxAttr(
  element: t.JSXElement,
  name: string,
  value: string
): boolean {
  const attrName = jsxAttrName(name);
  const attributes = element.openingElement.attributes;

  const existingIndex = attributes.findIndex((attr) =>
    t.isJSXAttribute(attr) &&
    t.isJSXIdentifier(attr.name) &&
    attr.name.name === name
  );

  let attrValue: t.JSXAttribute['value'];

  if (name === 'style') {
    const styleObj = parseStyleValue(value);
    if (styleObj) {
      attrValue = t.jsxExpressionContainer(styleObj);
    } else {
      attrValue = t.stringLiteral(value);
    }
  } else {
    attrValue = t.stringLiteral(value);
  }

  const newAttr = t.jsxAttribute(attrName, attrValue);

  if (existingIndex >= 0) {
    attributes[existingIndex] = newAttr;
  } else {
    attributes.push(newAttr);
  }

  return true;
}

export function removeJsxAttr(element: t.JSXElement, name: string): boolean {
  const attributes = element.openingElement.attributes;
  const existingIndex = attributes.findIndex((attr) =>
    t.isJSXAttribute(attr) &&
    t.isJSXIdentifier(attr.name) &&
    attr.name.name === name
  );

  if (existingIndex >= 0) {
    attributes.splice(existingIndex, 1);
    return true;
  }

  return false;
}

export function applyDsl(code: string, astPath: string, op: DslOp): string {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const element = resolveAstPath(ast, astPath);

  if (!element) {
    throw new Error(`Cannot resolve astPath: ${astPath}`);
  }

  if (op.op === 'setText') {
    setJsxText(element, op.value);
  } else if (op.op === 'setAttr') {
    setJsxAttr(element, op.name, op.value);
  } else if (op.op === 'removeAttr') {
    removeJsxAttr(element, op.name);
  } else {
    throw new Error(`Unsupported op: ${(op as any).op}`);
  }

  const result = generate(ast, { retainLines: true }, code);
  return result.code;
}
