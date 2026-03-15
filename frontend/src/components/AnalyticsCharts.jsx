import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, BarChart3, PieChart as PieIcon, BrainCircuit, Radar } from "lucide-react";

const growthData = [
  { month: "Jan", value: 8200 },
  { month: "Feb", value: 9100 },
  { month: "Mar", value: 8700 },
  { month: "Apr", value: 10400 },
  { month: "May", value: 11800 },
  { month: "Jun", value: 12600 },
];

const movementData = [
  { name: "Mon", inbound: 42, outbound: 30 },
  { name: "Tue", inbound: 55, outbound: 44 },
  { name: "Wed", inbound: 36, outbound: 41 },
  { name: "Thu", inbound: 64, outbound: 32 },
  { name: "Fri", inbound: 71, outbound: 58 },
];

const statusData = [
  { name: "In Stock", value: 62, color: "#22d3ee" },
  { name: "Low", value: 26, color: "#ec4899" },
  { name: "Critical", value: 12, color: "#8b5cf6" },
];

const categoryData = [
  { name: "Electronics", value: 35 },
  { name: "Furniture", value: 22 },
  { name: "Raw Materials", value: 18 },
  { name: "Tools", value: 15 },
  { name: "Office", value: 10 },
];

function Card({ title, subtitle, icon: Icon, children, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="chart-card glow-border rounded-[24px] p-5 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.2)]">
          <Icon className="w-5 h-5 text-white/80" />
        </div>

        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
      </div>

      {children}
    </motion.div>
  );
}

