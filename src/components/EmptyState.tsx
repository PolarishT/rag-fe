import { BookOpen, Heart, MessageCircle, MoreHorizontal, Share2, Smile, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const hotTopics = [
  'Ant Design X 中有哪些组件?',
  '新的 AGI 混合界面',
  'Ant Design X 中有哪些组件?',
  '快来发现 AI 时代的新设计范式。',
  '如何快速安装和导入组件?',
];

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

export const EmptyState = ({ onSelectPrompt }: EmptyStateProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-8 sm:px-9 xl:px-12"
    >
      <div className="mb-10 flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-950 shadow-[0_16px_40px_rgba(15,23,42,0.16)] ring-4 ring-blue-50">
            <Sparkles className="h-8 w-8 text-violet-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-balance text-3xl font-black tracking-normal text-slate-950 xl:text-4xl">
              你好，我是 Ant Design X
            </h2>
            <p className="mt-5 text-lg font-bold leading-8 text-slate-500 xl:text-xl">
              基于蚂蚁设计，AGI 产品界面解决方案，打造更好的智能视觉~~
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <button
            type="button"
            title="分享"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="更多"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="min-h-[340px] rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-7">
          <h3 className="mb-7 text-xl font-black text-slate-950">热门话题</h3>
          <div className="space-y-5">
            {hotTopics.map((topic, index) => (
              <button
                key={`${topic}-${index}`}
                type="button"
                onClick={() => onSelectPrompt(topic)}
                className="flex w-full items-center gap-5 rounded-lg text-left text-base font-bold text-slate-700 transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span
                  className={
                    index < 3
                      ? 'w-5 shrink-0 text-xl font-black text-orange-500'
                      : 'w-5 shrink-0 text-xl font-black text-slate-300'
                  }
                >
                  {index + 1}
                </span>
                <span className="truncate">{topic}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="min-h-[340px] rounded-lg bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-7">
          <h3 className="mb-7 text-xl font-black text-slate-950">设计指南</h3>
          <div className="space-y-6">
            {guideCards.map((card) => {
              const Icon = card.icon;

              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => onSelectPrompt(`${card.title}：${card.description}`)}
                  className="flex min-h-16 w-full items-start gap-5 rounded-lg text-left transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                  <span className="min-w-0">
                    <span className="block text-base font-black text-slate-800">{card.title}</span>
                    <span className="mt-2 block text-base font-semibold leading-7 text-slate-500">{card.description}</span>
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
