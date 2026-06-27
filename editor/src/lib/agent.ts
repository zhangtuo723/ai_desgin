import { randomUUID } from 'crypto';
import { createPageAgent } from './llm';

// 单例 agent：整个进程只创建一次，配合一个全局 thread_id 维护对话上下文。
let agentInstance: ReturnType<typeof createPageAgent> | null = null;
let threadId = randomUUID();

export function getAgent() {
  if (!agentInstance) {
    agentInstance = createPageAgent();
  }
  return agentInstance;
}

export function getThreadId() {
  return threadId;
}

// /new：换一个新的 thread_id，即开启全新会话（旧上下文不再被读取）。
export function resetThread() {
  threadId = randomUUID();
  return threadId;
}
