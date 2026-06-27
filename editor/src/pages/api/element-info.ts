import type { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import { loadSourceIdMap } from '@/lib/dsl-handler';

const pagesRoot = path.resolve(process.cwd(), '../pages-site/src/pages');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const sourceid = req.query.sourceid as string;
  if (!sourceid) {
    res.status(400).json({ error: 'Missing sourceid' });
    return;
  }

  const map = loadSourceIdMap(pagesRoot);
  const entry = map[sourceid];

  if (!entry) {
    res.status(404).json({ error: `Unknown sourceid: ${sourceid}` });
    return;
  }

  res.status(200).json({
    sourceid,
    filePath: entry.filePath,
    astPath: entry.astPath,
    start: entry.start,
    end: entry.end,
    code: entry.code,
  });
}
