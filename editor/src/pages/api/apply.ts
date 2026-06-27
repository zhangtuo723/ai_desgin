import type { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import { DslOp } from '@/lib/ast-utils';
import { applyDslToFile } from '@/lib/dsl-handler';

const pagesRoot = path.resolve(process.cwd(), '../pages-site/src/pages');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    let body = req.body as DslOp | DslOp[] | string;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const ops: DslOp[] = Array.isArray(body) ? body : [body as DslOp];

    if (ops.length === 0) {
      res.status(400).json({ error: 'No operations provided' });
      return;
    }

    for (const op of ops) {
      if (!op.sourceid || !op.op) {
        res.status(400).json({ error: 'Missing sourceid or op' });
        return;
      }
      applyDslToFile(op, { pagesRoot });
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[api/apply] failed:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
