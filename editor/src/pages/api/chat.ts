import type { NextApiRequest, NextApiResponse } from 'next';
import { getAgent, getThreadId, resetThread } from '@/lib/agent';

function formatMessageContent(content: unknown): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
}

function normalizeHistoryMessage(message: any): { role: 'user' | 'assistant'; content: string } | null {
  if (!message || typeof message !== 'object') return null;

  const type = message.type || message._getType?.();
  if (type !== 'human' && type !== 'ai') return null;

  let content = formatMessageContent(message.content);
  // Strip the injected current-page prefix that the API adds to user messages.
  if (type === 'human') {
    const prefixMatch = content.match(/^（当前正在编辑的页面：[^）]+。[^）]*）\n\n/);
    if (prefixMatch) {
      content = content.slice(prefixMatch[0].length);
    }
  }

  return { role: type === 'human' ? 'user' : 'assistant', content };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const agent = getAgent();
      const threadId = getThreadId();
      const snapshot = await (agent as any).getState({ configurable: { thread_id: threadId } });
      const historyMessages = snapshot?.values?.messages || [];
      const messages = historyMessages
        .map(normalizeHistoryMessage)
        .filter((m: { role: 'user' | 'assistant'; content: string } | null): m is { role: 'user' | 'assistant'; content: string } => m !== null);

      res.status(200).json({ messages, threadId });
    } catch (err: any) {
      console.error('[api/chat] failed to load history:', err);
      res.status(500).json({ error: err.message || 'Failed to load chat history' });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    const { message, currentPage, reset } = req.body;

    // /new：换新 thread_id，开启新会话
    if (reset) {
      const threadId = resetThread();
      res.status(200).json({ threadId, reset: true });
      return;
    }

    if (!currentPage) {
      res.status(400).json({ error: 'Missing currentPage' });
      return;
    }
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Missing message' });
      return;
    }

    const agent = getAgent();
    const threadId = getThreadId();

    // 只发最新一条用户消息；历史由 checkpointer 按 thread_id 在服务端恢复。
    // 当前页信息折进这条 user 消息里，避免每轮注入 system 消息在线程里堆积，
    // 同时也能正确处理用户中途切换页面的情况。
    const result = await agent.invoke(
      {
        messages: [
          {
            role: 'user',
            content: `（当前正在编辑的页面：${currentPage}。如需修改请读取并编辑该文件——它位于文件系统根目录下，直接用相对路径 "${currentPage}"。）\n\n${message}`,
          },
        ],
      },
      { configurable: { thread_id: threadId } }
    );

    const lastMessage = result.messages[result.messages.length - 1];
    const content = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

    res.status(200).json({ message: content, threadId });
  } catch (err: any) {
    console.error('[api/chat] failed:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
}
