interface AskRagOptions {
  question: string;
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
  onNotice?: (notice: RagNotice) => void;
  onProgress?: (event: RagProgressEvent) => void;
}

interface SseMessage {
  id?: string;
  event?: string;
  data: string;
}

export interface RagNotice {
  stage?: string;
  code?: string;
  message: string;
}

export interface RagProgressEvent {
  id?: string;
  event: string;
  data: unknown;
  rawData: string;
  receivedAt: string;
}

const DEFAULT_USER_ID = 'codex-bruno-test';
const DEFAULT_TOP_K = 3;
const PRODUCTION_API_BASE_URL = 'https://api.unamedserver.me';

const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_RAG_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return import.meta.env.PROD ? PRODUCTION_API_BASE_URL : '';
};

const getUserId = () => import.meta.env.VITE_RAG_USER_ID?.trim() || DEFAULT_USER_ID;

const getTopK = () => {
  const parsedTopK = Number(import.meta.env.VITE_RAG_TOP_K ?? DEFAULT_TOP_K);
  return Number.isFinite(parsedTopK) && parsedTopK > 0 ? parsedTopK : DEFAULT_TOP_K;
};

const createRequestId = (userId: string) => {
  const compactTimestamp = new Date()
    .toISOString()
    .replace(/-/g, '')
    .replace('T', '-')
    .replace(/:/g, '')
    .slice(0, 15);

  return `${userId}-${compactTimestamp}-${crypto.randomUUID().slice(0, 8)}`;
};

const buildAskUrl = (question: string) => {
  const userId = getUserId();
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}/api/v1/public/rag/ask`, window.location.origin);

  url.searchParams.set('userId', userId);
  url.searchParams.set('question', question);
  url.searchParams.set('topK', String(getTopK()));
  url.searchParams.set('requestId', createRequestId(userId));

  return url;
};

const parseSseBlock = (block: string): SseMessage | null => {
  const message: SseMessage = { data: '' };

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();

    if (!line || line.startsWith(':')) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    const value = separatorIndex === -1 ? '' : line.slice(separatorIndex + 1).replace(/^ /, '');

    if (field === 'id') {
      message.id = value;
    }

    if (field === 'event') {
      message.event = value;
    }

    if (field === 'data') {
      message.data = message.data ? `${message.data}\n${value}` : value;
    }
  }

  return message.data || message.event || message.id ? message : null;
};

const readNestedText = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  const directKeys = [
    'answer',
    'content',
    'delta',
    'text',
    'message',
    'result',
    'response',
    'output',
    'completion',
    'finalAnswer',
    'finalContent',
  ];

  for (const key of directKeys) {
    const text = readNestedText(record[key]);

    if (text) {
      return text;
    }
  }

  const nestedKeys = ['data', 'payload', 'chunk'];

  for (const key of nestedKeys) {
    const text = readNestedText(record[key]);

    if (text) {
      return text;
    }
  }

  const choices = record.choices;

  if (Array.isArray(choices)) {
    for (const choice of choices) {
      const text = readNestedText(choice);

      if (text) {
        return text;
      }
    }
  }

  return '';
};

const parseSseData = (data: string): unknown => {
  const trimmedData = data.trim();

  if (!trimmedData || trimmedData === '[DONE]') {
    return '';
  }

  try {
    return JSON.parse(trimmedData) as unknown;
  } catch {
    return trimmedData;
  }
};

const extractAnswerDelta = (data: string) => {
  const parsedData = parseSseData(data);

  if (typeof parsedData === 'string') {
    return parsedData;
  }

  if (!parsedData || typeof parsedData !== 'object') {
    return '';
  }

  const record = parsedData as Record<string, unknown>;
  return readNestedText(record.delta ?? record.answer ?? record.content ?? record.text);
};

const extractNotice = (data: string): RagNotice | null => {
  const parsedData = parseSseData(data);

  if (!parsedData || typeof parsedData !== 'object') {
    return typeof parsedData === 'string' && parsedData ? { message: parsedData } : null;
  }

  const record = parsedData as Record<string, unknown>;
  const message = readNestedText(record.message);

  if (!message) {
    return null;
  }

  return {
    stage: typeof record.stage === 'string' ? record.stage : undefined,
    code: typeof record.code === 'string' ? record.code : undefined,
    message,
  };
};

const consumeSseMessage = (
  message: SseMessage,
  currentAnswer: string,
  onDelta?: (delta: string) => void,
  onNotice?: (notice: RagNotice) => void,
  onProgress?: (event: RagProgressEvent) => void,
) => {
  const eventName = message.event ?? 'message';
  const parsedData = parseSseData(message.data);

  onProgress?.({
    id: message.id,
    event: eventName,
    data: parsedData,
    rawData: message.data,
    receivedAt: new Date().toISOString(),
  });

  if (eventName === 'answer_delta' || eventName === 'message') {
    const delta = extractAnswerDelta(message.data);

    if (!delta) {
      return currentAnswer;
    }

    onDelta?.(delta);
    return `${currentAnswer}${delta}`;
  }

  if (eventName === 'notice') {
    const notice = extractNotice(message.data);

    if (notice) {
      onNotice?.(notice);
    }

    return currentAnswer;
  }

  if (eventName === 'error') {
    throw new Error(extractAnswerDelta(message.data) || 'RAG 服务返回错误事件。');
  }

  return currentAnswer;
};

export const askRag = async ({ question, signal, onDelta, onNotice, onProgress }: AskRagOptions): Promise<string> => {
  const response = await fetch(buildAskUrl(question), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`RAG 请求失败：${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    const text = await response.text();
    onDelta?.(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? '';

    for (const block of blocks) {
      const message = parseSseBlock(block);

      if (message) {
        answer = consumeSseMessage(message, answer, onDelta, onNotice, onProgress);
      }
    }
  }

  buffer += decoder.decode();

  if (buffer.trim()) {
    const message = parseSseBlock(buffer);

    if (message) {
      answer = consumeSseMessage(message, answer, onDelta, onNotice, onProgress);
    }
  }

  return answer;
};
