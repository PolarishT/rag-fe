import { Boxes, LayoutGrid, Rocket, ScrollText } from 'lucide-react';

interface QuickActionsProps {
  onSelectPrompt: (prompt: string) => void;
}

const actions = [
  { label: '升级', icon: Rocket, prompt: '介绍一下 Ant Design X 的升级亮点' },
  { label: '组件', icon: LayoutGrid, prompt: 'Ant Design X 中有哪些组件?' },
  { label: 'RICH 指南', icon: ScrollText, prompt: '解释一下 RICH 设计指南' },
  { label: '安装介绍', icon: Boxes, prompt: '如何快速安装和导入组件?' },
];

export const QuickActions = ({ onSelectPrompt }: QuickActionsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.label}
            type="button"
            onClick={() => onSelectPrompt(action.prompt)}
            className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-base font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon className="h-5 w-5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
