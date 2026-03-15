import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { apiGet } from '../lib/api';

export default function StockLedger() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet('/inventory/movements?limit=100')
      .then((d) => setRows(d.movements || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <PageTransition>
      <div className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-cyan-300" />
          <div>
            <h2 className="text-2xl font-black text-white">Stock Movement Ledger</h2>
            <p className="text-white/60">Receipts, deliveries, transfers, and adjustments</p>
          </div>
        </div>
      </div>

      <div className="glass-card glow-border rounded-[24px] p-5 overflow-auto">
        {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-white/60 border-b border-white/10">
              <th className="py-2 pr-3">Time</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Reference</th>
              <th className="py-2 pr-3">SKU</th>
              <th className="py-2 pr-3">Product</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m._id} className="border-b border-white/5 text-white/85">
                <td className="py-2 pr-3 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                <td className={`py-2 pr-3 font-semibold ${m.type === 'IN' ? 'text-emerald-300' : 'text-amber-300'}`}>{m.type}</td>
                <td className="py-2 pr-3">{m.reference}</td>
                <td className="py-2 pr-3 font-mono">{m.product?.sku || '—'}</td>
                <td className="py-2 pr-3">{m.product?.name || '—'}</td>
                <td className="py-2 pr-3">{m.quantity}</td>
                <td className="py-2 pr-3 text-white/65">{m.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-white/50 text-sm py-2">No movement entries yet.</p>}
      </div>
    </PageTransition>
  );
}

