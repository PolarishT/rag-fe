import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRagConversationMessages, listRagConversations } from '../services/ragApi';
import { CONVERSATION_PAGE_SIZE, DRAFT_CONVERSATION_PREFIX } from '../utils/ragConversations';
import { useRagConversations } from './useRagConversations';

vi.mock('../services/ragApi', () => ({
  getRagConversationMessages: vi.fn(),
  listRagConversations: vi.fn(),
}));

const remoteConversation = {
  id: 'conversation-1',
  title: 'Remote conversation',
  createdAt: '2026-06-17T00:00:00.000Z',
  updatedAt: '2026-06-17T00:01:00.000Z',
};

const olderRemoteConversation = {
  id: 'conversation-2',
  title: 'Older remote conversation',
  createdAt: '2026-06-16T00:00:00.000Z',
  updatedAt: '2026-06-16T00:01:00.000Z',
};

describe('useRagConversations', () => {
  beforeEach(() => {
    vi.mocked(getRagConversationMessages).mockReset();
    vi.mocked(listRagConversations).mockReset();
  });

  it('loads server conversations and hydrates the active conversation messages', async () => {
    vi.mocked(listRagConversations).mockResolvedValueOnce({
      conversations: [remoteConversation],
    });
    vi.mocked(getRagConversationMessages).mockResolvedValueOnce({
      conversationId: 'conversation-1',
      messages: [
        {
          id: 'message-1',
          role: 'user',
          content: 'Hello',
          createdAt: '2026-06-17T00:00:00.000Z',
        },
      ],
    });

    const { result } = renderHook(() => useRagConversations());

    await waitFor(() => expect(result.current.activeConversationId).toBe('conversation-1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    expect(result.current.conversationGroups[0].items).toEqual([
      {
        id: 'conversation-1',
        title: 'Remote conversation',
      },
    ]);
    expect(result.current.messages[0]).toMatchObject({
      id: 'message-1',
      role: 'user',
      content: 'Hello',
    });
  });

  it('falls back to a local draft when initial server sync fails', async () => {
    vi.mocked(listRagConversations).mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useRagConversations());

    await waitFor(() => expect(result.current.conversationSyncError).toBe('network down'));

    expect(result.current.activeConversationId.startsWith(DRAFT_CONVERSATION_PREFIX)).toBe(true);
    expect(result.current.conversationGroups[0].items[0].title).toBe('新对话');
  });

  it('keeps non-empty local draft conversations when merging server conversations', async () => {
    vi.mocked(listRagConversations)
      .mockResolvedValueOnce({
        conversations: [],
      })
      .mockResolvedValueOnce({
        conversations: [remoteConversation],
      });
    vi.mocked(getRagConversationMessages).mockResolvedValueOnce({
      conversationId: 'conversation-1',
      messages: [],
    });

    const { result } = renderHook(() => useRagConversations());

    await waitFor(() => expect(result.current.isLoadingConversations).toBe(false));

    act(() => {
      result.current.createNewConversation();
    });

    await act(async () => {
      await result.current.syncConversationsFromServer();
    });

    const titles = result.current.conversationGroups.flatMap((group) => group.items.map((item) => item.title));

    expect(titles).toContain('新对话 2');
    expect(titles).toContain('Remote conversation');
  });

  it('loads additional server conversation pages from the next cursor', async () => {
    vi.mocked(listRagConversations)
      .mockResolvedValueOnce({
        conversations: [remoteConversation],
        nextCursor: 'cursor-2',
      })
      .mockResolvedValueOnce({
        conversations: [olderRemoteConversation],
      });
    vi.mocked(getRagConversationMessages).mockResolvedValueOnce({
      conversationId: 'conversation-1',
      messages: [],
    });

    const { result } = renderHook(() => useRagConversations());

    await waitFor(() => expect(result.current.hasMoreConversations).toBe(true));

    await act(async () => {
      await result.current.loadMoreConversations();
    });

    expect(listRagConversations).toHaveBeenNthCalledWith(2, {
      cursor: 'cursor-2',
      limit: CONVERSATION_PAGE_SIZE,
    });
    expect(result.current.hasMoreConversations).toBe(false);
    expect(result.current.conversationGroups.flatMap((group) => group.items.map((item) => item.title))).toEqual([
      'Remote conversation',
      'Older remote conversation',
    ]);
  });
});
