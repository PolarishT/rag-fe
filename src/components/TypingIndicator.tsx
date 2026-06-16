import { Bubble } from '@ant-design/x';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const dotClassName = 'h-2 w-2 rounded-full bg-slate-400';

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-[90%] sm:max-w-[78%]"
    >
      <Bubble
        placement="start"
        variant="borderless"
        avatar={
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-violet-300 shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
        }
        content={
          <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-soft">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className={dotClassName}
                animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  delay: index * 0.16,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        }
      />
    </motion.div>
  );
};
