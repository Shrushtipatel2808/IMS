import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Bell, ChevronDown, Shield, Settings, LogOut, User, X, Package, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { apiGet } from '../lib/api';

// ─── Dropdown portal wrapper ──────────────────────────────────────────────────
function DropPanel({ anchorRef, open, onClose, children, align = 'right' }) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (open && anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!anchorRef.current?.contains(e.target)) onClose(); };
    setTimeout(() => window.addEventListener('mousedown', close), 0);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  if (!open || !rect) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: rect.bottom + 8,
          ...(align === 'right' ? { right: window.innerWidth - rect.right } : { left: rect.left }),
          zIndex: 9999,
          minWidth: 280,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────
function NotificationsPanel({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/products?limit=5&sort=stock').catch(() => ({ products: [] })),
      apiGet('/deliveries?limit=3').catch(() => ({ deliveries: [] })),
      apiGet('/receipts?limit=3').catch(() => ({ receipts: [] })),
    ]).then(([pData, dData, rData]) => {
      const notes = [];
      (pData.products || []).filter(p => p.stock < 10).forEach(p => {
        notes.push({ icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-500/12 border-amber-400/20', title: 'Low Stock Alert', desc: `${p.name} — only ${p.stock} units left`, time: 'Now' });
      });
      (dData.deliveries || []).slice(0, 2).forEach(d => {
        notes.push({ icon: CheckCircle2, color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-400/18', title: 'Delivery Order', desc: `${d.customerName} · ${d.status}`, time: timeAgo(d.createdAt) });
      });
      (rData.receipts || []).slice(0, 2).forEach(r => {
        notes.push({ icon: Package, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-400/18', title: 'Receipt', desc: `From ${r.supplierName} · ${r.status}`, time: timeAgo(r.createdAt) });
      });
      setItems(notes.slice(0, 8));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ background: 'rgba(8,12,28,0.97)', border: '1.5px solid rgba(99,102,241,0.35)', borderRadius: 20, boxShadow: '0 16px 64px rgba(0,0,0,0.75)', width: 340, overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-300" />
          <span className="text-sm font-bold text-white">Notifications</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/35 hover:text-white transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-white/6">
        {loading ? (
          <div className="py-8 text-center text-white/25 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-white/25 text-sm">No notifications</div>
        ) : items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors">
            <div className={`w-8 h-8 rounded-xl ${item.bg} border flex items-center justify-center shrink-0 mt-0.5`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/80">{item.title}</p>
              <p className="text-xs text-white/40 truncate mt-0.5">{item.desc}</p>
            </div>
            <span className="text-[10px] text-white/25 shrink-0 mt-1">{item.time}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-white/8">
        <button onClick={onClose} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Mark all as read</button>
      </div>
    </div>
  );
}

// ─── Secure Session panel ─────────────────────────────────────────────────────
function SecureSessionPanel({ onClose }) {
  const { token } = useAuth();
  const expiry = (() => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch { return null; }
  })();
  const minutesLeft = expiry ? Math.max(0, Math.floor((expiry - Date.now()) / 60000)) : null;

  return (
    <div style={{ background: 'rgba(8,12,28,0.97)', border: '1.5px solid rgba(34,211,238,0.3)', borderRadius: 20, boxShadow: '0 16px 64px rgba(0,0,0,0.75)', width: 300, overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-bold text-white">Session Security</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/35 hover:text-white transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Status</span>
          <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active & Secure
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Encryption</span>
          <span className="text-xs font-semibold text-cyan-300">JWT / HS256</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Session expires</span>
          <span className="text-xs font-semibold text-white/70 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {minutesLeft != null ? `${minutesLeft >= 60 ? `${Math.floor(minutesLeft / 60)}h ` : ''}${minutesLeft % 60}m` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Expires at</span>
          <span className="text-xs font-mono text-white/45">{expiry ? expiry.toLocaleTimeString() : '—'}</span>
        </div>
        <div className="rounded-xl bg-cyan-500/8 border border-cyan-400/18 px-3 py-2.5 text-xs text-cyan-200/60">
          🔒 All data transmitted over encrypted channels
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState(null); // 'bell' | 'session' | 'user'
  const bellRef = useRef(null);
  const sessionRef = useRef(null);
  const userRef = useRef(null);

  const toggle = (panel) => setOpenPanel((p) => p === panel ? null : panel);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const handleLogout = () => {
    setOpenPanel(null);
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-card rounded-[24px] px-4 sm:px-6 py-3.5 flex items-center gap-4 border border-white/10">
        <div className="hidden md:flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-white/50">InvenFlow</span>
          <div className="h-8 w-[1px] bg-white/10" />
          <span className="text-sm text-white/65">Realtime Ops Center</span>
        </div>

        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              className="w-full input-glass rounded-2xl pl-11 pr-4 py-3 text-sm"
              placeholder="Search products, receipts, deliveries..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bell */}
          <button
            ref={bellRef}
            onClick={() => toggle('bell')}
            className={`relative w-11 h-11 rounded-2xl border flex items-center justify-center transition ${openPanel === 'bell' ? 'bg-violet-500/20 border-violet-400/30 text-violet-300' : 'bg-white/[0.05] border-white/10 text-white/70 hover:text-white hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]'}`}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ec4899]" />
          </button>
          <DropPanel anchorRef={bellRef} open={openPanel === 'bell'} onClose={() => setOpenPanel(null)} align="right">
            <NotificationsPanel onClose={() => setOpenPanel(null)} />
          </DropPanel>

          {/* Secure Session */}
          <button
            ref={sessionRef}
            onClick={() => toggle('session')}
            className={`hidden sm:flex items-center gap-2 rounded-2xl px-3 py-2 text-sm border transition ${openPanel === 'session' ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300' : 'text-white/80 hover:text-white bg-white/[0.04] border-white/10'}`}
          >
            <Shield className={`w-4 h-4 ${openPanel === 'session' ? 'text-cyan-300' : 'text-[#22d3ee]'}`} />
            Secure Session
          </button>
          <DropPanel anchorRef={sessionRef} open={openPanel === 'session'} onClose={() => setOpenPanel(null)} align="right">
            <SecureSessionPanel onClose={() => setOpenPanel(null)} />
          </DropPanel>

          {/* User profile */}
          <div ref={userRef} className="relative">
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => toggle('user')}
              className={`flex items-center gap-2 rounded-2xl px-2 py-2 cursor-pointer border transition ${openPanel === 'user' ? 'bg-violet-500/15 border-violet-400/30' : 'bg-white/[0.04] border-white/10 hover:shadow-[0_0_25px_rgba(139,92,246,0.22)]'}`}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#8b5cf6] flex items-center justify-center font-bold text-sm text-white">
                {initials}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-white/50 capitalize">{user?.role || 'Admin'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${openPanel === 'user' ? 'rotate-180' : ''}`} />
            </motion.div>
          </div>
          <DropPanel anchorRef={userRef} open={openPanel === 'user'} onClose={() => setOpenPanel(null)} align="right">
            <div style={{ background: 'rgba(8,12,28,0.97)', border: '1.5px solid rgba(99,102,241,0.35)', borderRadius: 20, boxShadow: '0 16px 64px rgba(0,0,0,0.75)', width: 240, overflow: 'hidden' }}>
              {/* User info */}
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#22d3ee] to-[#8b5cf6] flex items-center justify-center font-bold text-sm text-white shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-white/40 truncate">{user?.email || ''}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/25 capitalize">{user?.role || 'Admin'}</span>
                  </div>
                </div>
              </div>
              {/* Menu items */}
              <div className="p-2 space-y-0.5">
                <button
                  onClick={() => { setOpenPanel(null); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 text-white/65 hover:text-white text-sm transition-colors text-left"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  onClick={() => { setOpenPanel(null); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 text-white/65 hover:text-white text-sm transition-colors text-left"
                >
                  <User className="w-4 h-4" /> My Profile
                </button>
              </div>
              <div className="p-2 border-t border-white/8">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/15 text-white/55 hover:text-rose-300 text-sm transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </DropPanel>
        </div>
      </div>
    </header>
  );
}
