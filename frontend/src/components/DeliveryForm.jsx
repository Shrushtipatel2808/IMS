import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Package, AlertTriangle, Check, AlertCircle, Plus, Trash2, Zap, Clock, Search, ChevronDown } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

// ─── Custom dark-themed searchable product dropdown ───────────────────────────
function ProductDropdown({ products, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = products.find((p) => p._id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
      .slice(0, 25);
  }, [products, query]);

  const openDropdown = () => {
    if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
    };
    const close = (e) => {
      if (!triggerRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    setTimeout(() => window.addEventListener('mousedown', close), 0);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('mousedown', close);
    };
  }, [open]);

  const select = (p) => { onChange(p._id); setOpen(false); };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={openDropdown}
        className="input-glass rounded-2xl px-4 py-3 w-full text-sm text-left flex items-center justify-between gap-2"
      >
        <span className={selected ? 'text-white truncate' : 'text-white/30'}>
          {selected ? `${selected.sku} — ${selected.name}` : 'Search and select product…'}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: rect.bottom + 6, left: rect.left,
            width: rect.width, zIndex: 9999,
            background: 'rgba(8,12,28,0.98)',
            border: '1.5px solid rgba(99,102,241,0.45)',
            borderRadius: 16,
            boxShadow: '0 12px 48px rgba(0,0,0,0.75), 0 0 0 1px rgba(99,102,241,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Search bar */}
          <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '7px 12px' }}>
              <Search style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or SKU…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 12.5 }}
              />
            </div>
          </div>
          {/* Options */}
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No products found</div>
            ) : filtered.map((p) => (
              <div
                key={p._id}
                onMouseDown={() => select(p)}
                style={{
                  padding: '9px 14px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: p._id === value ? 'rgba(139,92,246,0.22)' : 'transparent',
                  borderLeft: p._id === value ? '3px solid rgba(139,92,246,0.7)' : '3px solid transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { if (p._id !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={(e) => { if (p._id !== value) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginLeft: 8, fontFamily: 'monospace' }}>{p.sku}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, flexShrink: 0, marginLeft: 8,
                  background: p.stock === 0 ? 'rgba(239,68,68,0.25)' : p.stock < 10 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.15)',
                  color: p.stock === 0 ? '#fca5a5' : p.stock < 10 ? '#fcd34d' : '#86efac',
                  border: `1px solid ${p.stock === 0 ? 'rgba(239,68,68,0.4)' : p.stock < 10 ? 'rgba(245,158,11,0.35)' : 'rgba(34,197,94,0.3)'}`,
                }}>
                  {p.stock} in stock
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const PRIORITIES = [
  { value: 'Normal', label: 'Normal', cls: 'bg-white/8 text-white/55 border-white/12' },
  { value: 'Urgent', label: '⚡ Urgent', cls: 'bg-amber-500/20 text-amber-200 border-amber-400/30' },
  { value: 'Express', label: '🚀 Express', cls: 'bg-violet-500/20 text-violet-200 border-violet-400/30' },
];

export default function DeliveryForm({ onCreated }) {
  const [allProducts, setAllProducts] = useState([]);
  const [customer, setCustomer] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ productId: '', quantity: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/products?limit=1000').then((d) => setAllProducts(d.products || [])).catch(() => {});
  }, []);

  const productMap = useMemo(() => new Map(allProducts.map((p) => [p._id, p])), [allProducts]);

  const addLine = () => setLines((l) => [...l, { productId: '', quantity: '' }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLines((l) => l.map((line, idx) => idx === i ? { ...line, [field]: val } : line));

  const stockImpact = useMemo(() =>
    lines.map((line) => {
      const p = productMap.get(line.productId);
      const qty = Number(line.quantity) || 0;
      return p ? { name: p.name, sku: p.sku, current: p.stock, after: p.stock - qty, qty, insufficient: qty > 0 && qty > p.stock } : null;
    }).filter(Boolean),
    [lines, productMap]
  );

  const hasInsufficient = stockImpact.some((s) => s.insufficient);
  const validLines = lines.filter((l) => l.productId && Number(l.quantity) > 0);
  const canSubmit = customer.trim() && validLines.length > 0 && !hasInsufficient;

  const submit = async (saveAsDraft = false) => {
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    try {
      await apiPost('/deliveries', {
        customerName: customer.trim(),
        products: validLines.map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })),
        status: saveAsDraft ? 'Draft' : 'Done',
        priority,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
      });
      setSubmitted(true);
      onCreated?.();
      setTimeout(() => {
        setSubmitted(false);
        setCustomer(''); setPriority('Normal'); setExpectedDate(''); setNotes('');
        setLines([{ productId: '', quantity: '' }]);
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card glow-border rounded-[24px] p-8 flex flex-col items-center gap-4 text-center min-h-[300px] justify-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
          <Check className="w-8 h-8 text-emerald-300" />
        </div>
        <p className="text-lg font-bold text-white">Delivery Created!</p>
        <p className="text-sm text-white/50">The delivery order has been saved.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glow-border rounded-[24px] p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8b5cf6]/30 to-[#22d3ee]/20 flex items-center justify-center border border-[#8b5cf6]/30">
          <Send className="w-5 h-5 text-[#22d3ee]" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Outgoing</p>
          <p className="text-lg font-bold text-white">New Delivery Order</p>
        </div>
      </div>

      {/* Customer */}
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-white/65 flex items-center gap-2">
          <User className="w-4 h-4 text-white/40" /> Customer Name
        </span>
        <input
          className="input-glass rounded-2xl px-4 py-3 w-full text-sm"
          placeholder="e.g. TechCorp Inc."
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
      </label>

      {/* Priority */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-white/65 flex items-center gap-2">
          <Zap className="w-4 h-4 text-white/40" /> Priority
        </span>
        <div className="flex gap-2 flex-wrap">
          {PRIORITIES.map((opt) => (
            <button
              key={opt.value} type="button"
              onClick={() => setPriority(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${priority === opt.value ? opt.cls : 'bg-white/5 text-white/25 border-white/8 hover:text-white/50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product lines */}
      <div className="space-y-2">
        <span className="text-sm font-semibold text-white/65 flex items-center gap-2">
          <Package className="w-4 h-4 text-white/40" /> Products
        </span>
        <div className="space-y-2.5">
          {lines.map((line, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <ProductDropdown
                  products={allProducts}
                  value={line.productId}
                  onChange={(v) => updateLine(i, 'productId', v)}
                />
              </div>
              <input
                type="number" min="1" placeholder="Qty"
                value={line.quantity}
                onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                className="input-glass rounded-xl px-3 py-3 text-sm w-20 shrink-0"
              />
              {lines.length > 1 && (
                <button
                  type="button" onClick={() => removeLine(i)}
                  className="w-9 h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/22 border border-rose-400/20 flex items-center justify-center text-rose-300/60 hover:text-rose-300 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button" onClick={addLine}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-violet-300 transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add another product
        </button>
      </div>

      {/* Stock Impact Preview */}
      <AnimatePresence>
        {stockImpact.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/8 bg-white/3 divide-y divide-white/5">
              <div className="px-4 py-2 text-xs text-white/35 font-semibold uppercase tracking-wider">Stock Impact Preview</div>
              {stockImpact.map((s, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-white/55 truncate">{s.name} <span className="text-white/25 font-mono">{s.sku}</span></span>
                  <span className={`font-semibold tabular-nums ${s.insufficient ? 'text-rose-300' : s.after < 10 ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {s.current} → {s.after < 0 ? <span className="text-rose-400">{s.after}</span> : s.after}
                    {s.insufficient && ' ⚠️'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date & Notes */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white/35" /> Expected Date
          </span>
          <input
            type="date"
            className="input-glass rounded-2xl px-3 py-2.5 w-full text-sm"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-white/50">Notes</span>
          <input
            className="input-glass rounded-2xl px-3 py-2.5 w-full text-sm"
            placeholder="Optional note…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
      </div>

      {/* Errors */}
      <AnimatePresence>
        {(error || hasInsufficient) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-400/30 px-4 py-3 text-rose-100 text-sm">
              {hasInsufficient ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {error || 'Insufficient stock for one or more products'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button" onClick={() => submit(true)}
          disabled={!canSubmit || submitting}
          className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white/55 hover:text-white transition disabled:opacity-35 disabled:cursor-not-allowed"
        >
          Save Draft
        </button>
        <motion.button
          type="button"
          whileHover={canSubmit && !submitting ? { scale: 1.02, y: -1 } : {}}
          whileTap={canSubmit && !submitting ? { scale: 0.98 } : {}}
          onClick={() => submit(false)}
          disabled={!canSubmit || submitting}
          className="flex-[2] py-3.5 rounded-2xl text-sm font-semibold btn-primary disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
            : <><Send className="w-4 h-4" /> Validate &amp; Dispatch</>}
        </motion.button>
      </div>
    </motion.div>
  );
}

