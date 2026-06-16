import { BrandMark } from './BrandMark';

const navGroups = [
  {
    title: '模型样板间',
    items: [
      { label: '现代感', active: false },
      { label: '独立式', active: true },
      { label: '助手式', active: false },
    ],
  },
  {
    title: '智能体样板间',
    items: [{ label: '百宝箱', active: false }],
  },
];

export const ShowcaseSidebar = () => {
  return (
    <aside className="hidden h-full w-[280px] shrink-0 overflow-y-auto border-r border-slate-100 bg-white px-7 py-9 xl:block">
      <div className="mb-11 flex items-center gap-3">
        <BrandMark />
        <span className="text-xl font-semibold text-slate-950">Ant Design X</span>
      </div>

      <nav className="space-y-8">
        {navGroups.map((group) => (
          <section key={group.title}>
            <h2 className="border-b border-slate-100 pb-4 text-sm font-medium text-slate-400">
              {group.title}
            </h2>
            <div className="mt-4 space-y-2">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={
                    item.active
                      ? 'flex h-12 w-full items-center rounded-lg bg-blue-50 px-5 text-left text-sm font-semibold text-blue-600'
                      : 'flex h-12 w-full items-center rounded-lg px-5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-blue-600'
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
};
