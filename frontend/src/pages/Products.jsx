import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Boxes, Plus, Download, Filter, X, Loader2, CheckCircle2, Package } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ProductTable from '../components/ProductTable';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost, apiPut, apiGet } from '../lib/api';

const CATEGORIES = ['Electronics','Furniture','Clothing','Food & Beverage','Raw Materials','Office Supplies','Tools','Other'];
const UNITS = ['pcs','kg','litre','box','pack','metre','unit'];
const emptyForm = { name: '', sku: '', category: 'Electronics', unit: 'pcs', stock: 0 };

// ─── Autocomplete field ───────────────────────────────────────────────────────
function AutocompleteInput({ value, onChange, onSelect, suggestions, placeholder, className = '', uppercase = false }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
  ).slice(0, 20);

  const updateRect = () => {
    if (inputRef.current) setRect(inputRef.current.getBoundingClientRect());
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        listRef.current && !listRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, []);

  const dropdown = open && filtered.length > 0 && rect && createPortal(
    <ul
      ref={listRef}
      style={{
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
        maxHeight: '260px',
        background: 'rgba(8, 12, 28, 0.97)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.12)',
        overflowY: 'auto',
      }}
    >
      {filtered.map((s, i) => (
        <li key={s} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false); }}
            style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '14px', color: 'rgba(238,242,255,0.85)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.background = 'rgba(139,92,246,0.18)'}
            onMouseLeave={e => e.target.style.background = 'transparent'}
          >
            {uppercase ? s.toUpperCase() : s}
          </button>
        </li>
      ))}
    </ul>,
    document.body
  );

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e); updateRect(); setOpen(true); }}
        onFocus={() => { updateRect(); setOpen(true); }}
        placeholder={placeholder}
        className={`input-glass w-full rounded-2xl px-4 py-3 text-sm ${uppercase ? 'uppercase' : ''} ${className}`}
      />
      {dropdown}
    </div>
  );
}

export default function Products() {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // fetch all products for autocomplete suggestions
  useEffect(() => {
    apiGet('/products?limit=10000').then(d => setAllProducts(d.products || [])).catch(() => {});
  }, [refreshKey]);

  const nameSuggestions = [...new Set(allProducts.map(p => p.name))];
  const skuSuggestions = [...new Set(allProducts.map(p => p.sku))];

  const openAdd = () => { setForm(emptyForm); setError(''); setModal({ mode: 'add' }); };
  const openEdit = (product) => {
    setForm({ name: product.name, sku: product.sku, category: product.category, unit: product.unit || 'pcs', stock: product.stock });
    setError('');
    setModal({ mode: 'edit', product });
  };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) { setError('Name and SKU are required.'); return; }
    if (modal.mode === 'add' && allProducts.some(p => p.sku.toUpperCase() === form.sku.toUpperCase())) {
      setError(`SKU "${form.sku.toUpperCase()}" already exists. Please use a unique SKU.`); return;
    }
    setSaving(true); setError('');
    try {
      if (modal.mode === 'add') {
        const res = await apiPost('/products', form);
        const added = res.product || { ...form, _id: Date.now() };
        setRecentlyAdded(prev => [added, ...prev].slice(0, 10));
      } else {
        await apiPut(`/products/${modal.product.id}`, form);
      }
      closeModal();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await apiGet('/products?limit=10000');
      const products = data.products || [];
      const header = ['Name','SKU','Category','Unit','Stock'];
      const rows = products.map((p) => [p.name, p.sku, p.category, p.unit, p.stock].join(','));
      const csv = [header.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed: ' + e.message); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <PageTransition>
      <div className="glass-card glow-border rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white/60">
            <Boxes className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Catalog</span>
          </div>
          <h2 className="text-3xl font-black text-white mt-1 neon-text">Products</h2>
          <p className="text-white/60">Manage and monitor your SKUs</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActionBtn icon={Filter} label="Filters" />
          <ActionBtn icon={Download} label="Export" onClick={handleExport} />
          <ActionBtn icon={Plus} label="Add Product" primary onClick={openAdd} />
        </div>
      </div>

      {/* Recently Added Products */}
      <AnimatePresence>
        {recentlyAdded.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-[24px] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Recently Added ({recentlyAdded.length})</span>
              </div>
              <button onClick={() => setRecentlyAdded([])} className="text-xs text-white/30 hover:text-white/60 transition-colors">Clear</button>
            </div>
            <div className="space-y-2">
              {recentlyAdded.map((p, i) => (
                <motion.div
                  key={p._id || i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <Package className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <p className="text-xs text-white/40">{p.sku} · {p.category} · Stock: {p.stock}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold shrink-0">Added ✓</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductTable onEdit={openEdit} refreshKey={refreshKey} />

      {/* Add / Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {modal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && closeModal()}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="glass-card glow-border rounded-[24px] p-6 w-full max-w-md space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{modal.mode === 'add' ? 'Add Product' : 'Edit Product'}</h3>
                  <button onClick={closeModal} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Product Name with autocomplete — in Add mode, only fills category/unit, not SKU */}
                  <AutocompleteInput
                    value={form.name}
                    placeholder="Product Name *"
                    suggestions={nameSuggestions}
                    onChange={set('name')}
                    onSelect={name => {
                      const found = allProducts.find(p => p.name === name);
                      setForm(f => ({
                        ...f,
                        name,
                        // in Edit mode auto-fill SKU too; in Add mode leave SKU for user to enter
                        ...(found && modal.mode === 'edit' ? { sku: found.sku } : {}),
                        ...(found ? { category: found.category, unit: found.unit || 'pcs' } : {}),
                      }));
                    }}
                  />

                  {/* SKU with autocomplete — only suggest in Edit mode; Add mode shows hint only */}
                  <AutocompleteInput
                    value={form.sku}
                    placeholder="SKU (e.g. STL-001) *"
                    suggestions={modal.mode === 'edit' ? skuSuggestions : []}
                    uppercase
                    onChange={set('sku')}
                    onSelect={sku => {
                      const found = allProducts.find(p => p.sku === sku);
                      setForm(f => ({ ...f, sku, ...(found ? { name: found.name, category: found.category, unit: found.unit || 'pcs' } : {}) }));
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.category} onChange={set('category')} className="input-glass w-full rounded-2xl px-4 py-3 text-sm bg-transparent text-white">
                      {CATEGORIES.map((c) => (
                        <option className="bg-[#0f172a] text-white" key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select value={form.unit} onChange={set('unit')} className="input-glass w-full rounded-2xl px-4 py-3 text-sm bg-transparent text-white">
                      {UNITS.map((u) => (
                        <option className="bg-[#0f172a] text-white" key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <input type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="Initial Stock" className="input-glass w-full rounded-2xl px-4 py-3 text-sm" />
                  {/* Live duplicate SKU warning in Add mode */}
                  {modal.mode === 'add' && form.sku && allProducts.some(p => p.sku.toUpperCase() === form.sku.toUpperCase()) && (
                    <p className="text-amber-400 text-xs flex items-center gap-1.5">
                      ⚠ SKU "{form.sku.toUpperCase()}" already exists — please use a different SKU.
                    </p>
                  )}
                </div>

                {error && <p className="text-rose-400 text-sm">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 text-sm font-semibold">Cancel</button>
                  <button
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 rounded-2xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {modal.mode === 'add' ? 'Add Product' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageTransition>
  );
}

function ActionBtn({ icon: Icon, label, primary, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${
        primary
          ? 'btn-primary shadow-lg shadow-purple-500/30'
          : 'bg-white/[0.05] border border-white/10 text-white/80'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );
}
