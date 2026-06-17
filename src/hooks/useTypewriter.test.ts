import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appends queued content in fixed-size ticks and resolves idle waiters', async () => {
    const appended: string[] = [];
    const { result } = renderHook(() =>
      useTypewriter({
        appendContent: (_conversationId, _messageId, content) => appended.push(content),
        charsPerTick: 2,
        getGenerationId: () => 1,
        intervalMs: 10,
      }),
    );

    act(() => {
      result.current.enqueue({
        conversationId: 'conversation-1',
        generationId: 1,
        messageId: 'message-1',
        content: 'abcd',
      });
    });

    expect(appended).toEqual(['ab']);

    const idlePromise = result.current.waitForIdle();

    act(() => {
      vi.runOnlyPendingTimers();
    });
    await idlePromise;

    expect(appended).toEqual(['ab', 'cd']);
  });

  it('drops queued content when the generation changes', () => {
    let generationId = 1;
    const appendContent = vi.fn();
    const { result } = renderHook(() =>
      useTypewriter({
        appendContent,
        charsPerTick: 2,
        getGenerationId: () => generationId,
        intervalMs: 10,
      }),
    );

    act(() => {
      result.current.enqueue({
        conversationId: 'conversation-1',
        generationId: 1,
        messageId: 'message-1',
        content: 'abcd',
      });
    });

    generationId = 2;

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(appendContent).toHaveBeenCalledTimes(1);
    expect(appendContent).toHaveBeenCalledWith('conversation-1', 'message-1', 'ab');
  });
});
