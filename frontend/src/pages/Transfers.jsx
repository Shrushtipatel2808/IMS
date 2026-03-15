import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Boxes,
  BrainCircuit,
  Gauge,
  ShieldAlert,
  SendHorizonal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { apiGet, apiPost } from '../lib/api';
import heroImage from '../assets/hero.png';

export default function Transfers() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [thresholds, setThresholds] = useState({ low: 20, high: 120 });
  const [loadingRec, setLoadingRec] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: 1,
    fromWarehouse: '',
    toWarehouse: '',
    note: '',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [impactPreview, setImpactPreview] = useState(null);
  const [risk, setRisk] = useState({ level: 'LOW', message: 'Low risk transfer.' });

  const loadBase = async () => {
    setLoadingRec(true);
    setErr('');
    const [prodRes, recRes, recentRes, warehousesRes] = await Promise.allSettled([
      apiGet('/products?limit=200'),
      apiGet('/transfers/recommendations'),
      apiGet('/transfers/recent?limit=15'),
      apiGet('/warehouses'),
    ]);

    if (prodRes.status === 'fulfilled') {
      setProducts(prodRes.value.products || []);
    } else {
      setProducts([]);
      setErr('Failed to load products');
    }

    if (recRes.status === 'fulfilled') {
      const rec = recRes.value || {};
      setRecommendations(rec.recommendations || []);
      setWarehouseStock(rec.warehouseStock || []);
      setThresholds(rec.thresholds || { low: 20, high: 120 });
    } else {
      setRecommendations([]);
      setThresholds({ low: 20, high: 120 });

      // Fallback: keep dropdown options usable even if intelligence API fails
      if (warehousesRes.status === 'fulfilled') {
        const fallbackWarehouses = (warehousesRes.value.warehouses || []).map((w) => ({
          warehouseId: w._id,
          name: w.name,
          location: w.location,
          totalStock: 0,
          zone: 'MEDIUM',
        }));
        setWarehouseStock(fallbackWarehouses);
      } else {
        setWarehouseStock([]);
      }

      setErr('Transfer intelligence is temporarily unavailable, but form options are loaded.');
    }

    if (recentRes.status === 'fulfilled') {
      setRecentTransfers(recentRes.value.transfers || []);
    } else {
      setRecentTransfers([]);
    }

    setLoadingRec(false);
  };

  useEffect(() => {
    loadBase();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const selectedProduct = useMemo(
    () => products.find((p) => p._id === form.productId) || null,
    [products, form.productId]
  );

  const fromWh = useMemo(
    () => warehouseStock.find((w) => String(w.warehouseId) === String(form.fromWarehouse)) || null,
    [warehouseStock, form.fromWarehouse]
  );

  const toWh = useMemo(
    () => warehouseStock.find((w) => String(w.warehouseId) === String(form.toWarehouse)) || null,
    [warehouseStock, form.toWarehouse]
  );

  useEffect(() => {
    const qty = Number(form.quantity || 0);
    const currentStock = Number(selectedProduct?.stock || 0);

    const nextImpact = {
      product: selectedProduct?.name || '—',
      currentStock,
      transferQty: qty,
      sourceBefore: fromWh?.totalStock ?? 0,
      sourceAfter: Math.max(0, (fromWh?.totalStock ?? 0) - qty),
      destinationBefore: toWh?.totalStock ?? 0,
      destinationAfter: (toWh?.totalStock ?? 0) + qty,
    };
    setImpactPreview(nextImpact);

    if (!qty || !currentStock) {
      setRisk({ level: 'LOW', message: 'Low risk transfer.' });
      return;
    }

    if (form.fromWarehouse && form.toWarehouse && form.fromWarehouse === form.toWarehouse) {
      setRisk({
        level: 'HIGH',
        message: 'High risk: source and destination warehouse are identical.',
      });
      return;
    }

    if (qty > currentStock * 0.7) {
      setRisk({
        level: 'HIGH',
        message: 'High risk: transfer quantity is more than 70% of current product stock.',
      });
      return;
    }

    if (qty > currentStock * 0.4) {
      setRisk({
        level: 'MEDIUM',
        message: 'Medium risk: transfer quantity is a large part of available stock.',
      });
      return;
    }

    setRisk({ level: 'LOW', message: 'Low risk transfer.' });
  }, [form.quantity, form.fromWarehouse, form.toWarehouse, selectedProduct, fromWh, toWh]);

  const applyRecommendation = (rec) => {
    setForm({
      productId: rec.productId,
      quantity: rec.quantity,
      fromWarehouse: rec.fromWarehouse?._id || '',
      toWarehouse: rec.toWarehouse?._id || '',
      note: `Recommended transfer: ${rec.reason}`,
    });
    setMsg('Recommendation applied to form');
    setErr('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSubmitting(true);
    try {
      const data = await apiPost('/transfers', {
        productId: form.productId,
        fromWarehouse: form.fromWarehouse,
        toWarehouse: form.toWarehouse,
        quantity: Number(form.quantity),
        note: form.note,
      });
      setMsg(data.message || 'Transfer created successfully');
      setForm((f) => ({ ...f, quantity: 1, note: '' }));
      setImpactPreview(data.impactPreview || null);
      setRisk(data.risk || { level: 'LOW', message: 'Low risk transfer.' });
      await loadBase();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const riskStyles = {
    LOW: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    MEDIUM: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    HIGH: 'text-rose-300 border-rose-400/40 bg-rose-500/15',
  };

  const zoneStyles = {
    LOW: 'bg-rose-500/70',
    MEDIUM: 'bg-amber-400/80',
    HIGH: 'bg-emerald-400/80',
  };

  const maxStock = Math.max(...warehouseStock.map((x) => x.totalStock), 1);

  const featureCards = [
    {
      title: 'Smart Recommendation',
      desc: 'System suggests best source→destination transfers based on stock pressure.',
      icon: BrainCircuit,
      tone: 'from-cyan-500/20 to-sky-500/10 border-cyan-300/30',
    },
    {
      title: 'Impact Simulator',
      desc: 'Preview source and destination stock before submitting transfer.',
      icon: Workflow,
      tone: 'from-indigo-500/20 to-violet-500/10 border-indigo-300/30',
    },
    {
      title: 'Risk Shield',
      desc: 'Live risk classification protects against unstable internal moves.',
      icon: ShieldAlert,
      tone: 'from-emerald-500/20 to-teal-500/10 border-emerald-300/30',
    },
    {
      title: 'Stock Heatmap',
      desc: 'Warehouse wise visual bars highlight low/high stock zones instantly.',
      icon: Boxes,
      tone: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-300/30',
    },
    {
      title: 'Live Timeline',
      desc: 'Recent transfer activity appears as a real-time style operational feed.',
      icon: ArrowRightLeft,
      tone: 'from-amber-500/20 to-orange-500/10 border-amber-300/30',
    },
  ];

  return (
    <PageTransition>
      <div className="glass-card glow-border rounded-[28px] p-5 sm:p-6 space-y-5 overflow-hidden relative">
        <div className="absolute -top-24 -right-12 w-56 h-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2 rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <ArrowRightLeft className="w-6 h-6 text-cyan-300 shrink-0" />
              <h2 className="text-2xl font-black text-white">Internal Transfers</h2>
            </div>
            <p className="text-white/75 max-w-2xl">
              Beautiful operational control panel with intelligence blocks, live risk signal, transfer impact simulation, and
              activity timeline for warehouse teams.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {featureCards.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`rounded-xl border bg-gradient-to-br p-3 ${f.tone}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-white" />
                      <p className="text-sm font-semibold text-white">{f.title}</p>
                    </div>
                    <p className="text-xs text-white/75 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/30 bg-gradient-to-b from-cyan-500/20 to-indigo-500/10 p-3 flex items-center justify-center min-h-[210px]">
            <img
              src={heroImage}
              alt="Transfer dashboard visual"
              className="max-h-48 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.45)]"
            />
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <p className="text-sm font-semibold text-cyan-100">Smart Transfer Recommendation</p>
            </div>
            {loadingRec ? (
              <p className="text-white/60 text-sm">Analyzing warehouse stock pattern...</p>
            ) : recommendations[0] ? (
              <>
                <p className="text-sm text-white/90">
                  Move <span className="font-semibold">{recommendations[0].quantity}</span> of{' '}
                  <span className="font-semibold">{recommendations[0].productName}</span> ({recommendations[0].sku})
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {recommendations[0].fromWarehouse?.name} → {recommendations[0].toWarehouse?.name}
                </p>
                <p className="text-xs text-cyan-100/90 mt-1">{recommendations[0].reason}</p>
                <button
                  type="button"
                  onClick={() => applyRecommendation(recommendations[0])}
                  className="mt-3 px-3 py-2 rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-100 text-xs font-semibold"
                >
                  Apply Recommendation
                </button>
              </>
            ) : (
              <p className="text-white/60 text-sm">No transfer recommendation right now.</p>
            )}
          </div>

          <div className={`rounded-2xl border p-4 ${riskStyles[risk.level] || riskStyles.LOW}`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-sm font-semibold">Transfer Risk Warning</p>
            </div>
            <p className="text-sm">{risk.message}</p>
            <p className="text-xs mt-1 opacity-80">Risk level: {risk.level}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <form onSubmit={submit} className="glass-card glow-border rounded-[24px] p-5 space-y-4 xl:col-span-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-white/80" />
            <p className="text-sm text-white/90 font-semibold">Create Internal Transfer</p>
          </div>

          <select value={form.productId} onChange={set('productId')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" required>
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>{p.sku} — {p.name} (Stock: {p.stock})</option>
            ))}
          </select>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={form.fromWarehouse} onChange={set('fromWarehouse')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" required>
              <option value="">From warehouse</option>
              {warehouseStock.map((w) => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
            </select>
            <select value={form.toWarehouse} onChange={set('toWarehouse')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" required>
              <option value="">To warehouse</option>
              {warehouseStock.map((w) => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
            </select>
          </div>

          <input type="number" min="1" value={form.quantity} onChange={set('quantity')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" placeholder="Quantity" required />
          <input value={form.note} onChange={set('note')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" placeholder="Note (optional)" />

          {msg && <p className="text-emerald-300 text-sm">{msg}</p>}
          {err && <p className="text-rose-400 text-sm">{err}</p>}

          <button disabled={submitting} className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            <SendHorizonal className="w-4 h-4" />
            {submitting ? 'Submitting...' : 'Submit Transfer'}
          </button>
        </form>

        <div className="glass-card glow-border rounded-[24px] p-5 space-y-3">
          <p className="text-sm text-white/90 font-semibold">Transfer Impact Preview</p>
          <div className="text-xs text-white/70 space-y-1">
            <p>Product: <span className="text-white/90">{impactPreview?.product || '—'}</span></p>
            <p>Qty: <span className="text-white/90">{impactPreview?.transferQty ?? 0}</span></p>
            <p>Product Stock: <span className="text-white/90">{impactPreview?.currentStock ?? 0}</span></p>
          </div>

          <div className="rounded-xl border border-white/10 p-3 text-xs text-white/80 space-y-1">
            <p className="flex items-center gap-2"><TrendingDown className="w-3.5 h-3.5 text-rose-300" />Source before: {impactPreview?.sourceBefore ?? 0}</p>
            <p className="pl-5">Source after: <span className="text-rose-200">{impactPreview?.sourceAfter ?? 0}</span></p>
          </div>
          <div className="rounded-xl border border-white/10 p-3 text-xs text-white/80 space-y-1">
            <p className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-emerald-300" />Destination before: {impactPreview?.destinationBefore ?? 0}</p>
            <p className="pl-5">Destination after: <span className="text-emerald-200">{impactPreview?.destinationAfter ?? 0}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <p className="text-sm font-semibold text-white/90">Warehouse Stock Heatmap</p>
          <p className="text-xs text-white/60">Low ≤ {thresholds.low}, High ≥ {thresholds.high}</p>
          <div className="space-y-3">
            {warehouseStock.map((w) => {
              const pct = Math.max(6, Math.round((w.totalStock / maxStock) * 100));
              return (
                <div key={w.warehouseId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <p>{w.name}</p>
                    <p>{w.totalStock}</p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${zoneStyles[w.zone] || zoneStyles.MEDIUM} animate-pulse`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {!warehouseStock.length && <p className="text-xs text-white/60">No warehouse stock data available.</p>}
          </div>
        </div>

        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <p className="text-sm font-semibold text-white/90">Recent Transfers Timeline</p>
          <div className="space-y-3 max-h-[320px] overflow-auto pr-1">
            {recentTransfers.map((t) => (
              <div key={t._id} className="rounded-xl border border-white/10 p-3 text-xs text-white/80">
                <p className="text-white/95 font-medium">{t.productId?.name || 'Product'} ({t.productId?.sku || '—'})</p>
                <p className="mt-1">{t.fromWarehouse?.name || '—'} → {t.toWarehouse?.name || '—'}</p>
                <p>Qty: {t.quantity}</p>
                <p className="text-white/60 mt-1">{new Date(t.timestamp).toLocaleString()}</p>
              </div>
            ))}
            {!recentTransfers.length && <p className="text-xs text-white/60">No recent transfers yet.</p>}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

