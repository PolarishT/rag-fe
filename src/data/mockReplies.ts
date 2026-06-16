const replyRules = [
  {
    keywords: ['ant design x', 'antd', '样板间', '独立式'],
    reply:
      '这类独立式样板间的关键是让用户一进来就知道三件事：\n\n- 当前智能体能做什么\n- 可以从哪些示例问题开始\n- 真实对话入口在哪里\n\n所以我会把欢迎卡片、快捷指令和输入框放在同一个视觉焦点里。',
  },
  {
    keywords: ['react', 'hooks', 'hook'],
    reply:
      'React 方向可以保持这套结构：**页面状态在 App 管理，聊天输入与消息展示拆成独立组件，API 调用放到 data/service 层**。\n\n这样以后接入真实模型服务时，不需要重写 UI。',
  },
  {
    keywords: ['api', '接口', '后端', 'stream', '流式'],
    reply:
      '接真实 API 时，可以把 `getMockAIReply` 替换成后端请求。\n\n如果后端支持 SSE 或 ReadableStream，可以先创建一条空的 assistant 消息，再把流式片段逐步追加到 `content`，体验会更接近真实 AI 产品。',
  },
  {
    keywords: ['你好', 'hello', 'hi'],
    reply:
      '你好，我在线。你可以直接抛一个问题，也可以点下方快捷入口，我会按产品化聊天体验来组织回复。',
  },
];

const fallbackReplies = [
  '我理解你的意思。这个问题可以先拆成目标、用户场景和界面反馈三部分，再逐步推进到实现。',
  '可以的。为了让体验更像成熟 AI 产品，我会优先保证布局清晰、状态明确、输入路径足够短。',
  '这套界面很适合后续扩展成真实智能体工作台：左侧承载会话上下文，右侧专注当前对话和引导内容。',
  '从产品角度看，好的聊天页不是只有输入框，还要给用户足够明确的起点和继续追问的路径。',
];

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const getMockAIReply = async (message: string): Promise<string> => {
  const normalizedMessage = message.toLowerCase();
  const matchedRule = replyRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedMessage.includes(keyword.toLowerCase())),
  );

  await wait(760 + Math.random() * 760);

  if (matchedRule) {
    return matchedRule.reply;
  }

  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
};
