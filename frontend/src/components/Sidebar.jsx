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
        <div className="relative overflow-hidden rounded-[20px] p-4 border border-white/[0.08] bg-gradient-to-br from-[#6366f1]/15 to-[#8b5cf6]/10">
          <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#6366f1]/30 blur-2xl" />
          <div className="absolute -left-4 -bottom-4 h-12 w-12 rounded-full bg-[#22d3ee]/20 blur-2xl" />

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#6366f1]/40 pulse-neon">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-semibold">InvenFlow</p>
              <p className="text-lg font-black text-white neon-text">CoreInventory</p>
            </div>
          </div>
        </div>

        <nav className="mt-4 rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all relative overflow-hidden group ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/15'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-line"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-gradient-to-b from-[#6366f1] to-[#8b5cf6]"
                      />
                    )}
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-[#a5b4fc]' : 'text-white/40 group-hover:text-[#a5b4fc]'}`} />
                    <span className="text-sm font-medium tracking-wide">{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-glow"
                        className="absolute inset-0 rounded-2xl border border-[#6366f1]/30"
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#a5b4fc]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Workspace Pro</p>
              <p className="text-xs text-white/45">All features enabled</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full btn-primary rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Upgrade Plan
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
