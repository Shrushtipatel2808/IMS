import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { apiGet } from '../lib/api';

const LOW_THRESHOLD = 50;

export default function LowStockAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    apiGet('/products?limit=100')
      .then((data) => {
        const products = data.products || [];
        const low = products
          .filter((p) => p.stock < LOW_THRESHOLD)
          .map((p) => ({
            name: p.name,
            sku: p.sku,
            stock: p.stock,
            threshold: LOW_THRESHOLD,
          }));
        setAlerts(low);
      })
      .catch(() => {});
  }, []);
  return (
    <div className="glass-card glow-border rounded-[24px] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Alerts</p>
          <p className="text-lg font-bold text-white">Low Stock</p>
        </div>
        <span className="text-xs font-semibold bg-rose-500/20 text-rose-200 px-3 py-1 rounded-full border border-rose-400/30">
          {alerts.length} items
        </span>
      </div>

      <div className="divide-y divide-white/10">
        {alerts.map((item, idx) => {
          const pct = Math.min(Math.round((item.stock / item.threshold) * 100), 100);
          return (
            <motion.div
              key={item.sku}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-400/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                  <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded-lg text-white/60">{item.sku}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60 mt-1">
                  <span>{item.stock} in stock</span>
                  <span>Target {item.threshold}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                  />
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
