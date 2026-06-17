import { MessageCircle, PanelLeftClose, PanelLeftOpen, Plus, Trash2 } from 'lucide-react';
import { BrandMark } from './BrandMark';

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
  conversationGroups: ConversationGroup[];
  isCollapsed: boolean;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onToggleCollapsed: () => void;
}

export const ConversationSidebar = ({
  activeConversationId,
  conversationGroups,
  isCollapsed,
  onDeleteConversation,
  onNewConversation,
  onSelectConversation,
  onToggleCollapsed,
}: ConversationSidebarProps) => {
  const collapsedHistoryItems = conversationGroups.flatMap((group) => group.items);
  const toggleLabel = isCollapsed ? '展开侧边栏' : '折叠侧边栏';

  return (
    <aside
      className={`hidden min-h-0 overflow-hidden border-r border-slate-100 bg-slate-50/75 py-8 transition-[padding] duration-300 ease-out lg:flex lg:flex-col ${
        isCollapsed ? 'items-center px-4' : 'px-6'
      }`}
    >
      <div
        className={isCollapsed ? 'mb-8 flex w-full flex-col items-center gap-4' : 'mb-9 flex w-full items-center gap-3'}
      >
        <div className={isCollapsed ? 'flex justify-center' : 'flex min-w-0 flex-1 items-center gap-4'}>
          <BrandMark size="sm" />
          {!isCollapsed && (
            <span className="truncate text-xl font-bold tracking-normal text-slate-950">Ant Design X</span>
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

      <button
        type="button"
        title={isCollapsed ? '新对话' : undefined}
        aria-label="新对话"
        onClick={onNewConversation}
        className={
          isCollapsed
            ? 'mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50/80 text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            : 'mb-9 flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50/80 text-base font-bold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }
      >
        <Plus className="h-5 w-5" />
        {!isCollapsed && '新对话'}
      </button>

      {isCollapsed ? (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-3 overflow-y-auto">
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
                    ? 'flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                    : 'flex h-12 w-12 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-blue-600 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-9 overflow-y-auto pr-1">
          {conversationGroups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-4 text-lg font-bold text-slate-400">{group.title}</h3>
              <div className="space-y-3">
                {group.items.map((item) => {
                  const active = item.id === activeConversationId;

                  return (
                    <div
                      key={item.id}
                      className={
                        active
                          ? 'group flex min-h-12 w-full items-center gap-2 rounded-xl bg-white px-2 text-slate-800 shadow-sm'
                          : 'group flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-slate-700 transition hover:bg-white hover:shadow-sm'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSelectConversation(item.id)}
                        className={
                          active
                            ? 'min-w-0 flex-1 truncate px-2 py-3 text-left text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            : 'min-w-0 flex-1 truncate px-2 py-2.5 text-left text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }
                      >
                        {item.title}
                      </button>
                      <button
                        type="button"
                        title={`删除对话：${item.title}`}
                        aria-label={`删除对话：${item.title}`}
                        onClick={() => onDeleteConversation(item.id)}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                        }`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
};
