import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { askRag, updateRagConversation } from '../services/ragApi';
import type { RagNotice, RagProgressEvent } from '../services/ragApi';
import type { ChatState } from '../types/chat';
import type { RagConversationController } from './useRagConversations';
import { useTypewriter } from './useTypewriter';
import { createMessage } from '../utils/chatMessages';
import { createConversationTitleFromMessage, isDraftConversationKey } from '../utils/ragConversations';

interface UseRagChatOptions {
  conversations: RagConversationController;
  userId: string;
}

const readConversationIdFromProgressData = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const conversationId = record.conversationId;

  return typeof conversationId === 'string' && conversationId ? conversationId : undefined;
};

export const useRagChat = ({ conversations, userId }: UseRagChatOptions) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [ragNotices, setRagNotices] = useState<RagNotice[]>([]);
  const [ragProgressEvents, setRagProgressEvents] = useState<RagProgressEvent[]>([]);
  const [hasAnswerStarted, setHasAnswerStarted] = useState(false);
  const generationIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeConversationIdRef = useRef(conversations.activeConversationId);
  const isGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  const resetTransientChatState = useCallback(() => {
    setInputValue('');
    setRagNotices([]);
    setRagProgressEvents([]);
    setHasAnswerStarted(false);
  }, []);

  const {
    enqueue: enqueueTypewriterContent,
    stop: stopTypewriter,
    waitForIdle: waitForTypewriterIdle,
  } = useTypewriter({
    appendContent: conversations.appendConversationMessageContent,
    getGenerationId: () => generationIdRef.current,
  });

  const cancelActiveGeneration = useCallback(() => {
    generationIdRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    stopTypewriter();
    setIsGenerating(false);
  }, [stopTypewriter]);

  useEffect(() => {
    if (activeConversationIdRef.current === conversations.activeConversationId) {
      return;
    }

    activeConversationIdRef.current = conversations.activeConversationId;
    cancelActiveGeneration();
    resetTransientChatState();
  }, [cancelActiveGeneration, conversations.activeConversationId, resetTransientChatState]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      stopTypewriter();
    },
    [stopTypewriter],
  );

  const updateAssistantMessage = useCallback(
    (conversationKey: string, assistantMessageId: string, content: string) => {
      conversations.updateConversationMessages(conversationKey, (messages) =>
        messages.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: message.content || content,
              }
            : message,
        ),
      );
    },
    [conversations],
  );

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const content = rawMessage.trim();

      if (!content || isGeneratingRef.current) {
        return;
      }

      const activeConversationForRequest = conversations.ensureActiveConversation();
      const conversationIdForRequest = activeConversationForRequest.key;
      const isDraftConversation = isDraftConversationKey(conversationIdForRequest);
      const currentGenerationId = generationIdRef.current + 1;
      let streamedConversationId: string | undefined;
      generationIdRef.current = currentGenerationId;
      abortControllerRef.current?.abort();
      stopTypewriter();

      const userMessage = createMessage('user', content);
      const assistantMessage = createMessage('assistant', '');
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      resetTransientChatState();
      setIsGenerating(true);

      const nextConversationTitle =
        activeConversationForRequest.messages.length === 0
          ? createConversationTitleFromMessage(content)
          : activeConversationForRequest.label;

      conversations.updateConversation(conversationIdForRequest, (conversation) => ({
        ...conversation,
        label: nextConversationTitle,
        groupTitle: '今天',
        messages: [...conversation.messages, userMessage, assistantMessage],
      }));

      if (!isDraftConversation && nextConversationTitle !== activeConversationForRequest.label) {
        void updateRagConversation({
          conversationId: conversationIdForRequest,
          title: nextConversationTitle,
          userId,
        }).catch((error) => {
          conversations.setConversationSyncError(error instanceof Error ? error.message : '会话标题同步失败');
        });
      }

      try {
        const finalAnswer = await askRag({
          conversationId: isDraftConversation ? undefined : conversationIdForRequest,
          question: content,
          signal: abortController.signal,
          userId,
          onDelta: (delta) => {
            if (generationIdRef.current !== currentGenerationId) {
              return;
            }

            setHasAnswerStarted(true);
            enqueueTypewriterContent({
              conversationId: conversationIdForRequest,
              generationId: currentGenerationId,
              messageId: assistantMessage.id,
              content: delta,
            });
          },
          onNotice: (notice) => {
            if (generationIdRef.current !== currentGenerationId) {
              return;
            }

            setRagNotices((previousNotices) => [...previousNotices, notice].slice(-5));
          },
          onProgress: (event) => {
            if (generationIdRef.current !== currentGenerationId) {
              return;
            }

            streamedConversationId = streamedConversationId ?? readConversationIdFromProgressData(event.data);
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

        const answerContent = finalAnswer || '后端没有返回可展示的回答内容。';
        setIsGenerating(false);
        updateAssistantMessage(conversationIdForRequest, assistantMessage.id, answerContent);

        void conversations.syncConversationsFromServer({
          preferredConversationId: streamedConversationId ?? (isDraftConversation ? undefined : conversationIdForRequest),
          replacedDraftConversationKey: isDraftConversation ? conversationIdForRequest : undefined,
          shouldActivate: isDraftConversation || Boolean(streamedConversationId),
        });
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
        const fallbackMessage = `抱歉，刚才请求 RAG 服务时出现了问题。${errorMessage ? `\n\n错误信息：${errorMessage}` : ''}`;

        setHasAnswerStarted(true);
        setIsGenerating(false);
        updateAssistantMessage(conversationIdForRequest, assistantMessage.id, fallbackMessage);
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [
      conversations,
      enqueueTypewriterContent,
      resetTransientChatState,
      stopTypewriter,
      updateAssistantMessage,
      userId,
      waitForTypewriterIdle,
    ],
  );

  const chatState = useMemo<ChatState>(
    () => ({
      messages: conversations.messages,
      isGenerating,
    }),
    [conversations.messages, isGenerating],
  );

  return {
    cancelActiveGeneration,
    chatState,
    hasAnswerStarted,
    inputValue,
    ragNotices,
    ragProgressEvents,
    sendMessage,
    setInputValue,
  };
};
