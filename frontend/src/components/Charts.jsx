import { ResponsiveContainer, LineChart, Line, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';
import GlassCard from './GlassCard';

const data = [
  { name: 'Mon', value: 32 },
  { name: 'Tue', value: 48 },
  { name: 'Wed', value: 41 },
  { name: 'Thu', value: 57 },
  { name: 'Fri', value: 68 },
  { name: 'Sat', value: 52 },
  { name: 'Sun', value: 44 },
];

export default function Charts() {
  return (
    <GlassCard className="p-5 rounded-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-white/50">Trend</p>
          <p className="text-lg font-bold text-white">Weekly Activity</p>
        </div>
        <span className="text-xs text-white/50">Live</span>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tickLine={false} />
            <YAxis stroke="rgba(255,255,255,0.6)" tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
