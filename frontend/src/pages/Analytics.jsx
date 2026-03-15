import { useEffect, useState } from 'react';
import {
  BarChart3,
  Sparkles,
  ArrowUpRight,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  Zap,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { apiGet, apiPost } from '../lib/api';

const kpis = [
  { title: 'Inventory Turnover', value: '4.2x', delta: '+0.3' },
  { title: 'Fill Rate', value: '97.8%', delta: '+1.2%' },
  { title: 'Stockout Rate', value: '2.1%', delta: '-0.5%' },
  { title: 'Lead Time', value: '3.2d', delta: '-0.4' },
];

export default function Analytics() {
  const [insights, setInsights] = useState([]);
  const [forecast, setForecast] = useState({ forecasts: [], trend: [] });
  const [network, setNetwork] = useState({ routes: [], nodes: [] });
  const [liveFeed, setLiveFeed] = useState([]);
  const [riskMonitor, setRiskMonitor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState('');
  const [applyStatus, setApplyStatus] = useState('');

  const LIVE_FEED_LIMIT = 8;

  const normalizeLiveFeed = (feed = []) => {
    const seenIds = new Set();
    const sorted = [...feed]
      .filter((item) => item && (item.id || item.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const unique = [];
    for (const item of sorted) {
      const key = item.id || new Date(item.timestamp).toISOString();
      if (seenIds.has(key)) continue;
      seenIds.add(key);
      unique.push(item);
      if (unique.length >= LIVE_FEED_LIMIT) break;
    }
    return unique;
  };

  const refreshLiveFeedState = (feed = []) => {
    const normalized = normalizeLiveFeed(feed);
    setLiveFeed((prev) => {
      if (
        prev.length === normalized.length &&
        prev.every((item, idx) => item?.id === normalized[idx]?.id && item?.timestamp === normalized[idx]?.timestamp)
      ) {
        return prev;
      }
      return normalized;
    });
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [insightsRes, forecastRes, networkRes, liveFeedRes] = await Promise.all([
          apiGet('/analytics/insights'),
          apiGet('/analytics/forecast'),
          apiGet('/analytics/transfer-network'),
          apiGet('/analytics/live-feed'),
        ]);

        setInsights(insightsRes.insights || []);
        setForecast({
          forecasts: forecastRes.forecasts || [],
          trend: forecastRes.trend || [],
        });
        setRiskMonitor(forecastRes.riskMonitor || []);
        setNetwork({
          routes: networkRes.routes || [],
          nodes: networkRes.nodes || [],
        });
        refreshLiveFeedState(liveFeedRes.feed || []);
      } catch {
        setInsights([]);
        setForecast({ forecasts: [], trend: [] });
        setNetwork({ routes: [], nodes: [] });
        refreshLiveFeedState([]);
        setRiskMonitor([]);
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});

    const id = setInterval(() => {
      apiGet('/analytics/live-feed')
        .then((res) => refreshLiveFeedState(res.feed || []))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(id);
  }, []);

  const insightIcon = (type) => {
    if (type === 'warning' || type === 'risk') return AlertTriangle;
    if (type === 'optimization') return Zap;
    return Lightbulb;
  };

  const applyRecommendation = async (insight) => {
    const action = insight?.action;
    if (!action || action.type !== 'transfer') return;

    setApplyingId(action.id || 'active');
    setApplyStatus('Applying recommendation…');
    try {
      await apiPost('/analytics/apply-transfer', {
        fromWarehouseId: action.fromWarehouseId,
        toWarehouseId: action.toWarehouseId,
        quantity: action.quantity,
        note: `Auto Decision Engine | ${insight.message}`,
      });

      setApplyStatus('✅ Recommendation applied. Transfer created and operations updated.');

      const [insightsRes, forecastRes, networkRes, liveFeedRes] = await Promise.all([
        apiGet('/analytics/insights'),
        apiGet('/analytics/forecast'),
        apiGet('/analytics/transfer-network'),
        apiGet('/analytics/live-feed'),
      ]);

      setInsights(insightsRes.insights || []);
      setForecast({ forecasts: forecastRes.forecasts || [], trend: forecastRes.trend || [] });
      setRiskMonitor(forecastRes.riskMonitor || []);
      setNetwork({ routes: networkRes.routes || [], nodes: networkRes.nodes || [] });
      refreshLiveFeedState(liveFeedRes.feed || []);
    } catch (e) {
      setApplyStatus(`❌ ${e.message}`);
    } finally {
      setApplyingId('');
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return (
    <PageTransition>
      <header className="glass-card glow-border rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-white/60">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs uppercase tracking-[0.2em]">Insights</span>
          </div>
          <h2 className="text-3xl font-black text-white mt-1 neon-text">Analytics</h2>
          <p className="text-white/60">See how inventory flows across your network</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Report
        </motion.button>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card glow-border rounded-[24px] p-4"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">{kpi.title}</p>
            <p className="text-2xl font-black text-white mt-2">{kpi.value}</p>
            <span className="text-sm text-emerald-300 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-4 h-4" />
              {kpi.delta}
            </span>
          </motion.div>
        ))}
      </section>

      <section className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-cyan-300" />
          <div>
            <h3 className="text-white font-bold text-lg">Live Operations Feed</h3>
            <p className="text-white/60 text-sm">Auto-refresh every 5 seconds</p>
          </div>
        </div>

        <div className="space-y-2">
          {liveFeed.slice(0, LIVE_FEED_LIMIT).map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center justify-between"
            >
              <p className="text-white/85 text-sm">{item.message}</p>
              <span className="text-cyan-200 text-xs font-semibold">{formatTime(item.timestamp)}</span>
            </motion.div>
          ))}
          {!liveFeed.length && <p className="text-white/60 text-sm">No live operations yet.</p>}
        </div>
      </section>

      <section className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <BrainCircuit className="w-5 h-5 text-cyan-300" />
          <div>
            <h3 className="text-white font-bold text-lg">AI Supply Chain Insights</h3>
            <p className="text-white/60 text-sm">Rule-driven intelligence and recommended actions</p>
          </div>
        </div>

        {loading ? <p className="text-white/60 text-sm">Generating AI insights…</p> : null}

        {!loading && insights.length === 0 ? (
          <p className="text-white/60 text-sm">No insights available right now.</p>
        ) : null}

        <div className="space-y-3">
          {insights.map((item, idx) => {
            const Icon = insightIcon(item.type);
            return (
              <motion.div
                key={`${item.type}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-semibold text-sm">{item.message}</p>
                    {item.recommendation ? (
                      <p className="text-cyan-200/90 text-sm">Recommended Action: {item.recommendation}</p>
                    ) : null}
                    {item.ai ? (
                      <p className="text-white/60 text-xs">
                        Insight confidence: {item.ai.confidence}% · {item.ai.basis}
                      </p>
                    ) : null}

                    {item.action?.type === 'transfer' ? (
                      <button
                        onClick={() => applyRecommendation(item)}
                        disabled={applyingId === item.action.id}
                        className="mt-2 px-3 py-2 rounded-lg text-xs font-semibold bg-cyan-500/20 border border-cyan-300/40 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-60"
                      >
                        {applyingId === item.action.id ? 'Applying…' : 'Apply Transfer'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {applyStatus ? <p className="text-cyan-200 text-sm mt-3">{applyStatus}</p> : null}
      </section>

      <section className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-300" />
          <div>
            <h3 className="text-white font-bold text-lg">Supply Chain Risk Monitor</h3>
            <p className="text-white/60 text-sm">Forecast-driven operational alerts</p>
          </div>
        </div>
        <div className="space-y-2">
          {riskMonitor.map((risk, idx) => (
            <div
              key={`${risk.type}-${idx}`}
              className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-amber-100 text-sm"
            >
              {risk.message}
            </div>
          ))}
          {!riskMonitor.length && <p className="text-white/60 text-sm">No active risk alerts.</p>}
        </div>
      </section>

      <AnalyticsCharts forecast={forecast} network={network} />
    </PageTransition>
  );
}
