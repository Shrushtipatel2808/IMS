import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  MapPinned,
  PackageSearch,
  Plus,
  Save,
  Truck,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { apiGet, apiPost, apiPut } from '../lib/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const fallbackCoordinates = (seed = '') => {
  const hash = String(seed)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  return {
    lat: Number((22.9734 + ((hash % 120) - 60) * 0.08).toFixed(5)),
    lng: Number((78.6569 + (((hash * 11) % 140) - 70) * 0.08).toFixed(5)),
  };
};

const metricBarClass = (value) => {
  if (value >= 80) return 'from-emerald-400 to-cyan-400';
  if (value >= 60) return 'from-amber-400 to-yellow-300';
  return 'from-rose-500 to-orange-400';
};

function AnimatedNumber({ value, duration = 900, suffix = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value || 0);
    const start = performance.now();
    let frame = null;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <>
      {display}
      {suffix}
    </>
  );
}

function MetricBar({ label, value }) {
  const safeValue = clamp(Math.round(value || 0), 0, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70">{label}</span>
        <span className="font-semibold text-white">{safeValue}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${metricBarClass(safeValue)}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function WarehouseNetworkGraph({ network }) {
  const width = 900;
  const height = 320;
  const nodes = network?.nodes || [];
  const edges = network?.edges || [];

  const positionedNodes = useMemo(() => {
    const total = nodes.length;
    if (!total) return [];

    const radius = Math.min(width, height) * 0.33;
    const centerX = width / 2;
    const centerY = height / 2;

    return nodes.map((node, index) => {
      const angle = ((Math.PI * 2) / total) * index - Math.PI / 2;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [nodes]);

  const nodeById = useMemo(
    () => Object.fromEntries(positionedNodes.map((node) => [String(node.id), node])),
    [positionedNodes]
  );

  if (!nodes.length) {
    return <p className="text-white/60 text-sm">No transfer network data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-[320px]">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <polygon points="0 0, 10 4, 0 8" fill="rgba(34,211,238,0.85)" />
          </marker>
        </defs>

        {edges.map((edge, idx) => {
          const from = nodeById[String(edge.fromWarehouseId)];
          const to = nodeById[String(edge.toWarehouseId)];
          if (!from || !to) return null;

          const pathId = `transfer-path-${idx}`;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={pathId}>
              <path
                id={pathId}
                d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                className="transfer-path"
                markerEnd="url(#arrowhead)"
              />
              <circle r="3" fill="rgba(34,211,238,0.95)">
                <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto">
                  <mpath href={`#${pathId}`} />
                </animateMotion>
              </circle>
              <text x={midX} y={midY - 8} textAnchor="middle" className="fill-white/70 text-[11px]">
                {edge.fromWarehouseName} → {edge.toWarehouseName} ({edge.count})
              </text>
            </g>
          );
        })}

        {positionedNodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle r="26" className="fill-cyan-400/15 stroke-cyan-300/70" strokeWidth="2" />
            <circle r="6" className="fill-cyan-300" />
            <text y="44" textAnchor="middle" className="fill-white text-[12px] font-semibold">
              {node.label}
            </text>
            <text y="60" textAnchor="middle" className="fill-white/60 text-[10px]">
              Stock: {node.stock}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [commandCenter, setCommandCenter] = useState({
    warehouses: [],
    insights: [],
    activityFeed: [],
    network: { nodes: [], edges: [] },
  });
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [centerLoading, setCenterLoading] = useState(false);
  const [editId, setEditId] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);

  const loadWarehouses = async () => {
    const data = await apiGet('/warehouses');
    setWarehouses(data.warehouses || []);
  };

  const loadCommandCenter = async () => {
    setCenterLoading(true);
    try {
      const data = await apiGet('/warehouse/dashboard');

      const warehouseByName = Object.fromEntries((data.warehouses || []).map((w) => [w.name, w]));
      const nodes = (data.warehouses || []).map((w) => ({
        id: String(w.warehouseId),
        label: w.name,
        location: w.location,
        coordinates: w.coordinates,
        stock: w.totalStock,
        lowStockItems: w.lowStockItems,
      }));

      const nameToId = Object.fromEntries(nodes.map((n) => [n.label, n.id]));
      const edges = (data.transferNetwork || []).map((e, idx) => ({
        fromWarehouseId: nameToId[e.source] || `s-${idx}`,
        fromWarehouseName: e.source,
        toWarehouseId: nameToId[e.target] || `t-${idx}`,
        toWarehouseName: e.target,
        count: e.successfulTransfers || 0,
        quantity: e.quantity || 0,
      }));

      const normalizedWarehouses = (data.warehouses || []).map((w) => ({
        warehouseId: w.warehouseId,
        name: w.name,
        location: w.location,
        city: w.city,
        coordinates: w.coordinates,
        metrics: {
          stockHealth: w.stockHealth,
          transferEfficiency: w.transferEfficiency,
          deliverySuccessRate: w.deliverySuccessRate,
          lowStockItems: w.lowStockItems,
          totalProducts: w.totalProducts,
          totalStock: w.totalStock,
          transfersToday: Math.min(99, Math.round((w.totalTransfers || 0) / 2)),
        },
      }));

      setCommandCenter({
        warehouses: normalizedWarehouses,
        insights: data.insights || [],
        activityFeed: (data.activityFeed || []).map((a) => ({
          ...a,
          message: a.message || a.title,
        })),
        network: { nodes, edges },
      });

      if ((warehouses || []).length === 0 && Object.keys(warehouseByName).length > 0) {
        setWarehouses(
          Object.values(warehouseByName).map((w) => ({
            _id: w.warehouseId,
            name: w.name,
            location: w.location,
          }))
        );
      }
    } finally {
      setCenterLoading(false);
    }
  };

  const loadAll = async () => {
    await Promise.allSettled([loadWarehouses(), loadCommandCenter()]);
  };

  useEffect(() => {
    loadAll().catch(() => {});
  }, []);

  const analyticsWarehouses = useMemo(() => {
    if (commandCenter.warehouses?.length) return commandCenter.warehouses;
    return warehouses.map((w) => ({
      warehouseId: w._id,
      name: w.name,
      location: w.location || '',
      coordinates: fallbackCoordinates(`${w.name}-${w.location || ''}`),
      metrics: {
        stockHealth: 0,
        transferEfficiency: 0,
        deliverySuccessRate: 0,
        lowStockItems: 0,
        totalProducts: 0,
        totalStock: 0,
        transfersToday: 0,
      },
    }));
  }, [commandCenter.warehouses, warehouses]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([22.9734, 78.6569], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();
    const bounds = [];

    analyticsWarehouses.forEach((warehouse) => {
      const c = warehouse.coordinates || fallbackCoordinates(warehouse.name);
      const metrics = warehouse.metrics || {};
      const marker = L.marker([c.lat, c.lng]);
      marker.bindPopup(`
        <div class="text-sm leading-6">
          <strong>${warehouse.name}</strong><br/>
          Location: ${warehouse.location || '—'}<br/>
          Total products: ${metrics.totalProducts || 0}<br/>
          Total stock: ${metrics.totalStock || 0}<br/>
          Low stock items: ${metrics.lowStockItems || 0}<br/>
          Transfers today: ${metrics.transfersToday || 0}
        </div>
      `);
      marker.addTo(markerLayerRef.current);
      bounds.push([c.lat, c.lng]);
    });

    if (bounds.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] });
    }
    if (bounds.length === 1) {
      mapInstanceRef.current.setView(bounds[0], 9);
    }
  }, [analyticsWarehouses]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      if (editId) {
        await apiPut(`/warehouses/${editId}`, { name, location });
      } else {
        await apiPost('/warehouses', { name, location });
      }
      setName('');
      setLocation('');
      setEditId('');
      await loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-cyan-300" />
          <div>
            <h2 className="text-2xl font-black text-white">Warehouse Command Center</h2>
            <p className="text-white/60">Manage locations with real-time map, analytics, network flow, and activity signals</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 glass-card glow-border rounded-[24px] p-5 space-y-4">
          <h3 className="text-lg font-bold text-white">{editId ? 'Edit Warehouse' : 'Add Warehouse'}</h3>
          <input
            className="input-glass rounded-2xl px-4 py-3 w-full text-sm"
            placeholder="Warehouse name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input-glass rounded-2xl px-4 py-3 w-full text-sm"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button className="btn-primary rounded-2xl w-full py-3 text-sm font-semibold flex items-center justify-center gap-2" disabled={loading}>
            {editId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Please wait…' : editId ? 'Save Changes' : 'Create Warehouse'}
          </button>
        </form>

        <div className="lg:col-span-3 glass-card glow-border rounded-[24px] p-5 space-y-3">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <PackageSearch className="w-4 h-4 text-cyan-300" />
            <span>Warehouse registry (existing functionality preserved)</span>
          </div>
          {warehouses.map((w, idx) => (
            <motion.div
              key={w._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-semibold">{w.name}</p>
                <p className="text-white/60 text-sm">{w.location || '—'}</p>
              </div>
              <button
                onClick={() => {
                  setEditId(w._id);
                  setName(w.name);
                  setLocation(w.location || '');
                }}
                className="text-cyan-300 text-sm hover:underline"
              >
                Edit
              </button>
            </motion.div>
          ))}
          {warehouses.length === 0 && <p className="text-white/50 text-sm">No warehouses yet.</p>}
        </div>
      </div>

      <div className="glass-card glow-border rounded-[24px] p-5 space-y-4 warehouse-map">
        <div className="flex items-center gap-2">
          <MapPinned className="w-5 h-5 text-cyan-300" />
          <h3 className="text-white font-bold text-lg">Warehouse Map</h3>
        </div>
        <div ref={mapRef} className="h-[360px] w-full rounded-2xl border border-white/15 overflow-hidden" />
      </div>

      <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-300" />
          <h3 className="text-white font-bold text-lg">Warehouse Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {analyticsWarehouses.map((warehouse) => {
            const metrics = warehouse.metrics || {};
            return (
              <motion.div
                key={warehouse.warehouseId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 space-y-3"
              >
                <div>
                  <p className="text-white font-semibold">{warehouse.name}</p>
                  <p className="text-white/60 text-sm">{warehouse.location || '—'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                    <p className="text-white/60">Total Products</p>
                    <p className="text-white font-semibold text-base">
                      <AnimatedNumber value={metrics.totalProducts || 0} />
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                    <p className="text-white/60">Low Stock Items</p>
                    <p className="text-rose-300 font-semibold text-base">
                      <AnimatedNumber value={metrics.lowStockItems || 0} />
                    </p>
                  </div>
                </div>

                <MetricBar label="Stock Health" value={metrics.stockHealth} />
                <MetricBar label="Transfer Efficiency" value={metrics.transferEfficiency} />
                <MetricBar label="Delivery Success Rate" value={metrics.deliverySuccessRate} />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-cyan-300" />
            <h3 className="text-white font-bold text-lg">Warehouse Network Visualization</h3>
          </div>
          <WarehouseNetworkGraph network={commandCenter.network} />
        </div>

        <div className="xl:col-span-2 glass-card glow-border rounded-[24px] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            <h3 className="text-white font-bold text-lg">Smart Warehouse Insights</h3>
          </div>

          {(commandCenter.insights || []).length === 0 && (
            <p className="text-white/60 text-sm">No critical low-stock insights right now.</p>
          )}

          {(commandCenter.insights || []).map((insight, idx) => (
            <motion.div
              key={`${insight.warehouseId}-${idx}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"
            >
              <p className="text-amber-100 font-semibold">{insight.title}</p>
              <p className="text-amber-50/90 text-sm mt-1">Recommended: {insight.recommendation}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="glass-card glow-border rounded-[24px] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-cyan-300" />
          <h3 className="text-white font-bold text-lg">Warehouse Activity Feed</h3>
        </div>

        {centerLoading ? <p className="text-white/60 text-sm">Loading latest activities…</p> : null}

        {!centerLoading && (commandCenter.activityFeed || []).length === 0 && (
          <p className="text-white/60 text-sm">No activity yet.</p>
        )}

        <div className="space-y-2">
          {(commandCenter.activityFeed || []).map((activity) => (
            <div
              key={activity.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-white font-medium capitalize">
                  {activity.type} · {activity.productName || 'Product'}
                </p>
                <p className="text-white/60 text-sm">{activity.message}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-300 text-sm font-semibold">Qty: {activity.quantity || 0}</p>
                <p className="text-white/50 text-xs">{new Date(activity.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

