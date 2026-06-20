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
    <div className="flex flex-wrap justify-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            key={action.label}
            type="button"
            onClick={() => onSelectPrompt(action.prompt)}
            className="flex h-10 items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 text-sm font-medium text-slate-500 shadow-[0_4px_14px_rgba(15,23,42,0.055)] transition hover:border-blue-200 hover:bg-white hover:text-blue-600 hover:shadow-[0_6px_18px_rgba(37,99,235,0.09)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
