import { Bubble, CodeHighlighter } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import type { ComponentProps as XMarkdownComponentProps } from '@ant-design/x-markdown';
import { Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

const formatMessageTime = (createdAt: string) =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(createdAt));

const MarkdownCode = ({
  block,
  children,
  domNode: _domNode,
  lang,
  streamStatus: _streamStatus,
  ...props
}: XMarkdownComponentProps) => {
  if (block) {
    const code = String(children ?? '').replace(/\n$/, '');
    const language = lang?.split(/\s+/)[0];

    return (
      <CodeHighlighter lang={language} className="my-3">
        {code}
      </CodeHighlighter>
    );
  }

  return <code {...props}>{children}</code>;
};

const markdownComponents = {
  code: MarkdownCode,
};

const renderMarkdown = (content: string, isStreaming: boolean) => (
  <XMarkdown
    className="markdown-body"
    components={markdownComponents}
    content={content}
    escapeRawHtml
    openLinksInNewTab
    streaming={
      isStreaming
        ? {
            enableAnimation: true,
            hasNextChunk: true,
            tail: true,
          }
        : undefined
    }
  />
);

export const ChatMessage = ({ isStreaming = false, message }: ChatMessageProps) => {
  const isUser = message.role === 'user';

  const avatar = (
    <div
      className={
        isUser
          ? 'flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm'
          : 'flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-violet-300 shadow-sm'
      }
    >
      {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
    </div>
  );

  const renderContent = (content: string) => (
    <div
      className={
        isUser
          ? 'max-w-full whitespace-pre-wrap rounded-lg bg-blue-600 px-4 py-3 text-[15px] leading-7 text-white shadow-soft'
          : 'max-w-full rounded-lg border border-slate-100 bg-white px-4 py-3 text-[15px] leading-7 text-slate-800 shadow-soft sm:px-5 sm:py-4'
      }
    >
      {isUser ? content : renderMarkdown(content, isStreaming)}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={isUser ? 'ml-auto max-w-[90%] sm:max-w-[78%]' : 'mr-auto max-w-[94%] sm:max-w-[86%] xl:max-w-[860px]'}
    >
      <Bubble
        placement={isUser ? 'end' : 'start'}
        variant="borderless"
        avatar={avatar}
        content={message.content}
        contentRender={renderContent}
        footer={
          <span className={isUser ? 'pr-1 text-xs text-slate-400' : 'pl-1 text-xs text-slate-400'}>
            {formatMessageTime(message.createdAt)}
          </span>
        }
      />
    </motion.div>
  );
};
