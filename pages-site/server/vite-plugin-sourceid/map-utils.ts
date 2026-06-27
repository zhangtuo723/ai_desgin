import { createHash } from 'crypto';

export function hashSourceId(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 12);
}

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

export interface SourceIdMapping {
  [sourceid: string]: SourceIdEntry;
}
