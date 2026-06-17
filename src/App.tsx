import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AgentThoughtProcess } from './components/AgentThoughtProcess';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { ConversationSidebar } from './components/ConversationSidebar';
import { EmptyState } from './components/EmptyState';
import { QuickActions } from './components/QuickActions';
import { TypingIndicator } from './components/TypingIndicator';
import { useDocumentImport } from './hooks/useDocumentImport';
import { useRagChat } from './hooks/useRagChat';
import { useRagConversations } from './hooks/useRagConversations';

const MESSAGE_FOOTER_GAP_PX = 24;

const App = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const ragConversations = useRagConversations();
  const ragChat = useRagChat({ conversations: ragConversations });
  const documentImport = useDocumentImport();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [ragChat.chatState.messages, ragChat.chatState.isGenerating]);

  useLayoutEffect(() => {
    const footer = footerRef.current;

    if (!footer) {
      return;
    }

    const updateFooterHeight = () => {
      setFooterHeight(Math.ceil(footer.getBoundingClientRect().height));
    };

    updateFooterHeight();

    const resizeObserver = new ResizeObserver(updateFooterHeight);
    resizeObserver.observe(footer);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const hasMessages = ragChat.chatState.messages.length > 0;
  const hasAssistantContent = ragChat.chatState.messages.some(
    (message) => message.role === 'assistant' && message.content.trim().length > 0,
  );
  const shouldShowThinking = ragChat.chatState.isGenerating && !ragChat.hasAnswerStarted;
  const sidebarGridClass = isSidebarCollapsed
    ? 'lg:grid-cols-[88px_minmax(0,1fr)]'
    : 'lg:grid-cols-[304px_minmax(0,1fr)]';
  const bottomSpacerHeight = footerHeight + MESSAGE_FOOTER_GAP_PX;

  return (
    <div className="h-dvh overflow-hidden bg-[#f5f8fc] p-2 text-slate-950">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_20px_64px_rgba(15,23,42,0.08)]">
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-6">
          <span className="h-4 w-4 rounded-full bg-red-500" />
          <span className="h-4 w-4 rounded-full bg-lime-500" />
          <span className="h-4 w-4 rounded-full bg-amber-400" />
          <div className="ml-5 h-6 flex-1 rounded-lg bg-white/70 shadow-inner" />
        </div>

        <main
          className={`grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-out ${sidebarGridClass}`}
        >
          <ConversationSidebar
            activeConversationId={ragConversations.activeConversationId}
            conversationSyncError={ragConversations.conversationSyncError}
            conversationGroups={ragConversations.conversationGroups}
            documentImportFeedback={documentImport.documentImportFeedback}
            hasMoreConversations={ragConversations.hasMoreConversations}
            isCollapsed={isSidebarCollapsed}
            isLoadingConversations={ragConversations.isLoadingConversations}
            isLoadingMoreConversations={ragConversations.isLoadingMoreConversations}
            isImportingDocument={documentImport.isImportingDocument}
            onDeleteConversation={ragConversations.deleteConversation}
            onImportDocument={documentImport.importDocument}
            onLoadMoreConversations={ragConversations.loadMoreConversations}
            onNewConversation={ragConversations.createNewConversation}
            onSelectConversation={ragConversations.selectConversation}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          />

          <section className="relative flex min-h-0 min-w-0 flex-col bg-white">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {hasMessages || ragChat.chatState.isGenerating ? (
                <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-end gap-5 px-5 py-7 sm:px-9 xl:px-12">
                  {ragChat.chatState.messages.map((message, index) =>
                    message.role === 'assistant' && !message.content ? null : (
                      <ChatMessage
                        key={message.id}
                        isStreaming={
                          ragChat.chatState.isGenerating &&
                          message.role === 'assistant' &&
                          index === ragChat.chatState.messages.length - 1
                        }
                        message={message}
                      />
                    ),
                  )}
                  {shouldShowThinking && (
                    <AgentThoughtProcess notices={ragChat.ragNotices} progressEvents={ragChat.ragProgressEvents} />
                  )}
                  {ragChat.chatState.isGenerating && !ragChat.hasAnswerStarted && !hasAssistantContent && (
                    <TypingIndicator />
                  )}
                  <div ref={bottomRef} className="shrink-0" style={{ height: bottomSpacerHeight }} />
                </div>
              ) : (
                <EmptyState onSelectPrompt={ragChat.sendMessage} />
              )}
            </div>

            <footer
              ref={footerRef}
              className="absolute inset-x-0 bottom-0 bg-white/96 px-5 pb-5 pt-3 backdrop-blur sm:px-9 xl:px-12"
            >
              <div className="mx-auto max-w-4xl space-y-4">
                <QuickActions onSelectPrompt={ragChat.sendMessage} />
                <ChatInput
                  value={ragChat.inputValue}
                  isGenerating={ragChat.chatState.isGenerating}
                  onChange={ragChat.setInputValue}
                  onSubmit={ragChat.sendMessage}
                />
              </div>
            </footer>
          </section>
        </main>
      </section>
    </div>
  );
};

export default App;
