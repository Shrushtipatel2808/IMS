import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiPlus, HiPencil, HiTrash, HiX } from "react-icons/hi";
import * as api from "../services/api";
import toast from "react-hot-toast";

const emptyWarehouse = { name: "", location: "", capacity: "" };

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyWarehouse);

  const fetchData = async () => {
    try {
      const { data } = await api.getWarehouses();
      setWarehouses(data);
    } catch {
      toast.error("Failed to load warehouses");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyWarehouse);
    setShowModal(true);
  };

  const openEdit = (warehouse) => {
    setEditing(warehouse._id);
    setForm({
      name: warehouse.name,
      location: warehouse.location,
      capacity: String(warehouse.capacity),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity) };

    try {
      if (editing) {
        await api.updateWarehouse(editing, payload);
        toast.success("Warehouse updated");
      } else {
        await api.createWarehouse(payload);
        toast.success("Warehouse created");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this warehouse?")) return;
    try {
      await api.deleteWarehouse(id);
      toast.success("Warehouse deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <HiPlus /> Add Warehouse
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse, i) => (
          <motion.div
            key={warehouse._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {warehouse.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {warehouse.location}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(warehouse)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <HiPencil />
                </button>
                <button
                  onClick={() => handleDelete(warehouse._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <HiTrash />
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Capacity:{" "}
                <span className="font-medium text-gray-900">
                  {warehouse.capacity} units
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Manager:{" "}
                <span className="font-medium text-gray-900">
                  {warehouse.manager?.name || "Unassigned"}
                </span>
              </p>
            </div>
          </motion.div>
        ))}
        {warehouses.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-8">
            No warehouses found. Add your first warehouse!
          </p>
        )}
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
                  {editing ? "Edit Warehouse" : "Add Warehouse"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  required
                  placeholder="Warehouse Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <input
                  required
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Capacity"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {editing ? "Update" : "Create"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
