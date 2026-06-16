import { Think, ThoughtChain, type ThoughtChainItemType } from '@ant-design/x';
import { motion } from 'framer-motion';
import { BrainCircuit, DatabaseZap, FileSearch, PenLine } from 'lucide-react';
import type { RagNotice, RagProgressEvent } from '../services/ragApi';

interface AgentThoughtProcessProps {
  notices: RagNotice[];
  progressEvents: RagProgressEvent[];
}

type ThoughtStatus = ThoughtChainItemType['status'];

const iconClassName = 'h-4 w-4';
const noticeProblemPattern = /error|failed|timeout|no_context|all_branches_failed/i;

const getEvent = (events: RagProgressEvent[], eventName: string) =>
  events.find((event) => event.event === eventName);

const hasEvent = (events: RagProgressEvent[], eventNames: string[]) =>
  eventNames.some((eventName) => events.some((event) => event.event === eventName));

const readRecord = (event?: RagProgressEvent) => {
  if (!event?.data || typeof event.data !== 'object' || Array.isArray(event.data)) {
    return null;
  }

  return event.data as Record<string, unknown>;
};

const readBoolean = (value: unknown) => (typeof value === 'boolean' ? value : undefined);

const readNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const readString = (value: unknown) => {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const compactText = (value: unknown, maxLength = 96) => {
  const text = readString(value).replace(/\s+/g, ' ').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};

const createDetailContent = (rows: Array<{ label: string; value?: string | number | boolean | null }>) => {
  const visibleRows = rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== '');

  if (visibleRows.length === 0) {
    return undefined;
  }

  return (
    <dl className="space-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
      {visibleRows.map((row) => (
        <div key={row.label} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
          <dt className="font-bold text-slate-400">{row.label}</dt>
          <dd className="min-w-0 break-words">{String(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
};

const createNoticeContent = (notices: RagNotice[]) => {
  if (notices.length === 0) {
    return undefined;
  }

  return (
    <div className="space-y-2">
      {notices.slice(-4).map((notice, index) => {
        const hasProblem = noticeProblemPattern.test(`${notice.stage ?? ''} ${notice.code ?? ''}`);

        return (
          <div
            key={`${notice.stage ?? 'notice'}-${notice.code ?? index}`}
            className={`rounded-lg px-3 py-2 text-xs leading-5 ${
              hasProblem ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
            }`}
          >
            <div className="font-bold">{notice.stage ?? 'notice'}</div>
            <div>{notice.message}</div>
          </div>
        );
      })}
    </div>
  );
};

const createCombinedContent = (...contents: Array<React.ReactNode | undefined>) => {
  const visibleContents = contents.filter(Boolean);

  if (visibleContents.length === 0) {
    return undefined;
  }

  return (
    <div className="space-y-2">
      {visibleContents.map((content, index) => (
        <div key={index}>{content}</div>
      ))}
    </div>
  );
};

export const AgentThoughtProcess = ({ notices, progressEvents }: AgentThoughtProcessProps) => {
  const startedEvent = getEvent(progressEvents, 'started');
  const transformedEvent = getEvent(progressEvents, 'query_transformed');
  const expandedEvent = getEvent(progressEvents, 'query_expanded');
  const contextsEvent = getEvent(progressEvents, 'contexts');
  const answerEvent = getEvent(progressEvents, 'answer_delta');
  const completedEvent = getEvent(progressEvents, 'completed');

  const startedRecord = readRecord(startedEvent);
  const transformedRecord = readRecord(transformedEvent);
  const expandedRecord = readRecord(expandedEvent);
  const contextsRecord = readRecord(contextsEvent);
  const completedRecord = readRecord(completedEvent);

  const hasStarted = Boolean(startedEvent) || progressEvents.length > 0;
  const hasTransformed = Boolean(transformedEvent);
  const hasExpanded = Boolean(expandedEvent);
  const hasContexts = Boolean(contextsEvent);
  const hasAnswer = Boolean(answerEvent);
  const hasCompleted = Boolean(completedEvent);
  const hasNoticeProblem = notices.some((notice) => noticeProblemPattern.test(`${notice.stage ?? ''} ${notice.code ?? ''}`));

  const queryTransformed = readBoolean(transformedRecord?.queryTransformed);
  const queryExpanded = readBoolean(expandedRecord?.queryExpanded);
  const retrievalQueries = Array.isArray(expandedRecord?.retrievalQueries) ? expandedRecord.retrievalQueries : [];
  const contexts = Array.isArray(contextsRecord?.contexts) ? contextsRecord.contexts : undefined;
  const contextCount = contexts?.length ?? readNumber(completedRecord?.contextCount);
  const degraded = readBoolean(completedRecord?.degraded);

  const understandDone = hasEvent(progressEvents, ['query_transformed', 'query_expanded', 'contexts', 'answer_delta', 'completed']);
  const expandDone = hasEvent(progressEvents, ['query_expanded', 'contexts', 'answer_delta', 'completed']);
  const retrieveDone = hasEvent(progressEvents, ['contexts', 'answer_delta', 'completed']);

  const understandStatus: ThoughtStatus = understandDone ? 'success' : 'loading';
  const expandStatus: ThoughtStatus = expandDone ? 'success' : hasTransformed ? 'loading' : undefined;
  const retrieveStatus: ThoughtStatus = retrieveDone
    ? contextCount === 0 || hasNoticeProblem
      ? 'abort'
      : 'success'
    : hasExpanded
      ? 'loading'
      : undefined;
  const answerStatus: ThoughtStatus = hasCompleted ? 'success' : hasAnswer || hasContexts ? 'loading' : undefined;

  const noticeContent = createNoticeContent(notices);
  const items: ThoughtChainItemType[] = [
    {
      key: 'understand',
      title: '理解与改写',
      description: understandDone
        ? queryTransformed
          ? '已完成问题改写，进入检索准备'
          : '未改写，使用原问题进行检索'
        : hasStarted
          ? '已接收请求，等待 query_transformed'
          : '等待服务端 started 事件',
      content: createDetailContent([
        { label: 'topK', value: readNumber(startedRecord?.topK) },
        { label: 'request', value: compactText(startedRecord?.question) },
        { label: 'rewrite', value: transformedRecord?.rewriteDecision ? String(transformedRecord.rewriteDecision) : undefined },
        { label: 'query', value: compactText(transformedRecord?.retrievalQuestion) },
      ]),
      icon: <BrainCircuit className={iconClassName} />,
      status: understandStatus,
      blink: understandStatus === 'loading',
      collapsible: Boolean(startedEvent || transformedEvent),
    },
    {
      key: 'expand',
      title: '扩展检索',
      description: expandDone
        ? queryExpanded
          ? `已展开 ${retrievalQueries.length} 个检索查询`
          : '未扩展，使用单一检索查询'
        : hasTransformed
          ? '等待 query_expanded'
          : '等待问题改写完成',
      content: createDetailContent([
        { label: 'expanded', value: queryExpanded === undefined ? undefined : queryExpanded ? '是' : '否' },
        { label: 'queries', value: retrievalQueries.map((query) => compactText(query, 72)).join(' / ') },
      ]),
      icon: <FileSearch className={iconClassName} />,
      status: expandStatus,
      blink: expandStatus === 'loading',
      collapsible: Boolean(expandedEvent),
    },
    {
      key: 'retrieve',
      title: '召回上下文',
      description: retrieveDone
        ? contextCount === 0
          ? '未召回到可用上下文，准备降级回答'
          : `已召回 ${contextCount} 个上下文片段`
        : hasExpanded
          ? '正在等待 contexts'
          : '等待检索查询生成',
      content: createCombinedContent(
        createDetailContent([
          { label: 'contexts', value: contextCount },
          { label: 'status', value: hasNoticeProblem ? '存在降级或分支异常' : undefined },
        ]),
        noticeContent,
      ),
      icon: <DatabaseZap className={iconClassName} />,
      status: retrieveStatus,
      blink: retrieveStatus === 'loading',
      collapsible: Boolean(contextsEvent || noticeContent),
    },
    {
      key: 'answer',
      title: '生成回答',
      description: hasCompleted
        ? degraded
          ? '已完成，使用降级结果'
          : '已完成回答生成'
        : hasAnswer
          ? '正在流式输出 answer_delta'
          : hasContexts
            ? '等待 answer_delta'
            : '等待上下文召回完成',
      content: createDetailContent([
        { label: 'degraded', value: degraded === undefined ? undefined : degraded ? '是' : '否' },
        { label: 'model', value: readBoolean(completedRecord?.generatedByModel) === undefined ? undefined : readBoolean(completedRecord?.generatedByModel) ? '是' : '否' },
      ]),
      icon: <PenLine className={iconClassName} />,
      status: answerStatus,
      blink: answerStatus === 'loading',
      collapsible: Boolean(completedEvent),
    },
  ];

  const expandedKeys = items
    .filter((item) => item.content && (item.status === 'loading' || item.status === 'abort' || item.status === 'error'))
    .map((item) => item.key)
    .filter((key): key is string => Boolean(key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="mr-auto max-w-[90%] sm:max-w-[78%]"
    >
      <Think
        title="Thinking process"
        loading
        blink
        className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-soft"
        styles={{
          content: {
            paddingTop: 12,
          },
        }}
      >
        <ThoughtChain
          items={items}
          line="dashed"
          expandedKeys={expandedKeys}
          styles={{
            root: {
              gap: 12,
            },
          }}
        />
      </Think>
    </motion.div>
  );
};
