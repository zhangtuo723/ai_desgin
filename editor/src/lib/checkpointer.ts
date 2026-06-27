import { MemorySaver } from '@langchain/langgraph';

// 进程内存级 checkpointer：单例 agent 配一个全局 thread_id，
// 对话上下文存在内存里，服务不重启就一直在；/new 时换 thread_id 即开新会话。
// 若以后需要重启后仍保留历史，再换成 @langchain/langgraph-checkpoint-sqlite 的 SqliteSaver。
export const checkpointer = new MemorySaver();
