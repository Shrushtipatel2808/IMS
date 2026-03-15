import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', hover = false, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      className={`glass-card glow-border rounded-[24px] ${className}`}
    >
      {children}
    </motion.div>
  );
}
