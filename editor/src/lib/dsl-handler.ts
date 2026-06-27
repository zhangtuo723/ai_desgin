import * as fs from 'fs';
import * as path from 'path';
import { applyDsl, DslOp } from './ast-utils';

export interface SourceLocation {
  line: number;
  column: number;
  index: number;
}

export interface SourceIdEntry {
  filePath: string;
  astPath: string;
  start: SourceLocation;
  end: SourceLocation;
  code?: string;
}

interface SourceIdMapping {
  [sourceid: string]: SourceIdEntry;
}

export function loadSourceIdMap(pagesRoot: string): SourceIdMapping {
  const mapFilePath = path.resolve(pagesRoot, '..', '..', '.sourceid-map.json');
  if (!fs.existsSync(mapFilePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(mapFilePath, 'utf-8'));
}

export interface DslHandlerOptions {
  pagesRoot: string;
}

export function applyDslToFile(op: DslOp, options: DslHandlerOptions): void {
  const map = loadSourceIdMap(options.pagesRoot);
  const entry = map[op.sourceid];

  if (!entry) {
    throw new Error(`Unknown sourceid: ${op.sourceid}`);
  }

  const absolutePath = path.resolve(options.pagesRoot, entry.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const code = fs.readFileSync(absolutePath, 'utf-8');
  const newCode = applyDsl(code, entry.astPath, op);
  fs.writeFileSync(absolutePath, newCode, 'utf-8');
}
