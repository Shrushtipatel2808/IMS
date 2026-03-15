import { useState, useEffect, useCallback, Component } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings as SettingsIcon, Building2, Users, Warehouse, MapPin,
  Scale, RefreshCcw, Bell, Shield, Plug, FileDown, Activity,
  Plus, Trash2, Save, Loader2, CheckCircle, AlertCircle, RotateCcw,
  LayoutDashboard, Package, Truck, ClipboardList, TrendingUp, ArrowRightLeft, Zap, Server, Database, Globe,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Error Boundary ───────────────────────────────────────
class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidUpdate(prevProps) { if (prevProps.activeTab !== this.props.activeTab) this.setState({ hasError: false, error: null }); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-white font-semibold">Failed to load this section</p>
          <p className="text-white/40 text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Toast ────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  return createPortal(
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-xl border ${
              t.type === 'success'
                ? 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/25 border-rose-400/40 text-rose-200'
            }`}
          >
            {t.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// ─── Shared UI helpers ────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">{label}</label>}
      {children}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <Field label={label}>
      <input className="input-glass w-full rounded-xl px-4 py-2.5 text-sm" {...props} />
    </Field>
  );
}

function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      <select className="input-glass w-full rounded-xl px-4 py-2.5 text-sm bg-transparent text-white" {...props}>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#0f172a] text-white">{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0">
      <span className="text-sm text-white/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-violet-500' : 'bg-white/10'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function AddBtn({ saving, onClick, label = 'Add' }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-60">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
      {label}
    </button>
  );
}

function SaveBtn({ saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-semibold disabled:opacity-60">
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      Save Changes
    </button>
  );
}

function GlassTable({ cols, rows, empty }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {rows.length === 0
        ? <p className="text-center py-10 text-white/30 text-sm">{empty}</p>
        : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-[11px] uppercase tracking-wider">
                {cols.map(c => <th key={c} className="text-left px-5 py-3">{c}</th>)}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        )}
    </div>
  );
}

function TR({ children }) {
  return <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">{children}</tr>;
}

function TD({ children, mono, dim, colored }) {
  return (
    <td className={`px-5 py-3 ${mono ? 'font-mono' : ''} ${dim ? 'text-white/50' : colored || 'text-white'}`}>
      {children}
    </td>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <td className="px-5 py-3 text-right">
      <button onClick={onClick} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/20 hover:text-rose-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </td>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>;
}

// ─── 1. Organization ──────────────────────────────────────
function OrgSection({ toast }) {
  const [form, setForm] = useState({ organizationName: '', logoUrl: '', defaultCurrency: 'INR', timezone: 'Asia/Kolkata', businessType: 'Logistics' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/settings/org')
      .then(d => setForm({ organizationName: d.organizationName || '', logoUrl: d.logoUrl || '', defaultCurrency: d.defaultCurrency || 'INR', timezone: d.timezone || 'Asia/Kolkata', businessType: d.businessType || 'Logistics' }))
      .catch(() => toast('Failed to load organization settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.organizationName.trim()) { toast('Organization name is required', 'error'); return; }
    setSaving(true);
    try { await apiPut('/settings/org', form); toast('Organization settings saved'); }
    catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-6">
      <SectionHeader title="Organization" subtitle="Configure your company identity and preferences" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Organization Name" value={form.organizationName} onChange={set('organizationName')} placeholder="INVENFLOW Logistics" />
          <Input label="Company Logo URL" value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://..." />
          <Select label="Currency" value={form.defaultCurrency} onChange={set('defaultCurrency')}
            options={[{ value: 'INR', label: 'INR – Indian Rupee' }, { value: 'USD', label: 'USD – US Dollar' }, { value: 'EUR', label: 'EUR – Euro' }, { value: 'GBP', label: 'GBP – British Pound' }]} />
          <Select label="Timezone" value={form.timezone} onChange={set('timezone')}
            options={[{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'America/New_York' }, { value: 'Europe/London', label: 'Europe/London' }, { value: 'Asia/Singapore', label: 'Asia/Singapore' }]} />
          <Select label="Business Type" value={form.businessType} onChange={set('businessType')}
            options={['Logistics', 'Retail', 'Manufacturing', 'Distribution', 'E-Commerce', 'Other'].map(v => ({ value: v, label: v }))} />
        </div>
        <div className="flex justify-end pt-2"><SaveBtn saving={saving} onClick={save} /></div>
      </div>
    </div>
  );
}

// ─── 2. Users ─────────────────────────────────────────────
const roleColors = { Admin: 'text-violet-300 bg-violet-500/15 border-violet-500/25', Manager: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/25', Viewer: 'text-white/60 bg-white/5 border-white/10', Operator: 'text-amber-300 bg-amber-500/15 border-amber-500/25' };

function UsersSection({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'Viewer' });

  const load = () => { setLoading(true); apiGet('/settings/users').then(d => setUsers(d.users || [])).catch(() => toast('Failed to load users', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast('Name and email are required', 'error'); return; }
    if (!/\S+@\S+\.\S+/.test(form.email)) { toast('Invalid email address', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/users', form); toast('User created'); setForm({ name: '', email: '', role: 'Viewer' }); load(); }
    catch (e) { toast(e.message || 'Failed to create user', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async id => {
    try { await apiDelete(`/settings/users/${id}`); toast('User deleted'); load(); }
    catch { toast('Failed to delete user', 'error'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="User Management" subtitle="Create and manage system users" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Add User</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Name" value={form.name} onChange={set('name')} placeholder="John Doe" />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" />
          <Select label="Role" value={form.role} onChange={set('role')} options={['Admin', 'Manager', 'Viewer'].map(v => ({ value: v, label: v }))} />
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Add User" /></div>
      </div>
      {loading ? <Spinner /> : (
        <GlassTable cols={['Name', 'Email', 'Role', '']} empty="No users found"
          rows={users.map(u => (
            <TR key={u._id}>
              <TD>{u.name}</TD>
              <TD dim>{u.email}</TD>
              <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[u.role] || roleColors.Viewer}`}>{u.role}</span></td>
              <DeleteBtn onClick={() => remove(u._id)} />
            </TR>
          ))}
        />
      )}
    </div>
  );
}

