import { Github, Languages, Search, Sparkles, WandSparkles } from 'lucide-react';

const navItems = [
  { label: '设计' },
  { label: '研发' },
  { label: '组件' },
  { label: 'X Markdown' },
  { label: 'X SDK' },
  { label: 'X Card' },
  { label: 'X Skill', visibility: 'hidden 2xl:inline-flex' },
  { label: '演示' },
  { label: '国内镜像', visibility: 'hidden 2xl:inline-flex' },
];

export const TopNavigation = () => {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-6 z-30 h-16 px-4 sm:px-8 xl:px-12">
      <div className="absolute left-4 top-1 min-w-0 sm:left-8 xl:left-12">
        <p className="text-sm font-semibold text-blue-600 xl:hidden">Ant Design X</p>
        <h1 className="truncate text-2xl font-bold text-slate-950 sm:text-[32px]">独立式</h1>
      </div>

      <div className="pointer-events-auto absolute left-1/2 top-0 hidden -translate-x-1/2 lg:block">
        <div className="flex items-center gap-0.5 rounded-full bg-white/92 px-4 py-3 shadow-[0_22px_64px_rgba(15,23,42,0.14)] ring-1 ring-slate-100 backdrop-blur-xl xl:gap-1 xl:px-5">
          <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`${item.visibility ?? 'inline-flex'} h-8 shrink-0 items-center whitespace-nowrap rounded-full px-2 text-sm ${
                item.label === '演示'
                  ? 'font-bold text-slate-950'
                  : 'font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950'
              } xl:px-3`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-1 flex shrink-0 items-center gap-2 rounded-full bg-white/80 px-2 py-1 shadow-sm ring-1 ring-slate-100 backdrop-blur sm:right-8 lg:bg-transparent lg:shadow-none lg:ring-0 xl:right-12">
        <span className="hidden px-2 text-sm font-semibold text-slate-800 sm:inline">2.8.0</span>
        <button
          type="button"
          title="语言"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-blue-600"
        >
          <Languages className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="主题"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-blue-600"
        >
          <WandSparkles className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="GitHub"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-blue-600 sm:flex"
        >
          <Github className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100 transition hover:text-blue-600"
        >
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>
    </header>
  );
};
