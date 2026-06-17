import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RagApiContractError,
  askRag,
  getRagConversationMessages,
  listRagConversations,
  updateRagConversation,
} from './ragApi';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    ...init,
  });

describe('ragApi DTO validation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('parses a strict RagConversationListView response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        data: {
          conversations: [
            {
              conversationId: 'conversation-1',
              title: 'Hello',
              createdAt: '2026-06-17T00:00:00.000Z',
              updatedAt: '2026-06-17T00:01:00.000Z',
            },
          ],
          nextCursor: 'cursor-2',
        },
      }),
    );

    const result = await listRagConversations({ limit: 10 });

    expect(result).toEqual({
      conversations: [
        {
          id: 'conversation-1',
          title: 'Hello',
          createdAt: '2026-06-17T00:00:00.000Z',
          updatedAt: '2026-06-17T00:01:00.000Z',
        },
      ],
      nextCursor: 'cursor-2',
    });
  });

  it('fails the whole conversation list request when required fields are missing', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        data: {
          conversations: [
            {
              title: 'Missing conversation id',
              createdAt: '2026-06-17T00:00:00.000Z',
              updatedAt: '2026-06-17T00:01:00.000Z',
            },
          ],
        },
      }),
    );

    await expect(listRagConversations()).rejects.toThrow(RagApiContractError);
  });

  it('rejects legacy conversation collection aliases instead of guessing shape', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        data: {
          items: [],
        },
      }),
    );

    await expect(listRagConversations()).rejects.toThrow('字段 conversations 必须是数组');
  });

  it('parses a strict RagConversationMessagesView response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        conversationId: 'conversation-1',
        messages: [
          {
            id: 'message-1',
            role: 'user',
            content: 'What is Ant Design X?',
            createdAt: '2026-06-17T00:00:00.000Z',
          },
          {
            id: 'message-2',
            role: 'assistant',
            content: 'A React UI library for AI experiences.',
            createdAt: '2026-06-17T00:00:01.000Z',
          },
        ],
      }),
    );

    const result = await getRagConversationMessages({ conversationId: 'conversation-1' });

    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]).toMatchObject({
      id: 'message-2',
      role: 'assistant',
      content: 'A React UI library for AI experiences.',
    });
  });

  it('fails the whole messages request when message role is outside the contract', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        conversationId: 'conversation-1',
        messages: [
          {
            id: 'message-1',
            role: 'bot',
            content: 'Nope',
            createdAt: '2026-06-17T00:00:00.000Z',
          },
        ],
      }),
    );

    await expect(getRagConversationMessages({ conversationId: 'conversation-1' })).rejects.toThrow(
      '字段 role 只能是 user 或 assistant',
    );
  });

  it('fails update responses whose summary belongs to a different conversation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({
        conversationId: 'conversation-2',
        title: 'Renamed',
        createdAt: '2026-06-17T00:00:00.000Z',
        updatedAt: '2026-06-17T00:02:00.000Z',
      }),
    );

    await expect(updateRagConversation({ conversationId: 'conversation-1', title: 'Renamed' })).rejects.toThrow(
      '字段 conversationId 与请求不一致',
    );
  });

  it('uses the JSON error body when ask requests fail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        {
          message: '模型配额不足',
        },
        {
          status: 429,
          statusText: 'Too Many Requests',
        },
      ),
    );

    await expect(askRag({ question: 'Hello' })).rejects.toThrow('模型配额不足');
  });
});
