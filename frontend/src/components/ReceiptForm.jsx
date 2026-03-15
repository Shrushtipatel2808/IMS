import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownCircle, Package, User, Hash, Check, AlertCircle } from 'lucide-react';
import { apiGet, apiPost } from '../lib/api';

export default function ReceiptForm({ onCreated }) {
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/products?limit=100')
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!supplier || !productId || !quantity) return;
    setError('');
    try {
      await apiPost('/receipts', {
        supplierName: supplier,
        products: [{ productId, quantity: Number(quantity) }],
      });
      setSubmitted(true);
      if (onCreated) onCreated();
      setTimeout(() => {
        setSubmitted(false);
        setSupplier('');
        setProductId('');
        setQuantity('');
      }, 2200);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card glow-border rounded-[24px] p-6 space-y-6"
    >
      <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#22d3ee]/30 to-[#8b5cf6]/25 flex items-center justify-center border border-[#22d3ee]/35">
            <ArrowDownCircle className="w-6 h-6 text-[#22d3ee]" />
          </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Incoming</p>
          <p className="text-xl font-bold text-white">Create Receipt</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Supplier Name"
          icon={User}
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Acme Supplies Ltd."
        />
        <SelectField
          label="Product"
          icon={Package}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          options={products.map((p) => ({ value: p._id, label: `${p.name} (${p.sku})` }))}
        />
        <Field
          label="Quantity"
          icon={Hash}
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-400/30 px-4 py-3 text-rose-100 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
               className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#22d3ee]/20 text-[#22d3ee] font-semibold"
             >
              <Check className="w-5 h-5" /> Receipt saved
            </motion.div>
          ) : (
            <motion.button
              key="submit"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary rounded-2xl w-full py-4 text-sm font-semibold"
              type="submit"
            >
              Add Receipt
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}

function Field({ label, icon: Icon, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white/70 flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/50" />
        {label}
      </span>
      <input
        className="input-glass rounded-2xl px-4 py-3 w-full text-sm"
        {...props}
      />
    </label>
  );
}

function SelectField({ label, icon: Icon, options, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-white/70 flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/50" />
        {label}
      </span>
      <select
        className="input-glass rounded-2xl px-4 py-3 w-full text-sm appearance-none"
        {...props}
      >
        <option value="">Select a product</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}
