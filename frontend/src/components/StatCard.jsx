import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

function parseNumericValue(raw) {
  const str = String(raw);
  const cleaned = str.replace(/,/g, '');
  const num = Number(cleaned.replace(/[^0-9.]/g, ''));
  const suffix = cleaned.includes('%') ? '%' : cleaned.includes('x') ? 'x' : '';
  return { num: Number.isFinite(num) ? num : 0, suffix };
}

export default function StatCard({
  title,
  value,
  change,
  positive = true,
  icon: Icon,
  accent = 'from-[#8b5cf6] via-[#22d3ee] to-[#ec4899]',
}) {
  const parsed = useMemo(() => parseNumericValue(value), [value]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1100;

    const tick = (t) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parsed.num * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [parsed.num]);

  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: parsed.num < 100 ? 1 : 0,
  }).format(count);

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="glass-card glow-border rounded-[24px] p-5 relative overflow-hidden"
    >
      <div className={`absolute inset-0 opacity-25 bg-gradient-to-br ${accent}`} />
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">{title}</p>
          <p className="text-3xl font-black text-white mt-2 neon-text">
            {formatted}
            {parsed.suffix}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${positive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
              <span className="text-base">{positive ? '↑' : '↓'}</span>
              {change}
            </span>
            <span className="text-white/50">vs last period</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.2)]">
          {Icon && <Icon className="w-6 h-6 text-white/80" />}
        </div>
      </div>
      <div className="relative z-10 mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '78%' }}
          transition={{ duration: 0.8 }}
          className={`h-full bg-gradient-to-r ${accent}`}
        />
      </div>
    </motion.div>
  );
}
