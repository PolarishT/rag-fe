import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AgentTypingStatus } from './components/AgentTypingStatus';
import { AgentThoughtProcess } from './components/AgentThoughtProcess';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { ConversationSidebar } from './components/ConversationSidebar';
import { EmptyState } from './components/EmptyState';
import { QuickActions } from './components/QuickActions';
import { TypingIndicator } from './components/TypingIndicator';
import { askRag } from './services/ragApi';
import type { RagNotice, RagProgressEvent } from './services/ragApi';
import type { ChatState, Message, MessageRole } from './types/chat';

const createMessage = (role: MessageRole, content: string): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  createdAt: new Date().toISOString(),
});

const initialState: ChatState = {
  messages: [],
  isGenerating: false,
};

const TYPEWRITER_INTERVAL_MS = 18;
const TYPEWRITER_CHARS_PER_TICK = 2;
const DEFAULT_CONVERSATION_ID = 'conversation-current';
const DEFAULT_CONVERSATION_TITLE = '[当前对话] 什么是 Ant Design X?';
const MESSAGE_FOOTER_GAP_PX = 24;

const sampleConversationReplies: Record<string, string> = {
  '如何快速安装和导入组件?':
    '可以先安装依赖，然后按需引入聊天相关组件：\n\n```bash\nnpm install @ant-design/x antd\n```\n\n在真实项目里，建议把 UI 组件、消息状态和 API 服务层拆开，这样后续接入 RAG 或模型流式接口会更轻松。',
  '新的 AGI 混合界面':
    '新的 AGI 混合界面通常会把“聊天”和“执行”结合起来：左侧保留上下文和任务入口，右侧承载当前对话、检索结果、操作卡片或生成内容，让用户既能自然提问，也能看到系统正在完成什么。',
};

const normalizeConversationTitle = (title: string) => title.replace(/^\[当前对话\]\s*/, '');

type ConversationGroupTitle = '今天' | '昨天';

interface ConversationItem {
  id: string;
  title: string;
  groupTitle: ConversationGroupTitle;
  messages: Message[];
}

const conversationGroupOrder: ConversationGroupTitle[] = ['今天', '昨天'];

const createSampleMessages = (title: string): Message[] => [
  createMessage('user', normalizeConversationTitle(title)),
  createMessage('assistant', sampleConversationReplies[title] ?? '这是一个示例历史对话，你可以继续在下方输入框里追问。'),
];

const createInitialConversations = (): ConversationItem[] => [
  {
    id: DEFAULT_CONVERSATION_ID,
    title: DEFAULT_CONVERSATION_TITLE,
    groupTitle: '今天',
    messages: [],
  },
  {
    id: 'conversation-install',
    title: '如何快速安装和导入组件?',
    groupTitle: '今天',
    messages: createSampleMessages('如何快速安装和导入组件?'),
  },
  {
    id: 'conversation-agi-interface',
    title: '新的 AGI 混合界面',
    groupTitle: '昨天',
    messages: createSampleMessages('新的 AGI 混合界面'),
  },
];

const createConversationTitleFromMessage = (content: string) => {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (!compactContent) {
    return '新对话';
  }

  return compactContent.length > 24 ? `${compactContent.slice(0, 24)}...` : compactContent;
};

const createNewConversationTitle = (conversations: ConversationItem[]) => {
  const newConversationCount = conversations.filter((conversation) => /^新对话(?: \d+)?$/.test(conversation.title)).length;
  return newConversationCount === 0 ? '新对话' : `新对话 ${newConversationCount + 1}`;
};

const groupConversations = (conversations: ConversationItem[]) =>
  conversationGroupOrder
    .map((groupTitle) => ({
      title: groupTitle,
      items: conversations
        .filter((conversation) => conversation.groupTitle === groupTitle)
        .map(({ id, title }) => ({ id, title })),
    }))
    .filter((group) => group.items.length > 0);

