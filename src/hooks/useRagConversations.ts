import { useCallback, useEffect, useRef, useState } from 'react';
import { useXConversations } from '@ant-design/x-sdk';
import { deleteRagConversation, getRagConversationMessages, listRagConversations } from '../services/ragApi';
import type { Message } from '../types/chat';
import type { ConversationItem } from '../types/ragConversation';
import {
  CONVERSATION_PAGE_SIZE,
  DEFAULT_CONVERSATION_KEY,
  DEFAULT_CONVERSATION_TITLE,
  createConversationFromSummary,
  createDraftConversation,
  createInitialConversations,
  createMessagesFromRemote,
  createNewConversationTitle,
  groupConversations,
  isDraftConversationKey,
  isUntouchedDefaultDraftConversation,
  mergeServerConversationsWithLocalDrafts,
} from '../utils/ragConversations';

interface SyncConversationsOptions {
  preferredConversationId?: string;
  replacedDraftConversationKey?: string;
  signal?: AbortSignal;
  shouldActivate?: boolean;
}

const mergeRefreshedServerConversationsWithExisting = ({
  excludedDraftKey,
  localConversations,
  remoteConversations,
}: {
  excludedDraftKey?: string;
  localConversations: ConversationItem[];
  remoteConversations: ConversationItem[];
}) => {
  const mergedFirstPageConversations = mergeServerConversationsWithLocalDrafts({
    excludedDraftKey,
    localConversations,
    remoteConversations,
  });
  const mergedConversationKeys = new Set(mergedFirstPageConversations.map((conversation) => conversation.key));
  const preservedRemoteConversations = localConversations.filter(
    (conversation) => !isDraftConversationKey(conversation.key) && !mergedConversationKeys.has(conversation.key),
  );

  return [...mergedFirstPageConversations, ...preservedRemoteConversations];
};

const appendServerConversations = ({
  localConversations,
  remoteConversations,
}: {
  localConversations: ConversationItem[];
  remoteConversations: ConversationItem[];
}) => {
  const remoteConversationByKey = new Map(remoteConversations.map((conversation) => [conversation.key, conversation]));
  const localConversationKeys = new Set(localConversations.map((conversation) => conversation.key));
  const updatedLocalConversations = localConversations.map((conversation) => {
    const remoteConversation = remoteConversationByKey.get(conversation.key);

    return remoteConversation
      ? {
          ...remoteConversation,
          messages: conversation.messages,
        }
      : conversation;
  });
  const newRemoteConversations = remoteConversations.filter((conversation) => !localConversationKeys.has(conversation.key));

  return [...updatedLocalConversations, ...newRemoteConversations];
};

