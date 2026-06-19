interface AskRagOptions {
  conversationId?: string;
  question: string;
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
  onNotice?: (notice: RagNotice) => void;
  onProgress?: (event: RagProgressEvent) => void;
}

interface ImportRagDocumentOptions {
  file: File;
  signal?: AbortSignal;
}

interface ListRagConversationsOptions {
  cursor?: string;
  limit?: number;
  signal?: AbortSignal;
}

interface GetRagConversationMessagesOptions {
  conversationId: string;
  signal?: AbortSignal;
}

interface UpdateRagConversationOptions {
  conversationId: string;
  signal?: AbortSignal;
  title: string;
}

interface DeleteRagConversationOptions {
  conversationId: string;
  signal?: AbortSignal;
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

export interface RagConversationSummaryViewDto {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface RagConversationListViewDto {
  conversations: RagConversationSummaryViewDto[];
  nextCursor?: string;
}

export interface RagConversationMessageViewDto {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface RagConversationMessagesViewDto {
  conversationId: string;
  messages: RagConversationMessageViewDto[];
}

export interface RagConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface RagConversationListResult {
  conversations: RagConversationSummary[];
  nextCursor?: string;
}

export interface RagConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface RagConversationMessagesResult {
  conversationId: string;
  messages: RagConversationMessage[];
}

export class RagApiContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RagApiContractError';
  }
}

const DEFAULT_USER_ID = 'codex-bruno-test';
const DEFAULT_TOP_K = 3;

const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_RAG_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return '';
};

export const getRagUserId = () => import.meta.env.VITE_RAG_USER_ID?.trim() || DEFAULT_USER_ID;

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

const buildAskUrl = (question: string, conversationId?: string) => {
  const userId = getRagUserId();
  const baseUrl = getApiBaseUrl();
  const url = new URL(`${baseUrl}/api/v1/public/rag/ask`, window.location.origin);

  url.searchParams.set('userId', userId);
  url.searchParams.set('question', question);
  url.searchParams.set('topK', String(getTopK()));
  url.searchParams.set('requestId', createRequestId(userId));

  if (conversationId) {
    url.searchParams.set('conversationId', conversationId);
  }

  return url;
};

const buildConversationsUrl = () => {
  const baseUrl = getApiBaseUrl();
  return new URL(`${baseUrl}/api/v1/public/rag/conversations`, window.location.origin);
};

const buildConversationMessagesUrl = (conversationId: string) => {
  const baseUrl = getApiBaseUrl();
  return new URL(
    `${baseUrl}/api/v1/public/rag/conversations/${encodeURIComponent(conversationId)}/messages`,
    window.location.origin,
  );
};

const buildConversationUpdateUrl = (conversationId: string) => {
  const baseUrl = getApiBaseUrl();
  return new URL(
    `${baseUrl}/api/v1/public/rag/conversations/${encodeURIComponent(conversationId)}/update`,
    window.location.origin,
  );
};

const buildConversationUrl = (conversationId: string) => {
  const baseUrl = getApiBaseUrl();
  return new URL(
    `${baseUrl}/api/v1/public/rag/conversations/${encodeURIComponent(conversationId)}`,
    window.location.origin,
  );
};

const buildDocumentCreateUrl = () => {
  const baseUrl = getApiBaseUrl();
  return new URL(`${baseUrl}/api/v1/public/rag/documents/create`, window.location.origin);
};

const normalizeDocumentFile = (file: File) => {
  const lowerFileName = file.name.toLowerCase();
  const isMarkdownFile = lowerFileName.endsWith('.md') || lowerFileName.endsWith('.markdown');

  if (isMarkdownFile && file.type !== 'text/markdown') {
    return new File([file], file.name, { type: 'text/markdown' });
  }

  return file;
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      throw new RagApiContractError('RAG 服务返回了无效 JSON。');
    }

    return text;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const unwrapApiResponse = (body: unknown) => {
  if (!isRecord(body) || !('data' in body)) {
    return body;
  }

  return body.data;
};

const contractError = (context: string, detail: string) =>
  new RagApiContractError(`${context} 响应契约错误：${detail}`);

