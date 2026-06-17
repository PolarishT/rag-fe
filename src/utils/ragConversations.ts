import type { RagConversationMessage, RagConversationSummary } from '../services/ragApi';
import type { Message } from '../types/chat';
import type { ConversationGroup, ConversationGroupTitle, ConversationItem } from '../types/ragConversation';

export const DRAFT_CONVERSATION_PREFIX = 'draft-conversation-';
export const DEFAULT_CONVERSATION_KEY = `${DRAFT_CONVERSATION_PREFIX}current`;
export const DEFAULT_CONVERSATION_TITLE = '新对话';
export const CONVERSATION_PAGE_SIZE = 50;

const conversationGroupOrder: ConversationGroupTitle[] = ['今天', '昨天', '更早'];

export const createInitialConversations = (): ConversationItem[] => [
  {
    key: DEFAULT_CONVERSATION_KEY,
    label: DEFAULT_CONVERSATION_TITLE,
    groupTitle: '今天',
    messages: [],
  },
];

export const createConversationTitleFromMessage = (content: string) => {
  const compactContent = content.replace(/\s+/g, ' ').trim();

  if (!compactContent) {
    return DEFAULT_CONVERSATION_TITLE;
  }

  return compactContent.length > 24 ? `${compactContent.slice(0, 24)}...` : compactContent;
};

export const createNewConversationTitle = (conversations: ConversationItem[]) => {
  const newConversationCount = conversations.filter((conversation) => /^新对话(?: \d+)?$/.test(conversation.label)).length;
  return newConversationCount === 0 ? DEFAULT_CONVERSATION_TITLE : `新对话 ${newConversationCount + 1}`;
};

export const createBlankConversation = (conversationKey: string, label: string): ConversationItem => ({
  key: conversationKey,
  label,
  groupTitle: '今天',
  messages: [],
});

export const createDraftConversation = (label: string) =>
  createBlankConversation(`${DRAFT_CONVERSATION_PREFIX}${crypto.randomUUID()}`, label);

export const isDraftConversationKey = (conversationKey: string) => conversationKey.startsWith(DRAFT_CONVERSATION_PREFIX);

export const isUntouchedDefaultDraftConversation = (conversation: ConversationItem) =>
  conversation.key === DEFAULT_CONVERSATION_KEY &&
  conversation.label === DEFAULT_CONVERSATION_TITLE &&
  conversation.messages.length === 0;

export const mergeServerConversationsWithLocalDrafts = ({
  excludedDraftKey,
  localConversations,
  remoteConversations,
}: {
  excludedDraftKey?: string;
  localConversations: ConversationItem[];
  remoteConversations: ConversationItem[];
}) => {
  const localConversationByKey = new Map(localConversations.map((conversation) => [conversation.key, conversation]));
  const remoteConversationKeys = new Set(remoteConversations.map((conversation) => conversation.key));
  const localDraftConversations = localConversations.filter(
    (conversation) =>
      isDraftConversationKey(conversation.key) &&
      conversation.key !== excludedDraftKey &&
      !remoteConversationKeys.has(conversation.key) &&
      !isUntouchedDefaultDraftConversation(conversation),
  );
  const mergedRemoteConversations = remoteConversations.map((conversation) => {
    const localConversation = localConversationByKey.get(conversation.key);

    return localConversation
      ? {
          ...conversation,
          messages: localConversation.messages,
        }
      : conversation;
  });

  return [...localDraftConversations, ...mergedRemoteConversations];
};

export const getConversationGroupTitle = (timestamp?: string): ConversationGroupTitle => {
  if (!timestamp) {
    return '今天';
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return '今天';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDelta = Math.round((today - messageDay) / 86400000);

  if (dayDelta <= 0) {
    return '今天';
  }

  if (dayDelta === 1) {
    return '昨天';
  }

  return '更早';
};

export const createConversationFromSummary = (summary: RagConversationSummary): ConversationItem => ({
  key: summary.id,
  label: summary.title,
  groupTitle: getConversationGroupTitle(summary.updatedAt ?? summary.createdAt),
  messages: [],
});

export const createMessagesFromRemote = (messages: RagConversationMessage[]): Message[] =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));

export const groupConversations = (conversations: ConversationItem[]): ConversationGroup[] =>
  conversationGroupOrder
    .map((groupTitle) => ({
      title: groupTitle,
      items: conversations
        .filter((conversation) => conversation.groupTitle === groupTitle)
        .map(({ key, label }) => ({ id: key, title: label })),
    }))
    .filter((group) => group.items.length > 0);
