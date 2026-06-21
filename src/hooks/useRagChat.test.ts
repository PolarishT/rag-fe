import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemo, useRef, useState } from 'react';
import { askRag, updateRagConversation } from '../services/ragApi';
import type { Message } from '../types/chat';
import type { ConversationItem } from '../types/ragConversation';
import { DEFAULT_CONVERSATION_KEY, DEFAULT_CONVERSATION_TITLE } from '../utils/ragConversations';
import type { RagConversationController } from './useRagConversations';
import { useRagChat } from './useRagChat';

vi.mock('../services/ragApi', () => ({
  askRag: vi.fn(),
  updateRagConversation: vi.fn(),
}));

type AskRagOptions = Parameters<typeof askRag>[0];
const USER_ID = 'user@example.com';

const createHarnessConversation = (): ConversationItem => ({
  key: DEFAULT_CONVERSATION_KEY,
  label: DEFAULT_CONVERSATION_TITLE,
  groupTitle: '今天',
  messages: [],
});

const useChatHarness = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const conversationRef = useRef(createHarnessConversation());
  const syncConversationsFromServerRef = useRef(vi.fn());
  const setConversationSyncErrorRef = useRef(vi.fn());
  messagesRef.current = messages;

  const conversations = useMemo(
    () =>
      ({
        activeConversationId: conversationRef.current.key,
        appendConversationMessageContent: (_conversationId: string, messageId: string, content: string) => {
          setMessages((previousMessages) => {
            const nextMessages = previousMessages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    content: `${message.content}${content}`,
                  }
                : message,
            );
            conversationRef.current = {
              ...conversationRef.current,
              messages: nextMessages,
            };
            return nextMessages;
          });
        },
        conversationGroups: [],
        conversationSyncError: '',
        createNewConversation: vi.fn(),
        deleteConversation: vi.fn(),
        ensureActiveConversation: () => ({
          ...conversationRef.current,
          messages: messagesRef.current,
        }),
        hasMoreConversations: false,
        isLoadingConversations: false,
        isLoadingMoreConversations: false,
        loadMoreConversations: vi.fn(),
        messages,
        replaceConversationMessages: (_conversationId: string, nextMessages: Message[]) => {
          conversationRef.current = {
            ...conversationRef.current,
            messages: nextMessages,
          };
          setMessages(nextMessages);
        },
        selectConversation: vi.fn(),
        setConversationSyncError: setConversationSyncErrorRef.current,
        syncConversationsFromServer: syncConversationsFromServerRef.current,
        updateConversation: (_conversationId: string, updater: (conversation: ConversationItem) => ConversationItem) => {
          const nextConversation = updater({
            ...conversationRef.current,
            messages: messagesRef.current,
          });
          conversationRef.current = nextConversation;
          setMessages(nextConversation.messages);
          return true;
        },
        updateConversationMessages: (
          _conversationId: string,
          updater: (conversationMessages: Message[], conversation: ConversationItem) => Message[],
        ) => {
          const nextMessages = updater(messagesRef.current, {
            ...conversationRef.current,
            messages: messagesRef.current,
          });
          conversationRef.current = {
            ...conversationRef.current,
            messages: nextMessages,
          };
          setMessages(nextMessages);
        },
      }) as RagConversationController,
    [messages],
  );

  const chat = useRagChat({ conversations, userId: USER_ID });

  return {
    ...chat,
    setConversationSyncError: setConversationSyncErrorRef.current,
    syncConversationsFromServer: syncConversationsFromServerRef.current,
  };
};

describe('useRagChat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(askRag).mockReset();
    vi.mocked(updateRagConversation).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds user and assistant messages, streams deltas through the typewriter, and syncs server conversations', async () => {
    let capturedOptions: AskRagOptions | undefined;
    let resolveAsk: (answer: string) => void = () => {};
    vi.mocked(askRag).mockImplementationOnce((options) => {
      capturedOptions = options;
      return new Promise((resolve) => {
        resolveAsk = resolve;
      });
    });

    const { result } = renderHook(() => useChatHarness());
    let sendPromise: Promise<void> = Promise.resolve();

    act(() => {
      sendPromise = result.current.sendMessage('  What is RAG?  ');
    });

    expect(result.current.chatState.messages).toHaveLength(2);
    expect(result.current.chatState.messages[0]).toMatchObject({
      role: 'user',
      content: 'What is RAG?',
    });
    expect(result.current.chatState.messages[1]).toMatchObject({
      role: 'assistant',
      content: '',
    });
    expect(capturedOptions?.userId).toBe(USER_ID);

    act(() => {
      capturedOptions?.onProgress?.({
        event: 'completed',
        data: { conversationId: 'conversation-server-1' },
        rawData: '{}',
        receivedAt: '2026-06-17T00:00:00.000Z',
      });
      capturedOptions?.onDelta?.('Streaming answer');
      vi.runAllTimers();
    });

    await act(async () => {
      resolveAsk('Streaming answer');
      await sendPromise;
    });

    expect(result.current.chatState.isGenerating).toBe(false);
    expect(result.current.chatState.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Streaming answer',
    });
    expect(result.current.syncConversationsFromServer).toHaveBeenCalledWith({
      preferredConversationId: 'conversation-server-1',
      replacedDraftConversationKey: DEFAULT_CONVERSATION_KEY,
      shouldActivate: true,
    });
  });

  it('does not let stale generation callbacks update state after cancellation', async () => {
    let capturedOptions: AskRagOptions | undefined;
    let resolveAsk: (answer: string) => void = () => {};
    vi.mocked(askRag).mockImplementationOnce((options) => {
      capturedOptions = options;
      return new Promise((resolve) => {
        resolveAsk = resolve;
      });
    });

    const { result } = renderHook(() => useChatHarness());
    let sendPromise: Promise<void> = Promise.resolve();

    act(() => {
      sendPromise = result.current.sendMessage('Will cancel');
    });

    expect(result.current.chatState.messages).toHaveLength(2);

    act(() => {
      result.current.cancelActiveGeneration();
      capturedOptions?.onDelta?.('late delta');
      capturedOptions?.onNotice?.({ message: 'late notice' });
      capturedOptions?.onProgress?.({
        event: 'completed',
        data: { conversationId: 'late-conversation' },
        rawData: '{}',
        receivedAt: '2026-06-17T00:00:00.000Z',
      });
      vi.runAllTimers();
    });

    await act(async () => {
      resolveAsk('late delta');
      await sendPromise;
    });

    expect(capturedOptions?.signal?.aborted).toBe(true);
    expect(result.current.chatState.isGenerating).toBe(false);
    expect(result.current.hasAnswerStarted).toBe(false);
    expect(result.current.ragNotices).toEqual([]);
    expect(result.current.ragProgressEvents).toEqual([]);
    expect(result.current.chatState.messages[1]).toMatchObject({
      role: 'assistant',
      content: '',
    });
  });
});
