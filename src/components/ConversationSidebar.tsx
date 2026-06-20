import { useRef, type ChangeEvent } from 'react';
import { Button } from 'antd';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Loader2,
  MessageCircle,
  MessageCirclePlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import type { AdminAccessStatus } from '../hooks/useAdminAccess';
import type { DocumentImportFeedback } from '../types/documentImport';

interface ConversationSummary {
  id: string;
  title: string;
}

interface ConversationGroup {
  title: string;
  items: ConversationSummary[];
}

interface ConversationSidebarProps {
  activeConversationId: string;
  adminAccessStatus: AdminAccessStatus;
  conversationSyncError: string;
  conversationGroups: ConversationGroup[];
  documentImportFeedback: DocumentImportFeedback;
  hasMoreConversations: boolean;
  isCollapsed: boolean;
  isLoadingConversations: boolean;
  isLoadingMoreConversations: boolean;
  isImportingDocument: boolean;
  onDeleteConversation: (id: string) => void;
  onImportDocument: (file: File) => void;
  onLoadMoreConversations: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onToggleCollapsed: () => void;
}

export const ConversationSidebar = ({
  activeConversationId,
  adminAccessStatus,
  conversationSyncError,
  conversationGroups,
  documentImportFeedback,
  hasMoreConversations,
  isCollapsed,
  isLoadingConversations,
  isLoadingMoreConversations,
  isImportingDocument,
  onDeleteConversation,
  onImportDocument,
  onLoadMoreConversations,
  onNewConversation,
  onSelectConversation,
  onToggleCollapsed,
}: ConversationSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasAdminAccess = adminAccessStatus === 'authenticated';
  const collapsedHistoryItems = conversationGroups.flatMap((group) => group.items);
  const toggleLabel = isCollapsed ? '展开侧边栏' : '折叠侧边栏';
  const importTitle = isImportingDocument ? '正在导入 Markdown' : '导入 Markdown';
  const loadMoreTitle = isLoadingMoreConversations ? '正在加载更多对话' : '加载更多对话';
  const importFeedbackIcon =
    documentImportFeedback.status === 'loading' ? (
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
    ) : documentImportFeedback.status === 'success' ? (
      <CheckCircle2 className="h-4 w-4 shrink-0" />
    ) : documentImportFeedback.status === 'error' ? (
      <AlertCircle className="h-4 w-4 shrink-0" />
    ) : null;
  const importFeedbackColorClass =
    documentImportFeedback.status === 'error'
      ? 'text-red-600'
      : documentImportFeedback.status === 'success'
        ? 'text-emerald-600'
        : 'text-slate-500';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || isImportingDocument) {
      return;
    }

    onImportDocument(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside
      className={`hidden min-h-0 overflow-hidden border-r border-slate-100 bg-slate-50/75 py-8 transition-[padding] duration-300 ease-out lg:flex lg:flex-col ${
        isCollapsed ? 'items-center px-4' : 'px-6'
      }`}
    >
      {hasAdminAccess && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown"
          className="hidden"
          onChange={handleFileChange}
        />
      )}

      <div
        className={
          isCollapsed
            ? 'mb-7 flex w-full shrink-0 flex-col items-center gap-4'
            : 'mb-7 flex w-full shrink-0 items-center gap-3'
        }
      >
        <div className={isCollapsed ? 'flex justify-center' : 'flex min-w-0 flex-1 items-center gap-4'}>
          <BrandMark size="sm" />
          {!isCollapsed && (
            <span className="truncate text-xl font-bold tracking-normal text-slate-950">Agents Chat</span>
          )}
        </div>

        <button
          type="button"
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={!isCollapsed}
          onClick={onToggleCollapsed}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      <Button
        type="default"
        size="large"
        title={isCollapsed ? '新对话' : undefined}
        aria-label="新对话"
        icon={<MessageCirclePlus className="h-[18px] w-[18px] text-indigo-400" strokeWidth={1.8} />}
        onClick={onNewConversation}
        className={
          isCollapsed
            ? 'mb-7 h-12 w-12 shrink-0 rounded-xl border-transparent bg-indigo-50/40 p-0 text-slate-600 shadow-none hover:border-transparent hover:bg-indigo-50/80 hover:text-slate-700'
            : 'mb-8 h-12 w-full shrink-0 rounded-xl border-transparent bg-indigo-50/40 text-sm font-semibold text-slate-600 shadow-none hover:border-transparent hover:bg-indigo-50/80 hover:text-slate-700'
        }
      >
        {!isCollapsed && '新对话'}
      </Button>

      {!isCollapsed && (isLoadingConversations || conversationSyncError) && (
        <div
          title={conversationSyncError || undefined}
          className="mb-4 flex min-h-7 shrink-0 items-center gap-2 px-2 text-xs font-medium text-slate-400"
        >
          {conversationSyncError ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          ) : (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />
          )}
          <span className="min-w-0 truncate leading-5">
            {conversationSyncError ? '暂时无法同步历史会话' : '正在同步历史会话'}
          </span>
        </div>
      )}

      {isCollapsed ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-2 overflow-y-auto">
          {collapsedHistoryItems.map((item) => {
            const active = item.id === activeConversationId;

            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                aria-label={`打开对话：${item.title}`}
                onClick={() => onSelectConversation(item.id)}
                className={
                  active
                    ? 'flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            );
          })}

          {hasMoreConversations && (
            <button
              type="button"
              title={loadMoreTitle}
              aria-label={loadMoreTitle}
              aria-busy={isLoadingMoreConversations}
              disabled={isLoadingMoreConversations}
              onClick={onLoadMoreConversations}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isLoadingMoreConversations ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MoreHorizontal className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
          {conversationGroups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 px-3 text-xs font-semibold tracking-wide text-slate-400">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.id === activeConversationId;

                  return (
                    <div
                      key={item.id}
                      className={
                        active
                          ? 'group flex min-h-10 w-full items-center gap-2 rounded-lg bg-blue-50/80 px-3 text-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-50'
                          : 'group flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 focus-within:bg-slate-100/80 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-50'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSelectConversation(item.id)}
                        className={
                          active
                            ? 'min-w-0 flex-1 truncate py-2.5 text-left text-sm font-semibold focus:outline-none'
                            : 'min-w-0 flex-1 truncate py-2.5 text-left text-sm font-medium focus:outline-none'
                        }
                      >
                        {item.title}
                      </button>
                      <button
                        type="button"
                        title={`删除对话：${item.title}`}
                        aria-label={`删除对话：${item.title}`}
                        onClick={() => onDeleteConversation(item.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 focus:opacity-100 focus:outline-none group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {hasMoreConversations && (
            <button
              type="button"
              aria-busy={isLoadingMoreConversations}
              disabled={isLoadingMoreConversations}
              onClick={onLoadMoreConversations}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {isLoadingMoreConversations ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {isLoadingMoreConversations ? '加载中' : '加载更多'}
            </button>
          )}
        </div>
      )}

      {adminAccessStatus === 'checking' ? null : isCollapsed ? (
        <div className="mt-5 shrink-0 border-t border-slate-200 pt-5">
          {hasAdminAccess ? (
            <button
              type="button"
              title={importTitle}
              aria-label={importTitle}
              disabled={isImportingDocument}
              onClick={openFilePicker}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              {isImportingDocument ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
            </button>
          ) : (
            <button
              type="button"
              title="Admin Authority"
              aria-label="Admin Authority"
              onClick={() => {
                window.location.href = '/admin/auth';
              }}
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ShieldCheck className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 shrink-0 border-t border-slate-200 pt-5">
          {hasAdminAccess ? (
            <>
              <button
                type="button"
                disabled={isImportingDocument}
                onClick={openFilePicker}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {isImportingDocument ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
                导入 Markdown
              </button>

              {documentImportFeedback.status !== 'idle' && documentImportFeedback.message && (
                <div className={`mt-3 flex min-h-6 items-start gap-2 text-sm font-semibold ${importFeedbackColorClass}`}>
                  {importFeedbackIcon}
                  <span className="min-w-0 leading-6">{documentImportFeedback.message}</span>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.href = '/admin/auth';
              }}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ShieldCheck className="h-5 w-5" />
              Admin Authority
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
