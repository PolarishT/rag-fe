import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const typingDots = [0, 1, 2];

export const AgentTypingStatus = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex items-center gap-2 px-1 text-sm font-bold text-slate-500"
      role="status"
      aria-live="polite"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-violet-300 shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <span>Agent 正在 typing</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {typingDots.map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-blue-400"
            animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: dot * 0.16,
              ease: 'easeInOut',
            }}
          />
        ))}
      </span>
    </motion.div>
  );
};