export const useRagConversations = () => {
  const initialConversationsRef = useRef<ConversationItem[] | null>(null);
  const conversationItemsRef = useRef<ConversationItem[]>([]);
  const activeConversationKeyRef = useRef(DEFAULT_CONVERSATION_KEY);
  const conversationSyncRequestIdRef = useRef(0);
  const conversationPaginationRequestIdRef = useRef(0);
  const conversationNextCursorRef = useRef<string | undefined>(undefined);
  const isLoadingMoreConversationsRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationSyncError, setConversationSyncError] = useState('');
  const [conversationNextCursor, setConversationNextCursorState] = useState<string | undefined>(undefined);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversationsState] = useState(false);

  if (initialConversationsRef.current === null) {
    initialConversationsRef.current = createInitialConversations();
  }

  const {
    activeConversationKey,
    addConversation,
    conversations,
    getConversation,
    removeConversation,
    setActiveConversationKey,
    setConversation,
    setConversations,
  } = useXConversations({
    defaultActiveConversationKey: DEFAULT_CONVERSATION_KEY,
    defaultConversations: initialConversationsRef.current,
  });

  const conversationItems = conversations as ConversationItem[];
  const activeConversationId = activeConversationKey || DEFAULT_CONVERSATION_KEY;
  conversationItemsRef.current = conversationItems;
  activeConversationKeyRef.current = activeConversationId;

  const getManagedConversation = useCallback(
    (conversationKey: string) => getConversation(conversationKey) as ConversationItem | undefined,
    [getConversation],
  );

  const syncActiveMessagesFromConversation = useCallback((conversation?: ConversationItem) => {
    if (conversation && activeConversationKeyRef.current === conversation.key) {
      setMessages(conversation.messages);
    }
  }, []);

  const updateConversationNextCursor = useCallback((nextCursor?: string) => {
    conversationNextCursorRef.current = nextCursor;
    setConversationNextCursorState(nextCursor);
  }, []);

  const updateIsLoadingMoreConversations = useCallback((isLoadingMore: boolean) => {
    isLoadingMoreConversationsRef.current = isLoadingMore;
    setIsLoadingMoreConversationsState(isLoadingMore);
  }, []);

  const setConversationItems = useCallback(
    (nextConversations: ConversationItem[]) => {
      conversationItemsRef.current = nextConversations;
      setConversations(nextConversations);
      syncActiveMessagesFromConversation(
        nextConversations.find((conversation) => conversation.key === activeConversationKeyRef.current),
      );
    },
    [setConversations, syncActiveMessagesFromConversation],
  );

  const setConversationItem = useCallback(
    (conversationKey: string, conversation: ConversationItem) => {
      const didSetConversation = setConversation(conversationKey, conversation);

      if (didSetConversation) {
        conversationItemsRef.current = conversationItemsRef.current.map((item) =>
          item.key === conversationKey ? conversation : item,
        );
        syncActiveMessagesFromConversation(conversation);
      }

      return didSetConversation;
    },
    [setConversation, syncActiveMessagesFromConversation],
  );

  const prependConversation = useCallback(
    (conversation: ConversationItem) => {
      const didAddConversation = addConversation(conversation, 'prepend');

      if (didAddConversation) {
        conversationItemsRef.current = [
          conversation,
          ...conversationItemsRef.current.filter((item) => item.key !== conversation.key),
        ];
        syncActiveMessagesFromConversation(conversation);
      }

      return didAddConversation;
    },
    [addConversation, syncActiveMessagesFromConversation],
  );

  const updateConversation = useCallback(
    (conversationKey: string, updater: (conversation: ConversationItem) => ConversationItem) => {
      const conversation =
        getManagedConversation(conversationKey) ??
        conversationItemsRef.current.find((conversationItem) => conversationItem.key === conversationKey);

      if (!conversation) {
        return false;
      }

      const nextConversation = updater(conversation);
      const didSetConversation = setConversationItem(conversationKey, nextConversation);

      if (!didSetConversation) {
        setConversationItems(
          conversationItemsRef.current.map((conversationItem) =>
            conversationItem.key === conversationKey ? nextConversation : conversationItem,
          ),
        );
      }

      return true;
    },
    [getManagedConversation, setConversationItem, setConversationItems],
  );

  const activateConversation = useCallback(
    (conversation: ConversationItem) => {
      activeConversationKeyRef.current = conversation.key;
      setActiveConversationKey(conversation.key);
      setMessages(conversation.messages);
    },
    [setActiveConversationKey],
  );

  const createFallbackConversation = useCallback(
    (fallbackLabel = DEFAULT_CONVERSATION_TITLE) => {
      const fallbackConversation = createDraftConversation(fallbackLabel);
      prependConversation(fallbackConversation);
      activateConversation(fallbackConversation);
      return fallbackConversation;
    },
    [activateConversation, prependConversation],
  );

  const ensureActiveConversation = useCallback(() => {
    const activeConversation = getManagedConversation(activeConversationKeyRef.current);

    if (activeConversation) {
      return activeConversation;
    }

    return createFallbackConversation(createNewConversationTitle(conversationItemsRef.current));
  }, [createFallbackConversation, getManagedConversation]);

  const updateConversationMessages = useCallback(
    (conversationKey: string, updater: (messages: Message[], conversation: ConversationItem) => Message[]) => {
      updateConversation(conversationKey, (conversation) => ({
        ...conversation,
        messages: updater(conversation.messages, conversation),
      }));
    },
    [updateConversation],
  );

  const replaceConversationMessages = useCallback(
    (conversationKey: string, nextMessages: Message[]) => {
      updateConversation(conversationKey, (conversation) => ({
        ...conversation,
        messages: nextMessages,
      }));
    },
    [updateConversation],
  );

  const appendConversationMessageContent = useCallback(
    (conversationKey: string, messageId: string, content: string) => {
      updateConversationMessages(conversationKey, (conversationMessages) =>
        conversationMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: `${message.content}${content}`,
              }
            : message,
        ),
      );
    },
    [updateConversationMessages],
  );

  const loadConversationMessages = useCallback(
    async (conversationId: string, signal?: AbortSignal) => {
      const result = await getRagConversationMessages({
        conversationId,
        signal,
      });
      const remoteMessages = createMessagesFromRemote(result.messages);

      replaceConversationMessages(conversationId, remoteMessages);

      return remoteMessages;
    },
    [replaceConversationMessages],
  );

  const syncConversationsFromServer = useCallback(
    async ({
      preferredConversationId,
      replacedDraftConversationKey,
      signal,
      shouldActivate = false,
    }: SyncConversationsOptions = {}) => {
      const syncRequestId = conversationSyncRequestIdRef.current + 1;
      const activeConversationKeyAtSyncStart = activeConversationKeyRef.current;
      conversationSyncRequestIdRef.current = syncRequestId;
      conversationPaginationRequestIdRef.current += 1;
      const canApplySyncResult = () => !signal?.aborted && conversationSyncRequestIdRef.current === syncRequestId;

      setIsLoadingConversations(true);
      updateIsLoadingMoreConversations(false);
      setConversationSyncError('');

      try {
        const result = await listRagConversations({
          limit: CONVERSATION_PAGE_SIZE,
          signal,
        });

        if (!canApplySyncResult()) {
          return;
        }

        updateConversationNextCursor(result.nextCursor);

        const remoteConversations = result.conversations.map(createConversationFromSummary);
        const localConversations = conversationItemsRef.current;
        const latestActiveConversationKey = activeConversationKeyRef.current;
        const activeConversationChangedDuringSync = latestActiveConversationKey !== activeConversationKeyAtSyncStart;

        if (remoteConversations.length === 0) {
          const mergedConversations = mergeServerConversationsWithLocalDrafts({
            excludedDraftKey: preferredConversationId ? replacedDraftConversationKey : undefined,
            localConversations,
            remoteConversations,
          });
          const fallbackConversation = createDraftConversation(DEFAULT_CONVERSATION_TITLE);
          const nextConversations = mergedConversations.length > 0 ? mergedConversations : [fallbackConversation];
          const nextActiveConversation =
            nextConversations.find((conversation) => conversation.key === latestActiveConversationKey) ??
            nextConversations[0];

          setConversationItems(nextConversations);

          if (nextActiveConversation.key !== latestActiveConversationKey) {
            activateConversation(nextActiveConversation);
          }

          return;
        }

        const canAutoActivateRemoteConversation =
          shouldActivate && (!activeConversationChangedDuringSync || Boolean(preferredConversationId));
        const activeRemoteConversation =
          remoteConversations.find((conversation) => conversation.key === preferredConversationId) ??
          remoteConversations.find((conversation) => conversation.key === latestActiveConversationKey) ??
          (canAutoActivateRemoteConversation ? remoteConversations[0] : undefined);
        const mergedConversations = mergeRefreshedServerConversationsWithExisting({
          excludedDraftKey: preferredConversationId ? replacedDraftConversationKey : undefined,
          localConversations,
          remoteConversations,
        });

        setConversationItems(mergedConversations);

        if (!activeRemoteConversation) {
          return;
        }

        activeConversationKeyRef.current = activeRemoteConversation.key;
        setActiveConversationKey(activeRemoteConversation.key);
        const hydratedMessages = await loadConversationMessages(activeRemoteConversation.key, signal);

        if (!canApplySyncResult()) {
          return;
        }

        replaceConversationMessages(activeRemoteConversation.key, hydratedMessages);
      } catch (error) {
        if (!canApplySyncResult()) {
          return;
        }

        const errorMessage = error instanceof Error ? error.message : '未知错误';
        setConversationSyncError(errorMessage);
        updateConversationNextCursor(undefined);
        const localDraftConversations = conversationItemsRef.current.filter(
          (conversation) => isDraftConversationKey(conversation.key) && !isUntouchedDefaultDraftConversation(conversation),
        );
        const fallbackConversation = localDraftConversations[0] ?? createDraftConversation(DEFAULT_CONVERSATION_TITLE);
        const nextConversations = localDraftConversations.length > 0 ? localDraftConversations : [fallbackConversation];
        const nextActiveConversation =
          nextConversations.find((conversation) => conversation.key === activeConversationKeyRef.current) ??
          nextConversations[0];

        setConversationItems(nextConversations);
        activateConversation(nextActiveConversation);
      } finally {
        if (canApplySyncResult()) {
          setIsLoadingConversations(false);
        }
      }
    },
    [
      activateConversation,
      loadConversationMessages,
      replaceConversationMessages,
      setActiveConversationKey,
      setConversationItems,
      updateConversationNextCursor,
      updateIsLoadingMoreConversations,
    ],
  );

  useEffect(() => {
    const abortController = new AbortController();

    void syncConversationsFromServer({
      signal: abortController.signal,
      shouldActivate: true,
    });

    return () => {
      abortController.abort();
    };
  }, [syncConversationsFromServer]);

  const createNewConversation = useCallback(() => {
    const newConversation = createDraftConversation(createNewConversationTitle(conversationItemsRef.current));
    prependConversation(newConversation);
    activateConversation(newConversation);
  }, [activateConversation, prependConversation]);

  const loadMoreConversations = useCallback(async () => {
    const cursor = conversationNextCursorRef.current;

    if (!cursor || isLoadingConversations || isLoadingMoreConversationsRef.current) {
      return;
    }

    const paginationRequestId = conversationPaginationRequestIdRef.current + 1;
    conversationPaginationRequestIdRef.current = paginationRequestId;
    const canApplyPaginationResult = () => conversationPaginationRequestIdRef.current === paginationRequestId;

    updateIsLoadingMoreConversations(true);
    setConversationSyncError('');

    try {
      const result = await listRagConversations({
        cursor,
        limit: CONVERSATION_PAGE_SIZE,
      });

      if (!canApplyPaginationResult()) {
        return;
      }

      const remoteConversations = result.conversations.map(createConversationFromSummary);
      const nextConversations = appendServerConversations({
        localConversations: conversationItemsRef.current,
        remoteConversations,
      });

      setConversationItems(nextConversations);
      updateConversationNextCursor(result.nextCursor);
    } catch (error) {
      if (!canApplyPaginationResult()) {
        return;
      }

      setConversationSyncError(error instanceof Error ? error.message : '会话加载失败');
    } finally {
      if (canApplyPaginationResult()) {
        updateIsLoadingMoreConversations(false);
      }
    }
  }, [
    isLoadingConversations,
    setConversationItems,
    updateConversationNextCursor,
    updateIsLoadingMoreConversations,
  ]);

  const selectConversation = useCallback(
    async (conversationId: string) => {
      const selectedConversation = getManagedConversation(conversationId);

      if (!selectedConversation) {
        return;
      }

      activateConversation(selectedConversation);

      if (isDraftConversationKey(conversationId)) {
        return;
      }

      try {
        await loadConversationMessages(conversationId);

        if (activeConversationKeyRef.current === conversationId) {
          setConversationSyncError('');
        }
      } catch (error) {
        if (activeConversationKeyRef.current === conversationId) {
          setConversationSyncError(error instanceof Error ? error.message : '会话消息加载失败');
        }
      }
    },
    [activateConversation, getManagedConversation, loadConversationMessages],
  );

  const removeLocalConversation = useCallback(
    (conversationId: string) => {
      const remainingConversations = conversationItemsRef.current.filter((conversation) => conversation.key !== conversationId);
      const isDeletingActiveConversation = conversationId === activeConversationKeyRef.current;

      if (!removeConversation(conversationId)) {
        return false;
      }

      conversationItemsRef.current = remainingConversations;

      if (!isDeletingActiveConversation) {
        return true;
      }

      const nextConversation = remainingConversations[0] ?? createDraftConversation(createNewConversationTitle([]));

      if (remainingConversations.length === 0) {
        prependConversation(nextConversation);
      }

      activateConversation(nextConversation);

      return true;
    },
    [activateConversation, prependConversation, removeConversation],
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (isDraftConversationKey(conversationId)) {
        removeLocalConversation(conversationId);
        return;
      }

      setConversationSyncError('');

      try {
        await deleteRagConversation({ conversationId });
        removeLocalConversation(conversationId);
      } catch (error) {
        setConversationSyncError(error instanceof Error ? error.message : '会话删除失败');
      }
    },
    [removeLocalConversation],
  );

  return {
    activeConversationId,
    appendConversationMessageContent,
    conversationGroups: groupConversations(conversationItems),
    conversationSyncError,
    createNewConversation,
    deleteConversation,
    ensureActiveConversation,
    hasMoreConversations: Boolean(conversationNextCursor),
    isLoadingConversations,
    isLoadingMoreConversations,
    loadMoreConversations,
    messages,
    replaceConversationMessages,
    selectConversation,
    setConversationSyncError,
    syncConversationsFromServer,
    updateConversation,
    updateConversationMessages,
  };
};

export type RagConversationController = ReturnType<typeof useRagConversations>;
