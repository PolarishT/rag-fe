interface BrandMarkProps {
  size?: 'sm' | 'md';
}

export const BrandMark = ({ size = 'md' }: BrandMarkProps) => {
  const markSize = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  return (
    <div className={`${markSize} relative shrink-0`}>
      <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 rotate-45 rounded-full bg-cyan-400" />
      <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 -rotate-45 rounded-full bg-violet-400" />
    </div>
  );
};
