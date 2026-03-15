import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  BrainCircuit,
  CalendarClock,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { apiGet, apiPost } from '../lib/api';
import heroImage from '../assets/hero.png';

export default function Adjustments() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', actualStock: '', reason: '', note: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [intelligenceError, setIntelligenceError] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [applyingTransfer, setApplyingTransfer] = useState(false);

  const loadProducts = async () => {
    const d = await apiGet('/products?limit=100');
    setProducts(d.products || []);
  };

  const loadIntelligence = async () => {
    setIntelligenceError('');
    const [recRes, recentRes, warehousesRes] = await Promise.allSettled([
      apiGet('/transfers/recommendations'),
      apiGet('/transfers/recent?limit=15'),
      apiGet('/warehouses'),
    ]);

    if (recRes.status === 'fulfilled') {
      const data = recRes.value || {};
      setRecommendations(data.recommendations || []);
      setWarehouseStock(data.warehouseStock || []);
    } else {
      setRecommendations([]);
      if (warehousesRes.status === 'fulfilled') {
        setWarehouseStock(
          (warehousesRes.value.warehouses || []).map((w) => ({
            warehouseId: w._id,
            name: w.name,
            location: w.location,
            totalStock: 0,
            zone: 'MEDIUM',
          }))
        );
      } else {
        setWarehouseStock([]);
      }
      setIntelligenceError('Transfer intelligence is temporarily unavailable. Showing fallback insights.');
    }

    if (recentRes.status === 'fulfilled') {
      setRecentTransfers(recentRes.value.transfers || []);
    } else {
      setRecentTransfers([]);
    }
  };

  useEffect(() => {
    loadProducts().catch(() => {});
    loadIntelligence().catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const selected = products.find((p) => p._id === form.productId);
  const delta = selected && form.actualStock !== '' ? Number(form.actualStock) - Number(selected.stock) : null;

  const selectedWarehouseId = useMemo(() => {
    if (!selected?.warehouse) return null;
    return typeof selected.warehouse === 'string' ? selected.warehouse : selected.warehouse?._id || null;
  }, [selected]);

  const effectiveWarehouseStock = useMemo(() => {
    if (!warehouseStock.length) return [];
    if (!selectedWarehouseId || delta === null || Number.isNaN(delta)) return warehouseStock;

    return warehouseStock.map((w) => {
      if (String(w.warehouseId) !== String(selectedWarehouseId)) return w;
      const next = Math.max(0, Number(w.totalStock || 0) + Number(delta));
      return {
        ...w,
        totalStock: next,
        zone: next <= 20 ? 'LOW' : next >= 120 ? 'HIGH' : 'MEDIUM',
      };
    });
  }, [warehouseStock, selectedWarehouseId, delta]);

  const smartRecommendation = useMemo(() => {
    if (effectiveWarehouseStock.length < 2) return recommendations[0] || null;

    const low = [...effectiveWarehouseStock].sort((a, b) => a.totalStock - b.totalStock)[0];
    const high = [...effectiveWarehouseStock].sort((a, b) => b.totalStock - a.totalStock)[0];
    const candidateProduct =
      selected || [...products].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))[0] || null;

    if (!low || !high || !candidateProduct || String(low.warehouseId) === String(high.warehouseId)) return null;

    const dynamicQty =
      delta !== null && !Number.isNaN(delta)
        ? Math.max(1, Math.abs(Math.round(delta)))
        : Math.max(1, Math.floor(Number(candidateProduct.stock || 1) * 0.2));

    return {
      productId: candidateProduct._id,
      productName: candidateProduct.name,
      sku: candidateProduct.sku,
      fromWarehouse: { _id: high.warehouseId, name: high.name },
      toWarehouse: { _id: low.warehouseId, name: low.name },
      quantity: dynamicQty,
      reason: `Low stock in ${low.name} and high stock in ${high.name}`,
    };
  }, [recommendations, effectiveWarehouseStock, products, selected, delta]);

  const riskInfo = useMemo(() => {
    if (!smartRecommendation) {
      return {
        level: 'LOW',
        text: 'No active transfer risk detected.',
        min: 20,
        afterTransfer: 0,
      };
    }

    const source = warehouseStock.find(
      (w) => String(w.warehouseId) === String(smartRecommendation.fromWarehouse?._id)
    );
    const sourceSimulated = effectiveWarehouseStock.find(
      (w) => String(w.warehouseId) === String(smartRecommendation.fromWarehouse?._id)
    );
    const sourceStock = Number(sourceSimulated?.totalStock ?? source?.totalStock ?? 0);
    const qty = Number(smartRecommendation.quantity || 0);
    const minThreshold = 20;
    const afterTransfer = sourceStock - qty;

    if (afterTransfer < minThreshold) {
      return {
        level: 'HIGH',
        text: `This transfer can reduce ${source?.name || 'source'} below minimum threshold.`,
        min: minThreshold,
        afterTransfer,
      };
    }

    if (afterTransfer < minThreshold + 10) {
      return {
        level: 'MEDIUM',
        text: `This transfer will keep ${source?.name || 'source'} close to minimum threshold.`,
        min: minThreshold,
        afterTransfer,
      };
    }

    return {
      level: 'LOW',
      text: 'Operationally safe transfer.',
      min: minThreshold,
      afterTransfer,
    };
  }, [smartRecommendation, warehouseStock, effectiveWarehouseStock]);

  const forecastInfo = useMemo(() => {
    if (!smartRecommendation) return null;

    const target = warehouseStock.find(
      (w) => String(w.warehouseId) === String(smartRecommendation.toWarehouse?._id)
    );
    const targetSimulated = effectiveWarehouseStock.find(
      (w) => String(w.warehouseId) === String(smartRecommendation.toWarehouse?._id)
    );
    const targetStock = Number(targetSimulated?.totalStock ?? target?.totalStock ?? 0);
    const avgTransferQty =
      recentTransfers.length > 0
        ? Math.max(
            1,
            Math.round(recentTransfers.reduce((sum, t) => sum + Number(t.quantity || 0), 0) / recentTransfers.length)
          )
        : 4;
    const estimatedDailyBurn = Math.max(1, Math.round(avgTransferQty / 2));
    const daysToRunOut = Math.max(1, Math.round(targetStock / estimatedDailyBurn));

    return {
      warehouse: target?.name || smartRecommendation.toWarehouse?.name || 'Target Warehouse',
      daysToRunOut,
      recommendedQty: Math.max(1, smartRecommendation.quantity),
    };
  }, [smartRecommendation, warehouseStock, effectiveWarehouseStock, recentTransfers]);

  const networkNodes = useMemo(() => {
    const fromStock = effectiveWarehouseStock.map((w) => w.name);
    const fromTransfers = recentTransfers.flatMap((t) => [t.fromWarehouse?.name, t.toWarehouse?.name]).filter(Boolean);
    return [...new Set([...fromStock, ...fromTransfers])].slice(0, 4);
  }, [effectiveWarehouseStock, recentTransfers]);

  const networkEdges = useMemo(() => {
    return recentTransfers
      .map((t) => ({
        from: t.fromWarehouse?.name,
        to: t.toWarehouse?.name,
        qty: Number(t.quantity || 0),
      }))
      .filter((e) => e.from && e.to)
      .slice(0, 6);
  }, [recentTransfers]);

  const efficiencyRows = useMemo(() => {
    return effectiveWarehouseStock.map((w) => {
      const touches = recentTransfers.filter(
        (t) => t.fromWarehouse?.name === w.name || t.toWarehouse?.name === w.name
      ).length;
      const success = 35;
      const stockBalance = w.zone === 'MEDIUM' ? 35 : w.zone === 'HIGH' ? 28 : 22;
      const delayPenalty = Math.min(15, touches * 2);
      const score = Math.max(40, Math.min(99, success + stockBalance + (30 - delayPenalty)));

      return {
        ...w,
        score,
      };
    });
  }, [effectiveWarehouseStock, recentTransfers]);

  const applySuggestedTransfer = async () => {
    if (!smartRecommendation) return;
    setApplyingTransfer(true);
    setApplyMsg('');
    try {
      await apiPost('/transfers', {
        productId: smartRecommendation.productId,
        fromWarehouse: smartRecommendation.fromWarehouse?._id,
        toWarehouse: smartRecommendation.toWarehouse?._id,
        quantity: Number(smartRecommendation.quantity || 1),
        note: `Applied from Adjustments intelligence panel: ${smartRecommendation.reason || ''}`,
      });
      setApplyMsg('Suggested transfer applied successfully.');
      await loadIntelligence();
    } catch (err) {
      setApplyMsg(err.message || 'Failed to apply suggested transfer.');
    } finally {
      setApplyingTransfer(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const payload = {
        productId: form.productId,
        actualStock: Number(form.actualStock),
        reason: form.reason,
        note: form.note,
      };
      const data = await apiPost('/inventory/adjustments', payload);
      setMessage(data.message || 'Stock adjusted');
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageTransition>
      <div className="glass-card glow-border rounded-[28px] p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute -top-16 -left-14 w-52 h-52 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-10 w-60 h-60 rounded-full bg-fuchsia-500/20 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <div className="lg:col-span-2 rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-500/10 via-indigo-500/10 to-fuchsia-500/10 p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-2">
              <SlidersHorizontal className="w-6 h-6 text-cyan-300" />
              <h2 className="text-2xl font-black text-white">Inventory Adjustment Intelligence</h2>
            </div>
            <p className="text-white/75 max-w-2xl">
              Beautiful operational panel with smart recommendations, risk detector, warehouse network, forecast and
              efficiency score integrated with adjustment workflow.
            </p>
            {intelligenceError && <p className="text-amber-300 text-xs mt-3">{intelligenceError}</p>}
          </div>

          <div className="rounded-2xl border border-cyan-300/30 bg-gradient-to-b from-cyan-500/20 to-indigo-500/10 p-3 flex items-center justify-center min-h-[180px]">
            <img src={heroImage} alt="Inventory intelligence visual" className="max-h-44 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.45)]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        <form onSubmit={submit} className="glass-card glow-border rounded-[24px] p-5 space-y-4 xl:col-span-2">
          <select className="input-glass rounded-2xl px-4 py-3 w-full text-sm" value={form.productId} onChange={set('productId')}>
            <option value="">Select product</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.sku} — {p.name} (system: {p.stock})</option>)}
          </select>

          <input type="number" min="0" value={form.actualStock} onChange={set('actualStock')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" placeholder="Actual physical stock" />
          <input value={form.reason} onChange={set('reason')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" placeholder="Reason (damage, recount, shrinkage...)" />
          <input value={form.note} onChange={set('note')} className="input-glass rounded-2xl px-4 py-3 w-full text-sm" placeholder="Note (optional)" />

          {delta !== null && (
            <p className="text-sm text-white/70">
              System vs Actual delta: <span className={delta < 0 ? 'text-rose-300' : 'text-emerald-300'}>{delta}</span>
            </p>
          )}

          {message && <p className="text-emerald-300 text-sm">{message}</p>}
          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold flex items-center gap-2">
            <Save className="w-4 h-4" />
            Apply Adjustment
          </button>
        </form>

        <div className="glass-card glow-border rounded-[24px] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <p className="text-sm font-semibold text-cyan-100">Smart Transfer Recommendation</p>
          </div>

          {smartRecommendation ? (
            <>
              <p className="text-sm text-white/90">{smartRecommendation.toWarehouse?.name} warehouse low on stock.</p>
              <p className="text-sm text-white/85">
                Move <span className="font-semibold">{smartRecommendation.quantity}</span> units from{' '}
                <span className="font-semibold">{smartRecommendation.fromWarehouse?.name}</span> →{' '}
                <span className="font-semibold">{smartRecommendation.toWarehouse?.name}</span>
              </p>
              <button
                type="button"
                onClick={applySuggestedTransfer}
                disabled={applyingTransfer}
                className="w-full mt-1 rounded-xl border border-cyan-300/30 bg-cyan-400/15 text-cyan-100 px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {applyingTransfer ? 'Applying...' : 'Apply Suggested Transfer'}
              </button>
              {applyMsg && <p className="text-xs text-white/75 mt-1">{applyMsg}</p>}
            </>
          ) : (
            <p className="text-sm text-white/65">No recommendation available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-300" />
            <p className="text-sm font-semibold text-white">Transfer Risk Detector</p>
          </div>
          <p className={`text-sm ${riskInfo.level === 'HIGH' ? 'text-rose-300' : riskInfo.level === 'MEDIUM' ? 'text-amber-300' : 'text-emerald-300'}`}>
            {riskInfo.text}
          </p>
          <p className="text-xs text-white/70">Minimum: {riskInfo.min}</p>
          <p className="text-xs text-white/70">After transfer: {riskInfo.afterTransfer}</p>
        </div>

        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-cyan-200" />
            <p className="text-sm font-semibold text-white">Transfer Forecast</p>
          </div>
          {forecastInfo ? (
            <>
              <p className="text-sm text-white/85">
                {forecastInfo.warehouse} may run out of stock in <span className="text-cyan-200 font-semibold">{forecastInfo.daysToRunOut} days</span> based on estimated movement rate.
              </p>
              <p className="text-xs text-white/70">Recommended transfer: {forecastInfo.recommendedQty} units</p>
              <svg viewBox="0 0 280 96" className="w-full h-20 mt-1">
                <defs>
                  <linearGradient id="forecastGrad" x1="0" x2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  stroke="url(#forecastGrad)"
                  strokeWidth="3"
                  points="8,20 55,28 98,36 143,50 186,64 230,76 272,86"
                />
                <polyline fill="none" stroke="#ffffff33" strokeDasharray="3 4" points="8,86 272,86" />
              </svg>
            </>
          ) : (
            <p className="text-sm text-white/65">Forecast data unavailable.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-200" />
            <p className="text-sm font-semibold text-white">Warehouse Network Graph</p>
          </div>
          <svg viewBox="0 0 420 220" className="w-full h-[220px] rounded-xl border border-white/10 bg-black/10">
            <defs>
              <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#67e8f9" />
              </marker>
            </defs>
            {networkNodes.map((name, idx) => {
              const points = [
                [70, 55],
                [345, 55],
                [70, 165],
                [345, 165],
              ];
              const [x, y] = points[idx] || [210, 110];
              return (
                <g key={name}>
                  <circle cx={x} cy={y} r="30" fill="#1e3a8a66" stroke="#67e8f9" strokeWidth="1.5" />
                  <text x={x} y={y + 4} textAnchor="middle" fill="#e5e7eb" fontSize="11" fontWeight="600">{name}</text>
                </g>
              );
            })}
            {networkEdges.map((edge, idx) => {
              const points = {
                [networkNodes[0]]: [70, 55],
                [networkNodes[1]]: [345, 55],
                [networkNodes[2]]: [70, 165],
                [networkNodes[3]]: [345, 165],
              };
              const from = points[edge.from];
              const to = points[edge.to];
              if (!from || !to) return null;
              const mx = (from[0] + to[0]) / 2;
              const my = (from[1] + to[1]) / 2;
              return (
                <g key={`${edge.from}-${edge.to}-${idx}`}>
                  <line
                    x1={from[0]}
                    y1={from[1]}
                    x2={to[0]}
                    y2={to[1]}
                    stroke="#67e8f9"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    className="animate-pulse"
                    markerEnd="url(#arrowHead)"
                  />
                  <text x={mx} y={my - 6} textAnchor="middle" fill="#bae6fd" fontSize="11">{edge.qty} u</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <p className="text-sm font-semibold text-white">Transfer Efficiency Score</p>
          </div>
          <div className="space-y-3">
            {efficiencyRows.map((row) => (
              <div key={row.warehouseId} className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between text-sm mb-2">
                  <p className="text-white/90 font-semibold">{row.name}</p>
                  <p className="text-cyan-200 font-bold">{row.score}/100</p>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                    style={{ width: `${row.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/60 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Based on transfer consistency, stock balance and delay risk proxy
                </p>
              </div>
            ))}
            {!efficiencyRows.length && <p className="text-sm text-white/65">No warehouse data available.</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-500/15 to-sky-500/5 p-4">
          <div className="flex items-center gap-2 mb-1.5"><BrainCircuit className="w-4 h-4 text-cyan-200" /><p className="text-sm font-semibold text-white">Intelligent Decision Engine</p></div>
          <p className="text-xs text-white/70">Auto-detects high/low warehouse states and proposes operationally useful transfers.</p>
        </div>
        <div className="rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-500/15 to-orange-500/5 p-4">
          <div className="flex items-center gap-2 mb-1.5"><TrendingDown className="w-4 h-4 text-amber-200" /><p className="text-sm font-semibold text-white">Operational Safety System</p></div>
          <p className="text-xs text-white/70">Risk detector warns if transfer may push source warehouse below minimum stock threshold.</p>
        </div>
        <div className="rounded-2xl border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/5 p-4">
          <div className="flex items-center gap-2 mb-1.5"><BarChart3 className="w-4 h-4 text-fuchsia-200" /><p className="text-sm font-semibold text-white">Predictive Supply Insight</p></div>
          <p className="text-xs text-white/70">Forecast and efficiency score gives a quick strategic view for proactive stock movement planning.</p>
        </div>
      </div>
    </PageTransition>
  );
}

