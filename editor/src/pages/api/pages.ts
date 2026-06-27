import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

const pagesRoot = path.resolve(process.cwd(), '../pages-site/src/pages');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  const pageFiles: string[] = [];
  if (fs.existsSync(pagesRoot)) {
    const entries = fs.readdirSync(pagesRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.tsx')) {
        pageFiles.push(entry.name);
      }
    }
  }

  res.status(200).json({ pages: pageFiles });
}
