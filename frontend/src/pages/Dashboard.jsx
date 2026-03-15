import { useState, useEffect } from 'react';
import { Sparkles, Activity, Package, Truck, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import StatCard from '../components/StatCard';
import AnalyticsCharts from '../components/AnalyticsCharts';
import ProductTable from '../components/ProductTable';
import LowStockAlerts from '../components/LowStockAlerts';
import { apiGet } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: '—',
    totalStock: '—',
    receiptsToday: '—',
    deliveriesToday: '—',
  });

  useEffect(() => {
    const today = new Date().toDateString();

    Promise.all([
      apiGet('/products?limit=1000'),
      apiGet('/receipts'),
      apiGet('/deliveries'),
    ])
      .then(([prodData, recData, delData]) => {
        const products = prodData.products || [];
        const receipts = recData.receipts || recData || [];
        const deliveries = delData.deliveries || delData || [];

        const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
        const receiptsToday = receipts.filter(
          (r) => new Date(r.createdAt).toDateString() === today
        ).length;
        const deliveriesToday = deliveries.filter(
          (d) => new Date(d.createdAt).toDateString() === today
        ).length;

        setStats({
          totalProducts: String(prodData.total ?? products.length),
          totalStock: totalStock.toLocaleString(),
          receiptsToday: String(receiptsToday),
          deliveriesToday: String(deliveriesToday),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <PageTransition>
      <section className="grid gap-6">
        <div className="glass-card glow-border rounded-[24px] p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute right-10 -top-10 w-44 h-44 bg-gradient-to-br from-[#8b5cf6]/35 to-[#ec4899]/25 rounded-full blur-3xl animate-glow" />
          <div className="absolute left-8 bottom-0 w-32 h-32 bg-gradient-to-br from-[#22d3ee]/35 to-[#8b5cf6]/20 rounded-full blur-3xl animate-float" />

          <motion.div
            animate={{ y: [0, -12, 0], rotateY: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            className="absolute right-12 top-16 w-20 h-20 rounded-xl bg-gradient-to-br from-[#22d3ee] to-white/70 opacity-80 shadow-[0_14px_30px_rgba(34,211,238,0.25)]"
          />
          <motion.div
            animate={{ y: [0, 10, 0], rotateX: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut', delay: 0.4 }}
            className="absolute right-36 top-32 w-14 h-14 rounded-lg bg-gradient-to-br from-[#ec4899] to-white/70 opacity-85 shadow-[0_10px_24px_rgba(236,72,153,0.25)]"
          />

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Realtime view</p>
              <h1 className="text-3xl lg:text-5xl font-black text-white leading-tight neon-text">Crafting Stock Status</h1>
              <p className="text-white/60 max-w-3xl">
                Monitor inventory, incoming receipts, and outbound deliveries with live analytics and glassmorphism visuals.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Products" value={stats.totalProducts} change="3.1%" positive icon={Package} accent="from-[#8b5cf6] to-[#22d3ee]" />
          <StatCard title="Total Stock" value={stats.totalStock} change="1.4%" positive icon={Activity} accent="from-[#22d3ee] to-[#8b5cf6]" />
          <StatCard title="Receipts Today" value={stats.receiptsToday} change="12%" positive icon={ArrowDownCircle} accent="from-[#22d3ee] to-[#ec4899]" />
          <StatCard title="Deliveries Today" value={stats.deliveriesToday} change="4%" positive={false} icon={Truck} accent="from-[#ec4899] to-[#8b5cf6]" />
        </div>

        <AnalyticsCharts />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductTable />
          </div>
          <LowStockAlerts />
        </div>
      </section>
    </PageTransition>
  );
}