// ─── 3. Warehouses ────────────────────────────────────────
function WarehousesSection({ toast }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', warehouseType: 'Storage', capacity: 10000, active: true });

  const load = () => { setLoading(true); apiGet('/settings/warehouses').then(d => setWarehouses(d.warehouses || [])).catch(() => toast('Failed to load warehouses', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const create = async () => {
    if (!form.name.trim()) { toast('Warehouse name is required', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/warehouses', { ...form, capacity: Number(form.capacity) }); toast('Warehouse created'); setForm({ name: '', city: '', warehouseType: 'Storage', capacity: 10000, active: true }); load(); }
    catch (e) { toast(e.message || 'Failed to create warehouse', 'error'); }
    finally { setSaving(false); }
  };

  const remove = async id => {
    try { await apiDelete(`/settings/warehouses/${id}`); toast('Warehouse deleted'); load(); }
    catch { toast('Failed to delete warehouse', 'error'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Warehouse Management" subtitle="Configure warehouses and storage sites" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Add Warehouse</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Warehouse Name" value={form.name} onChange={set('name')} placeholder="Main Warehouse" />
          <Input label="City / Location" value={form.city} onChange={set('city')} placeholder="Mumbai" />
          <Select label="Type" value={form.warehouseType} onChange={set('warehouseType')} options={['Main', 'Storage', 'Production'].map(v => ({ value: v, label: v }))} />
          <Input label="Capacity (units)" type="number" value={form.capacity} onChange={set('capacity')} />
          <Field label="Status">
            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer h-[42px]">
              <input type="checkbox" checked={form.active} onChange={set('active')} className="w-4 h-4 accent-violet-500" />
              Active
            </label>
          </Field>
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Add Warehouse" /></div>
      </div>
      {loading ? <Spinner /> : (
        <GlassTable cols={['Name', 'City', 'Type', 'Capacity', 'Status', '']} empty="No warehouses configured"
          rows={warehouses.map(w => (
            <TR key={w._id}>
              <TD>{w.name}</TD>
              <TD dim>{w.city || '—'}</TD>
              <TD dim>{w.warehouseType}</TD>
              <TD dim>{Number(w.capacity).toLocaleString()}</TD>
              <td className="px-5 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${w.active ? 'text-emerald-300 bg-emerald-500/10' : 'text-white/40 bg-white/5'}`}>
                  {w.active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <DeleteBtn onClick={() => remove(w._id)} />
            </TR>
          ))}
        />
      )}
    </div>
  );
}

// ─── 4. Locations ─────────────────────────────────────────
function LocationsSection({ toast }) {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', warehouse: '', type: 'Rack' });

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, wRes] = await Promise.all([apiGet('/settings/locations'), apiGet('/settings/warehouses')]);
      setLocations(lRes.locations || []);
      const wList = wRes.warehouses || [];
      setWarehouses(wList);
      if (wList.length > 0) setForm(f => ({ ...f, warehouse: f.warehouse || wList[0]._id }));
    } catch { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    if (!form.name.trim() || !form.warehouse) { toast('Name and warehouse are required', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/locations', form); toast('Location created'); setForm(f => ({ ...f, name: '' })); load(); }
    catch (e) { toast(e.message || 'Failed to create location', 'error'); }
    finally { setSaving(false); }
  };

  const whName = id => warehouses.find(w => w._id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <SectionHeader title="Location / Rack Management" subtitle="Define internal warehouse locations and racks" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Add Location</p>
        {warehouses.length === 0 && !loading && <p className="text-amber-400/70 text-sm">⚠ Create a warehouse first before adding locations.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input label="Location Name" value={form.name} onChange={set('name')} placeholder="Rack A" />
          <Select label="Warehouse" value={form.warehouse} onChange={set('warehouse')} options={warehouses.map(w => ({ value: w._id, label: w.name }))} />
          <Select label="Location Type" value={form.type} onChange={set('type')} options={['Rack', 'Storage', 'Production'].map(v => ({ value: v, label: v }))} />
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Add Location" /></div>
      </div>
      {loading ? <Spinner /> : (
        <GlassTable cols={['Name', 'Warehouse', 'Type']} empty="No locations configured"
          rows={locations.map(l => (
            <TR key={l._id}>
              <TD>{l.name}</TD>
              <TD dim>{l.warehouse?.name || whName(l.warehouse)}</TD>
              <TD dim>{l.type}</TD>
            </TR>
          ))}
        />
      )}
    </div>
  );
}

// ─── 5. Units of Measure ─────────────────────────────────
function UOMSection({ toast }) {
  const [uoms, setUoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const load = () => { setLoading(true); apiGet('/settings/uom').then(d => setUoms(d.uoms || [])).catch(() => toast('Failed to load UOM', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    if (!form.name.trim()) { toast('UOM name is required', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/uom', form); toast('Unit of measure added'); setForm({ name: '', description: '' }); load(); }
    catch (e) { toast(e.message || 'Failed to add UOM', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Units of Measure" subtitle="Define measurement units used across products" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Unit Name" value={form.name} onChange={set('name')} placeholder="e.g. Pieces, Kg, Liters" />
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="Optional description" />
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Add UOM" /></div>
      </div>
      {loading ? <Spinner /> : (
        <div className="flex flex-wrap gap-2">
          {uoms.length === 0
            ? <p className="text-white/30 text-sm py-4">No units configured</p>
            : uoms.map(u => (
              <div key={u._id} className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-sm text-white/80">
                <Scale className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-semibold text-white">{u.name}</span>
                {u.description && <span className="text-white/40 text-xs">· {u.description}</span>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── 6. Reorder Rules ─────────────────────────────────────
function ReorderSection({ toast }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productSku: '', minimumStockLevel: 10, reorderQuantity: 50, preferredSupplier: '' });

  const load = () => { setLoading(true); apiGet('/settings/reorder-rules').then(d => setRules(d.rules || [])).catch(() => toast('Failed to load reorder rules', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    if (!form.productSku.trim()) { toast('Product SKU is required', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/reorder-rules', { ...form, minimumStockLevel: Number(form.minimumStockLevel), reorderQuantity: Number(form.reorderQuantity) }); toast('Reorder rule added'); setForm({ productSku: '', minimumStockLevel: 10, reorderQuantity: 50, preferredSupplier: '' }); load(); }
    catch (e) { toast(e.message || 'Failed to add rule', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Reorder Rules" subtitle="Trigger low-stock alerts when inventory falls below minimum" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Product SKU" value={form.productSku} onChange={set('productSku')} placeholder="STL-001" />
          <Input label="Min Stock Level" type="number" value={form.minimumStockLevel} onChange={set('minimumStockLevel')} />
          <Input label="Reorder Quantity" type="number" value={form.reorderQuantity} onChange={set('reorderQuantity')} />
          <Input label="Preferred Supplier" value={form.preferredSupplier} onChange={set('preferredSupplier')} placeholder="Optional" />
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Add Rule" /></div>
      </div>
      {loading ? <Spinner /> : (
        <GlassTable cols={['SKU', 'Min Stock', 'Reorder Qty', 'Supplier']} empty="No reorder rules configured"
          rows={rules.map(r => (
            <TR key={r._id}>
              <TD mono>{r.productSku}</TD>
              <TD colored="text-amber-300">{r.minimumStockLevel}</TD>
              <TD colored="text-cyan-300">{r.reorderQuantity}</TD>
              <TD dim>{r.preferredSupplier || '—'}</TD>
            </TR>
          ))}
        />
      )}
    </div>
  );
}

// ─── 7. Notifications ─────────────────────────────────────
function NotificationsSection({ toast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet('/settings/notifications').then(setSettings).catch(() => toast('Failed to load notification settings', 'error')).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await apiPut('/settings/notifications', settings); toast('Notification settings saved'); }
    catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <Spinner />;
  return (
    <div className="space-y-6">
      <SectionHeader title="Notification Settings" subtitle="Configure alert triggers and delivery channels" />
      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Alert Types</p>
        <Toggle label="Low Stock Alert" checked={!!settings.lowStockAlert} onChange={v => setSettings(s => ({ ...s, lowStockAlert: v }))} />
        <Toggle label="Transfer Failure Alert" checked={!!settings.transferFailureAlert} onChange={v => setSettings(s => ({ ...s, transferFailureAlert: v }))} />
        <Toggle label="Delivery Delay Alert" checked={!!settings.deliveryDelayAlert} onChange={v => setSettings(s => ({ ...s, deliveryDelayAlert: v }))} />
        <Toggle label="Forecast Risk Alert" checked={!!settings.forecastRiskAlert} onChange={v => setSettings(s => ({ ...s, forecastRiskAlert: v }))} />
      </div>
      <div className="glass-card rounded-2xl p-6">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-4">Delivery Channels</p>
        <Toggle label="Email Notifications" checked={!!settings.deliveryChannels?.email} onChange={v => setSettings(s => ({ ...s, deliveryChannels: { ...s.deliveryChannels, email: v } }))} />
        <Toggle label="In-App Notifications" checked={!!settings.deliveryChannels?.inApp} onChange={v => setSettings(s => ({ ...s, deliveryChannels: { ...s.deliveryChannels, inApp: v } }))} />
      </div>
      <div className="flex justify-end"><SaveBtn saving={saving} onClick={save} /></div>
    </div>
  );
}

// ─── 8. Security ──────────────────────────────────────────
function SecuritySection({ toast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet('/settings/security').then(setSettings).catch(() => toast('Failed to load security settings', 'error')).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await apiPut('/settings/security', settings); toast('Security settings saved'); }
    catch { toast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading || !settings) return <Spinner />;
  return (
    <div className="space-y-6">
      <SectionHeader title="Security Settings" subtitle="Manage authentication and access security policies" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <Toggle label="Enable Two-Factor Authentication (2FA)" checked={!!settings.twoFactorEnabled} onChange={v => setSettings(s => ({ ...s, twoFactorEnabled: v }))} />
        <Field label="Session Timeout (minutes)">
          <input type="number" value={settings.sessionTimeoutMinutes} min="5" max="1440"
            onChange={e => setSettings(s => ({ ...s, sessionTimeoutMinutes: Number(e.target.value) }))}
            className="input-glass w-full rounded-xl px-4 py-2.5 text-sm" />
        </Field>
      </div>
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">Password Policy</p>
        <Field label="Minimum Password Length">
          <input type="number" value={settings.passwordPolicy?.minLength} min="6" max="32"
            onChange={e => setSettings(s => ({ ...s, passwordPolicy: { ...s.passwordPolicy, minLength: Number(e.target.value) } }))}
            className="input-glass w-full rounded-xl px-4 py-2.5 text-sm" />
        </Field>
        <Toggle label="Require Numbers" checked={!!settings.passwordPolicy?.requireNumbers} onChange={v => setSettings(s => ({ ...s, passwordPolicy: { ...s.passwordPolicy, requireNumbers: v } }))} />
        <Toggle label="Require Special Characters" checked={!!settings.passwordPolicy?.requireSpecial} onChange={v => setSettings(s => ({ ...s, passwordPolicy: { ...s.passwordPolicy, requireSpecial: v } }))} />
      </div>
      <div className="flex justify-end"><SaveBtn saving={saving} onClick={save} /></div>
    </div>
  );
}

// ─── 9. Integrations ─────────────────────────────────────
const providerColors = { Shopify: 'text-green-300 bg-green-500/10', Amazon: 'text-orange-300 bg-orange-500/10', Flipkart: 'text-yellow-300 bg-yellow-500/10', Blinkit: 'text-lime-300 bg-lime-500/10' };

function IntegrationsSection({ toast }) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ provider: 'Shopify', apiKey: '', webhookUrl: '' });

  const load = () => { setLoading(true); apiGet('/settings/integrations').then(d => setIntegrations(d.integrations || [])).catch(() => toast('Failed to load integrations', 'error')).finally(() => setLoading(false)); };
  useEffect(load, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const create = async () => {
    if (!form.apiKey.trim() || !form.webhookUrl.trim()) { toast('API Key and Webhook URL are required', 'error'); return; }
    setSaving(true);
    try { await apiPost('/settings/integrations', form); toast('Integration connected'); setForm({ provider: 'Shopify', apiKey: '', webhookUrl: '' }); load(); }
    catch (e) { toast(e.message || 'Failed to connect integration', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Integrations" subtitle="Connect external platforms and marketplaces" />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Platform" value={form.provider} onChange={set('provider')} options={['Shopify', 'Amazon', 'Flipkart', 'Blinkit'].map(v => ({ value: v, label: v }))} />
          <Input label="API Key" value={form.apiKey} onChange={set('apiKey')} placeholder="sk_live_..." />
          <Input label="Webhook URL" value={form.webhookUrl} onChange={set('webhookUrl')} placeholder="https://..." />
        </div>
        <div className="flex justify-end"><AddBtn saving={saving} onClick={create} label="Connect" /></div>
      </div>
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {integrations.length === 0
            ? <p className="col-span-2 text-white/30 text-sm text-center py-6">No integrations connected</p>
            : integrations.map(i => (
              <div key={i._id} className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${providerColors[i.provider] || 'text-white/60 bg-white/5'}`}>{i.provider}</span>
                  <span className="text-xs text-white/30">Synced: {i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleDateString() : '—'}</span>
                </div>
                <div><p className="text-[11px] text-white/40 mb-1">API Key</p><p className="text-sm font-mono text-white/70">{i.apiKey.slice(0, 6)}••••••••</p></div>
                <div><p className="text-[11px] text-white/40 mb-1">Webhook</p><p className="text-sm text-white/60 truncate">{i.webhookUrl}</p></div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── 10. Reports & Exports ────────────────────────────────
const REPORT_ITEMS = [
  { key: 'products', label: 'Products Report', desc: 'Product catalog with SKUs and stock levels' },
  { key: 'warehouses', label: 'Warehouse Report', desc: 'Warehouse capacity and utilization data' },
  { key: 'transfers', label: 'Transfer Logs', desc: 'Internal stock transfer history' },
  { key: 'receipts', label: 'Purchase Receipts', desc: 'All received goods records' },
  { key: 'deliveries', label: 'Delivery Records', desc: 'Outbound delivery history' },
];

function ReportsSection({ toast }) {
  const [exporting, setExporting] = useState(null);

  const exportData = async format => {
    if (format === 'PDF') { toast('PDF export is not available in this demo', 'error'); return; }
    setExporting(format);
    try {
      const token = localStorage.getItem('ims_token');
      const res = await fetch(`/api/settings/reports/export?format=${format.toLowerCase()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inventory-report.${format.toLowerCase()}`; a.click();
      URL.revokeObjectURL(url);
      toast(`${format} exported successfully`);
    } catch (e) { toast(e.message || 'Export failed', 'error'); }
    finally { setExporting(null); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports & Exports" subtitle="Download inventory data in various formats" />
      <div className="flex flex-wrap gap-3">
        {['CSV', 'Excel', 'PDF'].map(fmt => (
          <button key={fmt} onClick={() => exportData(fmt)} disabled={!!exporting}
            className="flex items-center gap-2 px-5 py-3 rounded-xl btn-primary text-sm font-semibold disabled:opacity-60">
            {exporting === fmt ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Export {fmt}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {REPORT_ITEMS.map(item => (
          <div key={item.key} className="glass-card rounded-2xl px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-white/40 mt-1">{item.desc}</p>
            </div>
            <button onClick={() => exportData('CSV')} disabled={!!exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors disabled:opacity-40">
              {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
              Export
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 11. System Monitor ───────────────────────────────────
function MonitorSection({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiGet('/settings/monitor').then(setData).catch(() => toast('Failed to load monitor', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const statusColor = s => s === 'Healthy' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="System Monitor" subtitle="Real-time system health overview" />
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors disabled:opacity-50 mt-0.5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Refresh
        </button>
      </div>
      {loading || !data ? <Spinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Database Status', value: data.dbStatus, cls: statusColor(data.dbStatus), icon: '🟢' },
            { label: 'API Latency', value: `${data.apiLatencyMs} ms`, cls: 'text-cyan-300', icon: '⚡' },
            { label: 'Active Sessions', value: data.activeSessions, cls: 'text-violet-300', icon: '👥' },
          ].map(m => (
            <div key={m.label} className="glass-card rounded-2xl p-5 space-y-2">
              <div className="text-2xl">{m.icon}</div>
              <p className="text-[11px] text-white/40 uppercase tracking-widest">{m.label}</p>
              <p className={`text-2xl font-bold ${m.cls}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 12. Workspace Overview ───────────────────────────────
function AnimCount({ target, suffix = '', duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = Number(target) || 0;
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(t * ease));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return <>{val}{suffix}</>;
}

function RingGauge({ value, color, size = 72, stroke = 7 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function WorkspaceSection({ toast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet('/products?limit=1').catch(() => ({})),
      apiGet('/warehouses').catch(() => ({})),
      apiGet('/receipts?limit=1').catch(() => ({})),
      apiGet('/deliveries?limit=1').catch(() => ({})),
      apiGet('/transfers?limit=1').catch(() => ({})),
      apiGet('/settings/monitor').catch(() => ({})),
    ]).then(([prod, wh, rec, del, tr, mon]) => {
      setStats({
        products: prod.total ?? prod.products?.length ?? 0,
        warehouses: wh.warehouses?.length ?? 0,
        receipts: rec.total ?? rec.receipts?.length ?? 0,
        deliveries: del.total ?? del.deliveries?.length ?? 0,
        transfers: tr.total ?? tr.transfers?.length ?? 0,
        dbStatus: mon.dbStatus || 'Healthy',
        apiLatency: mon.apiLatencyMs ?? 0,
        sessions: mon.activeSessions ?? 1,
      });
    }).catch(() => toast('Failed to load workspace data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = stats ? [
    { label: 'Total Products', value: stats.products, icon: Package, color: '#8b5cf6', ring: Math.min(stats.products / 2, 100) },
    { label: 'Warehouses', value: stats.warehouses, icon: Warehouse, color: '#22d3ee', ring: Math.min(stats.warehouses * 12, 100) },
    { label: 'Receipts', value: stats.receipts, icon: ClipboardList, color: '#34d399', ring: Math.min(stats.receipts * 5, 100) },
    { label: 'Deliveries', value: stats.deliveries, icon: Truck, color: '#f59e0b', ring: Math.min(stats.deliveries * 5, 100) },
    { label: 'Transfers', value: stats.transfers, icon: ArrowRightLeft, color: '#ec4899', ring: Math.min(stats.transfers * 4, 100) },
    { label: 'Active Sessions', value: stats.sessions, icon: Users, color: '#a78bfa', ring: Math.min(stats.sessions * 20, 100) },
  ] : [];

  const health = stats ? [
    { label: 'Database', status: stats.dbStatus, icon: Database, ok: stats.dbStatus === 'Healthy' },
    { label: 'API Latency', status: `${stats.apiLatency} ms`, icon: Zap, ok: stats.apiLatency < 200 },
    { label: 'Backend Server', status: 'Online', icon: Server, ok: true },
    { label: 'Data Sync', status: 'Live', icon: Globe, ok: true },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader title="Workspace Overview" subtitle="Live snapshot of your entire INVENFLOW system" />
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* System health bar */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4 font-semibold">System Health</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {health.map(h => {
            const Icon = h.icon;
            return (
              <div key={h.label} className={`flex items-center gap-3 rounded-xl p-3 border ${h.ok ? 'border-emerald-400/20 bg-emerald-500/8' : 'border-rose-400/20 bg-rose-500/8'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${h.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                  <Icon className={`w-4 h-4 ${h.ok ? 'text-emerald-300' : 'text-rose-300'}`} />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">{h.label}</p>
                  <p className={`text-sm font-bold ${h.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{h.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metric rings */}
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.label}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="glass-card rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="relative shrink-0">
                  <RingGauge value={m.ring} color={m.color} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon style={{ color: m.color }} className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/40">{m.label}</p>
                  <p className="text-2xl font-black text-white mt-0.5">
                    <AnimCount target={m.value} />
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Activity timeline */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-widest text-white/40 mb-4 font-semibold">Platform Capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: TrendingUp, label: 'AI-Powered Demand Forecasting', color: '#8b5cf6', desc: '30-day predictive stock intelligence' },
            { icon: ArrowRightLeft, label: 'Inter-Warehouse Transfers', color: '#22d3ee', desc: 'Real-time network flow tracking' },
            { icon: Zap, label: 'Auto Reorder Rules', color: '#f59e0b', desc: 'Trigger restocking automatically' },
            { icon: Globe, label: 'Global Supply Chain Map', color: '#34d399', desc: 'Live routes between warehouse hubs' },
            { icon: Shield, label: 'Role-Based Access Control', color: '#ec4899', desc: 'Secure multi-user management' },
            { icon: FileDown, label: 'Export Reports', color: '#a78bfa', desc: 'CSV / Excel / PDF downloads' },
          ].map(f => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.color}18`, border: `1px solid ${f.color}35` }}>
                  <Icon style={{ color: f.color }} className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-white/40">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────
const TABS = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'org', label: 'Organization', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'uom', label: 'Units of Measure', icon: Scale },
  { id: 'reorder', label: 'Reorder Rules', icon: RefreshCcw },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'reports', label: 'Reports', icon: FileDown },
  { id: 'monitor', label: 'System Monitor', icon: Activity },
];

const SECTION_MAP = {
  workspace: WorkspaceSection,
  org: OrgSection, users: UsersSection, warehouses: WarehousesSection,
  locations: LocationsSection, uom: UOMSection, reorder: ReorderSection,
  notifications: NotificationsSection, security: SecuritySection,
  integrations: IntegrationsSection, reports: ReportsSection, monitor: MonitorSection,
};

// ─── Main Settings Page ───────────────────────────────────
export default function Settings() {
  const [activeTab, setActiveTab] = useState('workspace');
  const { toasts, show: toast } = useToast();

  const ActiveSection = SECTION_MAP[activeTab];

  return (
    <PageTransition>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="glass-card glow-border rounded-[24px] p-5 sm:p-6">
        <div className="flex items-center gap-2 text-white/60 mb-1">
          <SettingsIcon className="w-5 h-5" />
          <span className="text-xs uppercase tracking-[0.2em]">Configuration</span>
        </div>
        <h2 className="text-3xl font-black text-white neon-text">Settings</h2>
        <p className="text-white/60 text-sm mt-1">Manage your INVENFLOW system configuration</p>
      </div>

      {/* Body */}
      <div className="flex gap-6 items-start">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 glass-card rounded-2xl p-3 space-y-1 sticky top-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  active ? 'bg-violet-500/20 border border-violet-500/30 text-violet-200' : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <SectionErrorBoundary activeTab={activeTab}>
            <ActiveSection toast={toast} />
          </SectionErrorBoundary>
        </div>
      </div>
    </PageTransition>
  );
}
