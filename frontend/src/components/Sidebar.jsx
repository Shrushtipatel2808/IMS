import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownCircle,
  Send,
  BarChart3,
  Settings,
  Sparkles,
  Building2,
  ArrowRightLeft,
  SlidersHorizontal,
  ScrollText,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Products', icon: Boxes, to: '/products' },
  { label: 'Receipts', icon: ArrowDownCircle, to: '/receipts' },
  { label: 'Deliveries', icon: Send, to: '/deliveries' },
  { label: 'Transfers', icon: ArrowRightLeft, to: '/transfers' },
  { label: 'Adjustments', icon: SlidersHorizontal, to: '/adjustments' },
  { label: 'Warehouses', icon: Building2, to: '/warehouses' },
  { label: 'Stock Ledger', icon: ScrollText, to: '/ledger' },
  { label: 'Analytics', icon: BarChart3, to: '/analytics' },
  { label: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar() {
  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="hidden lg:flex w-[270px] shrink-0 p-4"
    >
      <div className="glass-card rounded-[24px] p-4 h-full flex flex-col">
        <div className="relative overflow-hidden rounded-[20px] p-4 border border-white/10 bg-white/[0.03]">
          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-[#8b5cf6]/35 blur-2xl" />
          <div className="absolute -left-6 -bottom-6 h-16 w-16 rounded-full bg-[#22d3ee]/25 blur-2xl" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#22d3ee] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/35 pulse-neon">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">InvenFlow</p>
              <p className="text-lg font-black text-white neon-text">Neon Ops</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.02] p-2.5 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-2xl transition-all relative overflow-hidden group ${
                    isActive
                      ? 'text-white bg-white/5'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-line"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#22d3ee]"
                      />
                    )}
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#22d3ee]' : 'text-white/55 group-hover:text-[#8b5cf6]'}`} />
                    <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-glow"
                        className="absolute inset-0 rounded-2xl border border-[#8b5cf6]/45"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[20px] border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22d3ee]/30 to-[#8b5cf6]/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#22d3ee]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Workspace Quantum+</p>
              <p className="text-xs text-white/55">Premium automations enabled</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            Upgrade Workspace
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
