import type { Message, MessageRole } from '../types/chat';

export const createMessage = (role: MessageRole, content: string): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  createdAt: new Date().toISOString(),
});
