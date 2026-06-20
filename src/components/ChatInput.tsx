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
    <div className="rounded-[22px] border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_18px_50px_rgba(15,23,42,0.11),0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl transition focus-within:border-blue-200 focus-within:shadow-[0_20px_56px_rgba(37,99,235,0.13),0_2px_10px_rgba(15,23,42,0.05)]">
      <Sender
        ref={senderRef}
        value={value}
        loading={isGenerating}
        submitType="enter"
        autoSize={{ minRows: 1, maxRows: 5 }}
        placeholder={isGenerating ? 'AI 正在生成中...' : '发消息给 Agents Design X'}
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
