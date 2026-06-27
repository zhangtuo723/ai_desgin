import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { Plugin } from 'vite';
import { hashSourceId, SourceIdMapping } from './map-utils';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;

const SOURCE_ID_ATTR = 'data-sourceid';

export interface SourceidPluginOptions {
  pagesRoot: string;
}

export function sourceidPlugin(options: SourceidPluginOptions): Plugin {
  const { pagesRoot } = options;
  const mapFilePath = path.resolve(pagesRoot, '..', '..', '.sourceid-map.json');

  return {
    name: 'sourceid-plugin',
    enforce: 'pre',

    buildStart() {
      // Clear stale map at start
      if (fs.existsSync(mapFilePath)) {
        fs.unlinkSync(mapFilePath);
      }
    },

    transform(code, id) {
      if (!id.endsWith('.tsx')) return null;
      const relative = path.relative(pagesRoot, id).replace(/\\/g, '/');
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return null;
      }

      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      const mapping: SourceIdMapping = {};
      let topLevelIndex = 0;

      traverse(ast, {
        JSXElement(nodePath: NodePath<t.JSXElement>) {
          const hasJsxAncestor = nodePath.findParent((p: NodePath<t.Node>) =>
            p.isJSXElement()
          );
          if (hasJsxAncestor) return;

          const astPath = `jsxElement[${topLevelIndex}]`;
          visitJsxElement(nodePath.node, astPath, relative, code, mapping);
          topLevelIndex++;
        },
      });

      // Merge mapping into existing map file
      const existing: SourceIdMapping = fs.existsSync(mapFilePath)
        ? JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'))
        : {};

      for (const [sid, info] of Object.entries(mapping)) {
        existing[sid] = info;
      }

      fs.writeFileSync(mapFilePath, JSON.stringify(existing, null, 2), 'utf-8');

      return generate(ast, { retainLines: true }, code);
    },
  };
}

function visitJsxElement(
  node: t.JSXElement,
  astPath: string,
  relativePath: string,
  code: string,
  mapping: SourceIdMapping
) {
  const opening = node.openingElement;

  const key = `${relativePath}:${astPath}`;
  const sourceid = hashSourceId(key);

  const existingAttrIndex = opening.attributes.findIndex(
    (attr) =>
      t.isJSXAttribute(attr) &&
      t.isJSXIdentifier(attr.name) &&
      attr.name.name === SOURCE_ID_ATTR
  );

  if (existingAttrIndex >= 0) {
    const existing = opening.attributes[existingAttrIndex] as t.JSXAttribute;
    existing.value = t.stringLiteral(sourceid);
  } else {
    opening.attributes.push(
      t.jsxAttribute(t.jsxIdentifier(SOURCE_ID_ATTR), t.stringLiteral(sourceid))
    );
  }

  const loc = node.loc;
  const start = loc?.start ?? { line: 0, column: 0 };
  const end = loc?.end ?? { line: 0, column: 0 };

  mapping[sourceid] = {
    filePath: relativePath,
    astPath,
    start: {
      line: start.line,
      column: start.column,
      index: node.start ?? 0,
    },
    end: {
      line: end.line,
      column: end.column,
      index: node.end ?? 0,
    },
    code: code.slice(node.start ?? 0, node.end ?? 0),
  };

  let childIndex = 0;
  for (const child of node.children) {
    if (t.isJSXElement(child)) {
      visitJsxElement(
        child,
        `${astPath}.jsxElement[${childIndex}]`,
        relativePath,
        code,
        mapping
      );
      childIndex++;
    }
  }
}
