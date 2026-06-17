import { useCallback, useEffect, useRef } from 'react';

const DEFAULT_TYPEWRITER_INTERVAL_MS = 18;
const DEFAULT_TYPEWRITER_CHARS_PER_TICK = 2;

interface TypewriterContent {
  conversationId: string;
  generationId: number;
  messageId: string;
  content: string;
}

interface UseTypewriterOptions {
  appendContent: (conversationId: string, messageId: string, content: string) => void;
  getGenerationId: () => number;
  intervalMs?: number;
  charsPerTick?: number;
}

export const useTypewriter = ({
  appendContent,
  charsPerTick = DEFAULT_TYPEWRITER_CHARS_PER_TICK,
  getGenerationId,
  intervalMs = DEFAULT_TYPEWRITER_INTERVAL_MS,
}: UseTypewriterOptions) => {
  const appendContentRef = useRef(appendContent);
  const getGenerationIdRef = useRef(getGenerationId);
  const queueRef = useRef('');
  const timerRef = useRef<number | null>(null);
  const activeMessageRef = useRef<TypewriterContent | null>(null);
  const idleResolversRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    appendContentRef.current = appendContent;
  }, [appendContent]);

  useEffect(() => {
    getGenerationIdRef.current = getGenerationId;
  }, [getGenerationId]);

  const resolveIdle = useCallback(() => {
    if (queueRef.current || timerRef.current !== null) {
      return;
    }

    const resolvers = idleResolversRef.current.splice(0);
    resolvers.forEach((resolve) => resolve());
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    queueRef.current = '';
    activeMessageRef.current = null;
    resolveIdle();
  }, [resolveIdle]);

  const start = useCallback(() => {
    if (timerRef.current !== null) {
      return;
    }

    const tick = () => {
      const activeMessage = activeMessageRef.current;

      if (!activeMessage || getGenerationIdRef.current() !== activeMessage.generationId) {
        stop();
        return;
      }

      const nextContent = queueRef.current.slice(0, charsPerTick);
      queueRef.current = queueRef.current.slice(charsPerTick);

      if (nextContent) {
        appendContentRef.current(activeMessage.conversationId, activeMessage.messageId, nextContent);
      }

      if (!queueRef.current && timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
        resolveIdle();
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, intervalMs);
  }, [charsPerTick, intervalMs, resolveIdle, stop]);

  const enqueue = useCallback(
    ({ content, conversationId, generationId, messageId }: TypewriterContent) => {
      if (!content || getGenerationIdRef.current() !== generationId) {
        return;
      }

      activeMessageRef.current = {
        conversationId,
        generationId,
        messageId,
        content,
      };
      queueRef.current += content;
      start();
    },
    [start],
  );

  const waitForIdle = useCallback(() => {
    if (!queueRef.current && timerRef.current === null) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      idleResolversRef.current.push(resolve);
    });
  }, []);

  useEffect(() => stop, [stop]);

  return {
    enqueue,
    stop,
    waitForIdle,
  };
};