function SupplyChainMap({ network }) {
  const routes = network?.routes || [];
  const nodes = network?.nodes || [];

  const projectedNodes = nodes.map((n) => {
    const lng = Number(n?.coordinates?.lng || 78.9);
    const lat = Number(n?.coordinates?.lat || 22.2);

    // map India's bounds approx: lng 68..97, lat 8..37 onto SVG space
    const x = ((lng - 68) / (97 - 68)) * 760 + 70;
    const y = ((37 - lat) / (37 - 8)) * 300 + 28;
    return { ...n, x, y };
  });

  const nodeByName = Object.fromEntries(projectedNodes.map((n) => [n.name, n]));

  const routePaths = routes
    .map((r) => {
      const from = nodeByName[r.source];
      const to = nodeByName[r.target];
      if (!from || !to) return null;

      const cx = (from.x + to.x) / 2;
      const cy = Math.min(from.y, to.y) - 38;
      return { ...r, from, to, d: `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}` };
    })
    .filter(Boolean);

  return (
    <div className="h-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <svg viewBox="0 0 900 360" className="w-full h-full">
        <defs>
          <linearGradient id="indiaGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(139,92,246,0.18)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.08)" />
          </linearGradient>
          <marker id="routeArrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
            <polygon points="0 0, 9 4.5, 0 9" fill="rgba(34,211,238,0.92)" />
          </marker>
        </defs>

        {/* stylized India silhouette for wow visual */}
        <path
          d="M230 38 L500 35 L615 85 L640 150 L690 200 L650 260 L575 315 L470 318 L420 275 L360 248 L320 205 L250 165 L220 108 Z"
          fill="url(#indiaGlow)"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="1.2"
        />

        {routePaths.map((route, idx) => (
          <g key={`${route.source}-${route.target}-${idx}`}>
            <path
              d={route.d}
              className="route-flow"
              stroke="rgba(34,211,238,0.9)"
              strokeWidth={Math.max(1.5, Math.min(5, Number(route.quantity || 0) / 10))}
              fill="none"
              markerEnd="url(#routeArrow)"
            />
            <text
              x={(route.from.x + route.to.x) / 2}
              y={Math.min(route.from.y, route.to.y) - 18}
              textAnchor="middle"
              className="fill-white/70 text-[10px]"
            >
              {route.source} → {route.target} ({route.quantity})
            </text>
          </g>
        ))}

        {projectedNodes.map((node, idx) => (
          <g key={`${node.name}-${idx}`} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="8" fill="rgba(34,211,238,0.9)" className="pulse-node" />
            <circle r="15" fill="rgba(34,211,238,0.16)" />
            <text y="-16" textAnchor="middle" className="fill-white text-[10px] font-semibold">
              {node.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const FALLBACK_DEMAND_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  demand: Math.round(120 + Math.sin(i / 3) * 30 + i * 2.5 + Math.random() * 15),
}));

const FALLBACK_FORECASTS = [
  { product: "Electronics A", predictedDemandIncrease: 18, stockoutRiskDays: 7 },
  { product: "Raw Materials B", predictedDemandIncrease: 12, stockoutRiskDays: 14 },
  { product: "Tools C", predictedDemandIncrease: 25, stockoutRiskDays: 5 },
  { product: "Office Supplies", predictedDemandIncrease: 8, stockoutRiskDays: 21 },
  { product: "Furniture D", predictedDemandIncrease: 15, stockoutRiskDays: 10 },
];

const FALLBACK_NETWORK = {
  nodes: [
    { name: "Mumbai", coordinates: { lat: 19.07, lng: 72.87 } },
    { name: "Delhi", coordinates: { lat: 28.61, lng: 77.21 } },
    { name: "Bangalore", coordinates: { lat: 12.97, lng: 77.59 } },
    { name: "Chennai", coordinates: { lat: 13.08, lng: 80.27 } },
    { name: "Hyderabad", coordinates: { lat: 17.38, lng: 78.47 } },
    { name: "Kolkata", coordinates: { lat: 22.57, lng: 88.36 } },
  ],
  routes: [
    { source: "Mumbai", target: "Delhi", quantity: 120 },
    { source: "Delhi", target: "Kolkata", quantity: 80 },
    { source: "Mumbai", target: "Bangalore", quantity: 95 },
    { source: "Bangalore", target: "Chennai", quantity: 60 },
    { source: "Hyderabad", target: "Chennai", quantity: 45 },
    { source: "Delhi", target: "Hyderabad", quantity: 70 },
  ],
};

export default function AnalyticsCharts({ forecast = { forecasts: [], trend: [] }, network = { routes: [], nodes: [] } }) {
  const demandTrend = (forecast?.trend?.length > 0) ? forecast.trend : FALLBACK_DEMAND_TREND;
  const topForecasts = ((forecast?.forecasts?.length > 0) ? forecast.forecasts : FALLBACK_FORECASTS).slice(0, 5);
  const resolvedNetwork = (network?.nodes?.length > 0) ? network : FALLBACK_NETWORK;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Inventory Growth */}
      <Card title="Inventory Growth" subtitle="Total stock by month" icon={Activity}>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="gradGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.2)" />

              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.6)"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={3}
                fill="url(#gradGrowth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stock Movement */}
      <Card title="Stock Movement" subtitle="Inbound vs outbound" icon={BarChart3} delay={0.05}>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.2)" />

              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.6)"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Bar dataKey="inbound" stackId="a" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="outbound" stackId="a" fill="#22d3ee" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stock Health */}
      <Card title="Stock Health" subtitle="Current status mix" icon={PieIcon} delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {statusData.map((item, idx) => (
              <div key={`status-${idx}`} className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 12px ${item.color}80`,
                  }}
                />

                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{item.name}</p>

                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.value}%`,
                        background: `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.72))`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-sm text-white/60">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Category Mix */}
      <Card title="Category Mix" subtitle="Products by category" icon={BarChart3} delay={0.15}>
        <div className="space-y-4">
          {categoryData.map((cat, idx) => (
            <motion.div
              key={`cat-${idx}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm text-white/70">
                <span>{cat.name}</span>
                <span className="font-semibold text-white">{cat.value}%</span>
              </div>

              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.value}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + idx * 0.05 }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Demand Forecast */}
      <Card
        title="Demand Forecast — Next 30 Days"
        subtitle="Predicted demand trend from stock movement velocity"
        icon={BrainCircuit}
        delay={0.2}
      >
        <div className="space-y-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={demandTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(236,72,153,0.22)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.6)" tickLine={false} axisLine={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="demand"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: "#22d3ee" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topForecasts.map((item, idx) => (
              <motion.div
                key={`${item.product}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <p className="text-sm font-semibold text-white">{item.product}</p>
                <p className="text-xs text-cyan-200">Expected demand: +{item.predictedDemandIncrease}%</p>
                <p className="text-xs text-rose-200">Stockout risk in {item.stockoutRiskDays} days</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Card>

      {/* Global Supply Chain Map */}
      <Card
        title="Global Supply Chain Map"
        subtitle="Live transfer routes between warehouse hubs"
        icon={Radar}
        delay={0.25}
      >
        <SupplyChainMap network={resolvedNetwork} />
      </Card>
    </div>
  );
}