const App = () => {
  const [chatState, setChatState] = useState<ChatState>(initialState);
  const [inputValue, setInputValue] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>(createInitialConversations);
  const [activeConversationId, setActiveConversationId] = useState(DEFAULT_CONVERSATION_ID);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [ragNotices, setRagNotices] = useState<RagNotice[]>([]);
  const [ragProgressEvents, setRagProgressEvents] = useState<RagProgressEvent[]>([]);
  const [hasAnswerStarted, setHasAnswerStarted] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const generationIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const typewriterQueueRef = useRef('');
  const typewriterTimerRef = useRef<number | null>(null);
  const typewriterMessageIdRef = useRef<string | null>(null);
  const typewriterIdleResolversRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatState.messages, chatState.isGenerating]);

  useLayoutEffect(() => {
    const footer = footerRef.current;

    if (!footer) {
      return;
    }

    const updateFooterHeight = () => {
      setFooterHeight(Math.ceil(footer.getBoundingClientRect().height));
    };

    updateFooterHeight();

    const resizeObserver = new ResizeObserver(updateFooterHeight);
    resizeObserver.observe(footer);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current !== null) {
        window.clearInterval(typewriterTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const resolveTypewriterIdle = () => {
    if (typewriterQueueRef.current || typewriterTimerRef.current !== null) {
      return;
    }

    const resolvers = typewriterIdleResolversRef.current.splice(0);
    resolvers.forEach((resolve) => resolve());
  };

  const appendAssistantContent = (conversationId: string, messageId: string, content: string) => {
    setChatState((previousState) => ({
      ...previousState,
      messages: previousState.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: `${message.content}${content}`,
            }
          : message,
      ),
    }));
    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: conversation.messages.map((message) =>
                message.id === messageId
                  ? {
                      ...message,
                      content: `${message.content}${content}`,
                    }
                  : message,
              ),
            }
          : conversation,
      ),
    );
  };

  const stopTypewriter = () => {
    if (typewriterTimerRef.current !== null) {
      window.clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    typewriterQueueRef.current = '';
    typewriterMessageIdRef.current = null;
    resolveTypewriterIdle();
  };

  const startTypewriter = (conversationId: string, messageId: string, generationId: number) => {
    if (typewriterTimerRef.current !== null) {
      return;
    }

    const tick = () => {
      if (generationIdRef.current !== generationId || typewriterMessageIdRef.current !== messageId) {
        stopTypewriter();
        return;
      }

      const nextContent = typewriterQueueRef.current.slice(0, TYPEWRITER_CHARS_PER_TICK);
      typewriterQueueRef.current = typewriterQueueRef.current.slice(TYPEWRITER_CHARS_PER_TICK);

      if (nextContent) {
        appendAssistantContent(conversationId, messageId, nextContent);
      }

      if (!typewriterQueueRef.current && typewriterTimerRef.current !== null) {
        window.clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
        resolveTypewriterIdle();
      }
    };

    tick();
    typewriterTimerRef.current = window.setInterval(tick, TYPEWRITER_INTERVAL_MS);
  };

  const enqueueTypewriterContent = (conversationId: string, messageId: string, generationId: number, content: string) => {
    if (!content || generationIdRef.current !== generationId) {
      return;
    }

    typewriterMessageIdRef.current = messageId;
    typewriterQueueRef.current += content;
    startTypewriter(conversationId, messageId, generationId);
  };

  const waitForTypewriterIdle = () => {
    if (!typewriterQueueRef.current && typewriterTimerRef.current === null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      typewriterIdleResolversRef.current.push(resolve);
    });
  };

  const sendMessage = async (rawMessage: string) => {
    const content = rawMessage.trim();

    if (!content || chatState.isGenerating) {
      return;
    }

    const conversationIdForRequest = activeConversationId;
    const currentGenerationId = generationIdRef.current + 1;
    generationIdRef.current = currentGenerationId;
    abortControllerRef.current?.abort();
    stopTypewriter();
    setActiveConversationId(conversationIdForRequest);

    const userMessage = createMessage('user', content);
    const assistantMessage = createMessage('assistant', '');
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setInputValue('');
    setRagNotices([]);
    setRagProgressEvents([]);
    setHasAnswerStarted(false);
    setChatState((previousState) => ({
      messages: [...previousState.messages, userMessage, assistantMessage],
      isGenerating: true,
    }));
    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === conversationIdForRequest
          ? {
              ...conversation,
              title:
                conversation.messages.length === 0 ? createConversationTitleFromMessage(content) : conversation.title,
              groupTitle: '今天',
              messages: [...conversation.messages, userMessage, assistantMessage],
            }
          : conversation,
      ),
    );

    try {
      const finalAnswer = await askRag({
        question: content,
        signal: abortController.signal,
        onDelta: (delta) => {
          setHasAnswerStarted(true);
          enqueueTypewriterContent(conversationIdForRequest, assistantMessage.id, currentGenerationId, delta);
        },
        onNotice: (notice) => {
          setRagNotices((previousNotices) => [...previousNotices, notice].slice(-5));
        },
        onProgress: (event) => {
          setRagProgressEvents((previousEvents) => [...previousEvents, event].slice(-24));
        },
      });

      if (generationIdRef.current !== currentGenerationId) {
        return;
      }

      await waitForTypewriterIdle();

      if (generationIdRef.current !== currentGenerationId) {
        return;
      }

      setChatState((previousState) => ({
        messages: previousState.messages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: message.content || finalAnswer || '后端没有返回可展示的回答内容。',
              }
            : message,
        ),
        isGenerating: false,
      }));
      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === conversationIdForRequest
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === assistantMessage.id
                    ? {
                        ...message,
                        content: message.content || finalAnswer || '后端没有返回可展示的回答内容。',
                      }
                    : message,
                ),
              }
            : conversation,
        ),
      );
    } catch (error) {
      if (generationIdRef.current !== currentGenerationId) {
        return;
      }

      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? ''
          : error instanceof Error
            ? error.message
            : '未知错误';

      setHasAnswerStarted(true);
      setChatState((previousState) => ({
        messages: previousState.messages.map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content:
                  message.content ||
                  `抱歉，刚才请求 RAG 服务时出现了问题。${errorMessage ? `\n\n错误信息：${errorMessage}` : ''}`,
              }
            : message,
        ),
        isGenerating: false,
      }));
      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation.id === conversationIdForRequest
            ? {
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === assistantMessage.id
                    ? {
                        ...message,
                        content:
                          message.content ||
                          `抱歉，刚才请求 RAG 服务时出现了问题。${errorMessage ? `\n\n错误信息：${errorMessage}` : ''}`,
                      }
                    : message,
                ),
              }
            : conversation,
        ),
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const createNewConversation = () => {
    generationIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopTypewriter();
    const newConversationId = crypto.randomUUID();

    setInputValue('');
    setRagNotices([]);
    setRagProgressEvents([]);
    setHasAnswerStarted(false);
    setActiveConversationId(newConversationId);
    setConversations((previousConversations) => [
      {
        id: newConversationId,
        title: createNewConversationTitle(previousConversations),
        groupTitle: '今天',
        messages: [],
      },
      ...previousConversations,
    ]);
    setChatState(initialState);
  };

  const selectConversation = (conversationId: string) => {
    const selectedConversation = conversations.find((conversation) => conversation.id === conversationId);

    if (!selectedConversation) {
      return;
    }

    generationIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopTypewriter();
    setInputValue('');
    setRagNotices([]);
    setRagProgressEvents([]);
    setHasAnswerStarted(false);
    setActiveConversationId(conversationId);
    setChatState({
      messages: selectedConversation.messages,
      isGenerating: false,
    });
  };

  const hasMessages = chatState.messages.length > 0;
  const hasAssistantContent = chatState.messages.some(
    (message) => message.role === 'assistant' && message.content.trim().length > 0,
  );
  const shouldShowThinking = chatState.isGenerating && !hasAnswerStarted;
  const conversationGroups = groupConversations(conversations);
  const sidebarGridClass = isSidebarCollapsed
    ? 'lg:grid-cols-[88px_minmax(0,1fr)]'
    : 'lg:grid-cols-[304px_minmax(0,1fr)]';
  const bottomSpacerHeight = footerHeight + MESSAGE_FOOTER_GAP_PX;

  return (
    <div className="h-dvh overflow-hidden bg-[#f5f8fc] p-2 text-slate-950">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_64px_rgba(15,23,42,0.08)]">
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-6">
          <span className="h-4 w-4 rounded-full bg-red-500" />
          <span className="h-4 w-4 rounded-full bg-lime-500" />
          <span className="h-4 w-4 rounded-full bg-amber-400" />
          <div className="ml-5 h-6 flex-1 rounded-lg bg-white/70 shadow-inner" />
        </div>

        <main
          className={`grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-out ${sidebarGridClass}`}
        >
          <ConversationSidebar
            activeConversationId={activeConversationId}
            conversationGroups={conversationGroups}
            isCollapsed={isSidebarCollapsed}
            onNewConversation={createNewConversation}
            onSelectConversation={selectConversation}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          />

          <section className="relative flex min-h-0 min-w-0 flex-col bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {hasMessages || chatState.isGenerating ? (
                <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-5 px-5 py-7 sm:px-9 xl:px-12">
                  {chatState.messages.map((message, index) =>
                    message.role === 'assistant' && !message.content ? null : (
                      <ChatMessage
                        key={message.id}
                        isStreaming={
                          chatState.isGenerating &&
                          message.role === 'assistant' &&
                          index === chatState.messages.length - 1
                        }
                        message={message}
                      />
                    ),
                  )}
                  {shouldShowThinking && <AgentThoughtProcess notices={ragNotices} progressEvents={ragProgressEvents} />}
                  {chatState.isGenerating && !hasAnswerStarted && !hasAssistantContent && <TypingIndicator />}
                  <div ref={bottomRef} className="shrink-0" style={{ height: bottomSpacerHeight }} />
                </div>
              ) : (
                <EmptyState onSelectPrompt={sendMessage} />
              )}
            </div>

            <footer
              ref={footerRef}
              className="absolute inset-x-0 bottom-0 bg-white/96 px-5 pb-5 pt-3 backdrop-blur sm:px-9 xl:px-12"
            >
              <div className="mx-auto max-w-4xl space-y-4">
                <AnimatePresence initial={false}>
                  {shouldShowThinking && <AgentTypingStatus />}
                </AnimatePresence>
                <QuickActions onSelectPrompt={sendMessage} />
                <ChatInput
                  value={inputValue}
                  isGenerating={chatState.isGenerating}
                  onChange={setInputValue}
                  onSubmit={sendMessage}
                />
              </div>
            </footer>
          </section>
        </main>
      </section>
    </div>
  );
};

export default App;