const readRequiredRecord = (value: unknown, context: string) => {
  if (!isRecord(value)) {
    throw contractError(context, '期望对象。');
  }

  return value;
};

const readRequiredArray = (record: Record<string, unknown>, key: string, context: string) => {
  const value = record[key];

  if (!Array.isArray(value)) {
    throw contractError(context, `字段 ${key} 必须是数组。`);
  }

  return value;
};

const readRequiredString = (record: Record<string, unknown>, key: string, context: string) => {
  const value = record[key];

  if (typeof value !== 'string' || !value.trim()) {
    throw contractError(context, `字段 ${key} 必须是非空字符串。`);
  }

  return value.trim();
};

const readOptionalString = (record: Record<string, unknown>, key: string, context: string) => {
  const value = record[key];

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw contractError(context, `字段 ${key} 必须是字符串。`);
  }

  return value.trim();
};

const readMessageRole = (record: Record<string, unknown>, context: string): 'user' | 'assistant' => {
  const value = readRequiredString(record, 'role', context);

  if (value !== 'user' && value !== 'assistant') {
    throw contractError(context, '字段 role 只能是 user 或 assistant。');
  }

  return value;
};

const readConversationSummaryViewDto = (value: unknown, context: string): RagConversationSummaryViewDto => {
  const record = readRequiredRecord(value, context);

  return {
    conversationId: readRequiredString(record, 'conversationId', context),
    title: readRequiredString(record, 'title', context),
    createdAt: readRequiredString(record, 'createdAt', context),
    updatedAt: readRequiredString(record, 'updatedAt', context),
  };
};

const readConversationListViewDto = (value: unknown): RagConversationListViewDto => {
  const context = 'RagConversationListView';
  const record = readRequiredRecord(value, context);
  const conversations = readRequiredArray(record, 'conversations', context).map((conversation, index) =>
    readConversationSummaryViewDto(conversation, `${context}.conversations[${index}]`),
  );

  return {
    conversations,
    nextCursor: readOptionalString(record, 'nextCursor', context),
  };
};

const readConversationMessageViewDto = (value: unknown, context: string): RagConversationMessageViewDto => {
  const record = readRequiredRecord(value, context);

  return {
    id: readRequiredString(record, 'id', context),
    role: readMessageRole(record, context),
    content: readRequiredString(record, 'content', context),
    createdAt: readRequiredString(record, 'createdAt', context),
  };
};

const readConversationMessagesViewDto = (value: unknown): RagConversationMessagesViewDto => {
  const context = 'RagConversationMessagesView';
  const record = readRequiredRecord(value, context);
  const messages = readRequiredArray(record, 'messages', context).map((message, index) =>
    readConversationMessageViewDto(message, `${context}.messages[${index}]`),
  );

  return {
    conversationId: readRequiredString(record, 'conversationId', context),
    messages,
  };
};

const mapConversationSummary = (summary: RagConversationSummaryViewDto): RagConversationSummary => ({
  id: summary.conversationId,
  title: summary.title,
  createdAt: summary.createdAt,
  updatedAt: summary.updatedAt,
});

