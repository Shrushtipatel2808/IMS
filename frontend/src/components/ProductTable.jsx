import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Package, Edit2, Trash2 } from 'lucide-react';
import { apiGet, apiDelete } from '../lib/api';

const getStatus = (stock) => {
  if (stock === 0) return 'Critical';
  if (stock <= 20) return 'Low Stock';
  return 'In Stock';
};

const statusStyles = {
  'In Stock': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Low Stock': { bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-400' },
  'Critical': { bg: 'bg-rose-500/15', text: 'text-rose-300', dot: 'bg-rose-400' },
};

export default function ProductTable({ onEdit, refreshKey = 0 }) {
  const [inventory, setInventory] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const fetchProducts = () => {
    apiGet('/products?limit=100')
      .then((data) => {
        const products = data.products || [];
        setInventory(
          products.map((p) => ({
            id: p._id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            unit: p.unit,
            stock: p.stock,
            capacity: Math.max(p.stock * 1.5, 100),
            status: getStatus(p.stock),
          }))
        );
      })
      .catch(() => {});
  };

  useEffect(() => { fetchProducts(); }, [refreshKey]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiDelete(`/products/${id}`);
      setInventory((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const categories = useMemo(() => {
    const cats = [...new Set(inventory.map((i) => i.category))];
    return ['All', ...cats];
  }, [inventory]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchesCategory = category === 'All' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [query, category, inventory]);

  return (
    <div className="glass-card glow-border rounded-[24px] overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/25 to-indigo-500/25 flex items-center justify-center border border-purple-400/30">
              <Package className="w-6 h-6 text-purple-200" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Inventory</p>
              <p className="text-xl font-bold text-white">Product Table</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products or SKU..."
                className="input-glass rounded-2xl pl-11 pr-4 py-3 text-sm w-64"
              />
            </div>
            <button className="glass-card rounded-2xl px-4 py-3 text-sm text-white/70 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all ${
                category === cat
                  ? 'bg-gradient-to-r from-[#8b5cf6]/45 to-[#22d3ee]/25 text-white shadow-lg shadow-[#8b5cf6]/20'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.12em] text-white/50 border-b border-white/10">
              {['Product', 'SKU', 'Category', 'Stock', 'Status', ''].map((h) => (
                <th key={h} className="px-4 sm:px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((item, idx) => {
                const pct = Math.round((item.stock / item.capacity) * 100);
                const style = statusStyles[item.status];
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/[0.04] transition"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-200" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-white/50">Capacity {item.capacity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm font-mono bg-white/5 px-2 py-1 rounded-lg text-white/70">{item.sku}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="text-sm text-white/70">{item.category}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                        <span className="font-semibold">{item.stock}</span>
                        <span className="text-white/40">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: idx * 0.05 }}
                          className={`h-full rounded-full bg-gradient-to-r ${
                            item.status === 'Critical'
                              ? 'from-rose-500 to-red-400'
                              : item.status === 'Low Stock'
                              ? 'from-amber-400 to-yellow-300'
                              : 'from-emerald-400 to-cyan-400'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end text-white/40">
                        <button onClick={() => onEdit && onEdit(item)} className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-rose-200 flex items-center justify-center">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-white/50">No products found.</div>
      )}
    </div>
  );
}
