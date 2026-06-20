import { ArrowUpRight, BookOpen, Heart, MessageCircle, Smile, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export interface HotTopicItem {
  id: string;
  label: string;
  prompt: string;
}

interface EmptyStateProps {
  hotTopics: HotTopicItem[];
  onSelectPrompt: (prompt: string) => void;
}

const guideCards = [
  {
    icon: Heart,
    title: '意图',
    description: 'AI理解用户需求并提供解决方案',
  },
  {
    icon: Smile,
    title: '角色',
    description: 'AI的公众形象',
  },
  {
    icon: MessageCircle,
    title: '对话',
    description: 'AI如何以用户理解的方式表达自己',
  },
  {
    icon: BookOpen,
    title: '界面',
    description: 'AI平衡“聊天”和“执行”行为',
  },
];

export const EmptyState = ({ hotTopics, onSelectPrompt }: EmptyStateProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-[900px] flex-1 flex-col justify-center px-5 pb-44 pt-10 sm:px-9"
    >
      <div className="mb-11 max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-[0_10px_28px_rgba(37,99,235,0.2)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide text-blue-600">AGI TECH ASSISTANT</span>
        </div>

        <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl xl:text-[42px]">
          你好，我是 Agents Design X
        </h2>
        <p className="mt-4 max-w-xl text-base font-normal leading-7 text-slate-400 sm:text-lg">
          Polaris 设计的 AGI 产品解决方案。告诉我你想了解或构建什么，我们一起开始。
        </p>
      </div>

      <div className="grid gap-x-7 gap-y-9 border-t border-slate-200/70 pt-8 md:grid-cols-[0.95fr_1.05fr]">
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">热门话题</h3>
            <span className="text-xs text-slate-400">快速开始</span>
          </div>
          <ul className="space-y-1">
            {hotTopics.map((topic, index) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => onSelectPrompt(topic.prompt)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-200/55 bg-white/85 px-3 py-2.5 text-left text-sm font-medium text-slate-600 shadow-[0_3px_12px_rgba(15,23,42,0.025)] transition hover:-translate-y-px hover:border-blue-100 hover:bg-white hover:text-slate-950 hover:shadow-[0_7px_20px_rgba(15,23,42,0.06)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{topic.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">构建指南</h3>
            <span className="text-xs text-slate-400">RICH 模型</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {guideCards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onSelectPrompt(`${card.title}：${card.description}`)}
                  className="group flex min-h-24 w-full items-start gap-3 rounded-2xl border border-slate-200/65 bg-white/80 p-4 text-left shadow-[0_4px_16px_rgba(15,23,42,0.025)] transition hover:border-blue-100 hover:bg-white hover:shadow-[0_8px_22px_rgba(15,23,42,0.055)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-600" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">{card.title}</span>
                    <span className="mt-1.5 block text-xs font-normal leading-5 text-slate-400">
                      {card.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </motion.section>
  );
};