const mapConversationMessage = (message: RagConversationMessageViewDto): RagConversationMessage => ({
  id: message.id,
  role: message.role,
  content: message.content,
  createdAt: message.createdAt,
});

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

  if (!isRecord(value)) {
    return '';
  }

  const directKeys = ['answer', 'content', 'delta', 'text', 'message', 'response', 'finalAnswer', 'finalContent'];

  for (const key of directKeys) {
    const text = readNestedText(value[key]);

    if (text) {
      return text;
    }
  }

  if (Array.isArray(value.choices)) {
    for (const choice of value.choices) {
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

  if (!isRecord(parsedData)) {
    return '';
  }

  return readNestedText(parsedData.delta ?? parsedData.answer ?? parsedData.content ?? parsedData.text);
};

const extractNotice = (data: string): RagNotice | null => {
  const parsedData = parseSseData(data);

  if (!isRecord(parsedData)) {
    return typeof parsedData === 'string' && parsedData ? { message: parsedData } : null;
  }

  const message = readNestedText(parsedData.message);

  if (!message) {
    return null;
  }

  return {
    stage: typeof parsedData.stage === 'string' ? parsedData.stage : undefined,
    code: typeof parsedData.code === 'string' ? parsedData.code : undefined,
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

const readRequestErrorMessage = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (!isRecord(value)) {
    return '';
  }

  const message = value.message ?? value.error;
  return typeof message === 'string' ? message : '';
};

const throwRequestError = (prefix: string, response: Response, responseBody: unknown) => {
  throw new Error(readRequestErrorMessage(responseBody) || `${prefix}：${response.status} ${response.statusText}`);
};

export const listRagConversations = async ({
  cursor,
  limit = 50,
  signal,
}: ListRagConversationsOptions = {}): Promise<RagConversationListResult> => {
  const url = buildConversationsUrl();
  url.searchParams.set('userId', getRagUserId());
  url.searchParams.set('limit', String(limit));

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throwRequestError('会话列表加载失败', response, responseBody);
  }

  const dto = readConversationListViewDto(unwrapApiResponse(responseBody));

  return {
    conversations: dto.conversations.map(mapConversationSummary),
    nextCursor: dto.nextCursor,
  };
};

export const getRagConversationMessages = async ({
  conversationId,
  signal,
}: GetRagConversationMessagesOptions): Promise<RagConversationMessagesResult> => {
  const url = buildConversationMessagesUrl(conversationId);
  url.searchParams.set('userId', getRagUserId());

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throwRequestError('会话消息加载失败', response, responseBody);
  }

  const dto = readConversationMessagesViewDto(unwrapApiResponse(responseBody));

  if (dto.conversationId !== conversationId) {
    throw contractError(
      'RagConversationMessagesView',
      `字段 conversationId 与请求不一致，期望 ${conversationId}，实际 ${dto.conversationId}。`,
    );
  }

  return {
    conversationId: dto.conversationId,
    messages: dto.messages.map(mapConversationMessage),
  };
};

export const updateRagConversation = async ({
  conversationId,
  signal,
  title,
}: UpdateRagConversationOptions): Promise<RagConversationSummary> => {
  const response = await fetch(buildConversationUpdateUrl(conversationId), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: getRagUserId(),
      title,
    }),
    signal,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throwRequestError('会话更新失败', response, responseBody);
  }

  const dto = readConversationSummaryViewDto(unwrapApiResponse(responseBody), 'RagConversationSummaryView');

  if (dto.conversationId !== conversationId) {
    throw contractError(
      'RagConversationSummaryView',
      `字段 conversationId 与请求不一致，期望 ${conversationId}，实际 ${dto.conversationId}。`,
    );
  }

  return mapConversationSummary(dto);
};

export const deleteRagConversation = async ({
  conversationId,
  signal,
}: DeleteRagConversationOptions): Promise<RagConversationSummary> => {
  const url = buildConversationUrl(conversationId);
  url.searchParams.set('userId', getRagUserId());

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throwRequestError('会话删除失败', response, responseBody);
  }

  const dto = readConversationSummaryViewDto(unwrapApiResponse(responseBody), 'RagConversationSummaryView');

  if (dto.conversationId !== conversationId) {
    throw contractError(
      'RagConversationSummaryView',
      `字段 conversationId 与请求不一致，期望 ${conversationId}，实际 ${dto.conversationId}。`,
    );
  }

  return mapConversationSummary(dto);
};

export const askRag = async ({
  conversationId,
  question,
  signal,
  onDelta,
  onNotice,
  onProgress,
}: AskRagOptions): Promise<string> => {
  const response = await fetch(buildAskUrl(question, conversationId), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
    },
    signal,
  });

  if (!response.ok) {
    const responseBody = await parseResponseBody(response);
    throwRequestError('RAG 请求失败', response, responseBody);
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

export const importRagDocument = async ({ file, signal }: ImportRagDocumentOptions): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', normalizeDocumentFile(file), file.name);

  const response = await fetch(buildDocumentCreateUrl(), {
    method: 'POST',
    body: formData,
    signal,
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throwRequestError('文档导入失败', response, responseBody);
  }

  return responseBody;
};
