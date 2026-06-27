import * as path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import { createDeepAgent, FilesystemBackend } from 'deepagents';
import { config } from './config';
import { checkpointer } from './checkpointer';

// 页面文件根目录（真实磁盘）。deepagents 默认用 StateBackend（虚拟内存 FS），
// 不会改真实文件，所以必须显式指定 FilesystemBackend 的 rootDir。
const pagesRoot = path.resolve(process.cwd(), '../pages-site/src/pages');

export function createKimiLLM() {
  if (!config.llmApiKey) {
    throw new Error('LLM_API_KEY is required to use the page editor agent');
  }
  return new ChatOpenAI({
    model: config.llmModel,
    temperature: 1,
    apiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl,
      headers: {
        'X-Client-Name': 'claude-code',
        'User-Agent': 'claude-code/1.0.0',
      },
    } as any,
  });
}

export function createPageAgent() {
  return createDeepAgent({
    model: createKimiLLM(),
    checkpointer,
    backend: new FilesystemBackend({ rootDir: pagesRoot }),
    systemPrompt: `You are a helpful visual page editor assistant. You have access to the filesystem tools to read and edit React TSX page files.

The project structure:
- Page files live at the filesystem root you are given (it maps to ../pages-site/src/pages/).
- Reference files by their path relative to that root, e.g. "login.tsx".
- Each .tsx file exports a default React component that renders a page.

Your job:
1. When the user asks to modify a page, read the corresponding TSX file first.
2. Make minimal, targeted edits to fulfill the request.
3. Preserve the existing structure, imports, and unrelated content.
4. After editing, briefly summarize what you changed.

If the user asks something unrelated to editing pages, answer normally.
`,
  });
}
