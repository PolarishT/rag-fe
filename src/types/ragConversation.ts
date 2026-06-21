import type { ConversationData } from '@ant-design/x-sdk';
import type { Message } from './chat';

export type ConversationGroupTitle = '今天' | '昨天' | '更早';

export interface ConversationItem extends ConversationData {
  key: string;
  label: string;
  groupTitle: ConversationGroupTitle;
  messages: Message[];
}

interface ConversationSummaryItem {
  id: string;
  title: string;
}

export interface ConversationGroup {
  title: ConversationGroupTitle;
  items: ConversationSummaryItem[];
}
