import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiX } from "react-icons/hi";
import * as api from "../services/api";
import toast from "react-hot-toast";

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    product: "",
    warehouse: "",
    type: "in",
    quantity: "",
    reason: "",
  });

  const fetchData = async () => {
    try {
      const [mRes, pRes, wRes] = await Promise.all([
        api.getMovements(),
        api.getProducts(),
        api.getWarehouses(),
      ]);
      setMovements(mRes.data);
      setProducts(pRes.data);
      setWarehouses(wRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createMovement({
        ...form,
        quantity: Number(form.quantity),
      });
      toast.success("Stock movement recorded");
      setShowModal(false);
      setForm({ product: "", warehouse: "", type: "in", quantity: "", reason: "" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const typeColor = {
    in: "bg-green-100 text-green-700",
    out: "bg-red-100 text-red-700",
    transfer: "bg-blue-100 text-blue-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <HiPlus /> Record Movement
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Warehouse
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Quantity
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Reason
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                By
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((m, i) => (
              <motion.tr
                key={m._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {m.product?.name || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {m.warehouse?.name || "—"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      typeColor[m.type]
                    }`}
                  >
                    {m.type.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{m.quantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {m.reason || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {m.performedBy?.name || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-400">
                  No stock movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Record Stock Movement
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <select
                  required
                  value={form.product}
                  onChange={(e) =>
                    setForm({ ...form, product: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={form.warehouse}
                  onChange={(e) =>
                    setForm({ ...form, warehouse: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="transfer">Transfer</option>
                </select>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <input
                  placeholder="Reason (optional)"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Record Movement
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
