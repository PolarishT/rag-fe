import { useEffect, useRef } from 'react';
import { Sender } from '@ant-design/x';
import { Loader2, SendHorizontal } from 'lucide-react';

interface ChatInputProps {
  value: string;
  isGenerating: boolean;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
}

export const ChatInput = ({ value, isGenerating, onChange, onSubmit }: ChatInputProps) => {
  const senderRef = useRef<React.ElementRef<typeof Sender>>(null);
  const canSend = value.trim().length > 0 && !isGenerating;

  useEffect(() => {
    senderRef.current?.focus?.({ cursor: 'end' });
  }, []);

  const handleSubmit = (message: string) => {
    const nextMessage = message.trim();

    if (!nextMessage || isGenerating) {
      return;
    }

    onSubmit(nextMessage);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <Sender
        ref={senderRef}
        value={value}
        loading={isGenerating}
        submitType="enter"
        autoSize={{ minRows: 1, maxRows: 5 }}
        placeholder={isGenerating ? 'AI 正在生成中...' : '发消息给 Ant Design X'}
        rootClassName="chat-sender"
        onChange={(nextValue) => onChange(nextValue)}
        onSubmit={handleSubmit}
        suffix={(_, { components }) => {
          const { SendButton, LoadingButton } = components;

          if (isGenerating) {
            return (
              <LoadingButton
                type="primary"
                icon={<Loader2 className="h-4 w-4 animate-spin" />}
                className="chat-sender-action"
              />
            );
          }

          return (
            <SendButton
              type="primary"
              disabled={!canSend}
              icon={<SendHorizontal className="h-4 w-4" />}
              className="chat-sender-action"
            />
          );
        }}
      />
    </div>
  );
};
