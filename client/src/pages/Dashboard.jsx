import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCube,
  HiOutlineOfficeBuilding,
  HiOutlineSwitchHorizontal,
  HiOutlineExclamation,
} from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import * as api from "../services/api";

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-2xl text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    warehouses: 0,
    movements: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, warehousesRes, movementsRes] = await Promise.all([
          api.getProducts(),
          api.getWarehouses(),
          api.getMovements(),
        ]);

        const lowStock = productsRes.data.filter(
          (p) => p.quantity <= p.minStockLevel
        ).length;

        setStats({
          products: productsRes.data.length,
          warehouses: warehousesRes.data.length,
          movements: movementsRes.data.length,
          lowStock,
        });
      } catch {
        // Stats will show 0 if API fails
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your inventory today.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={HiOutlineCube}
          label="Total Products"
          value={stats.products}
          color="bg-indigo-500"
          delay={0.1}
        />
        <StatCard
          icon={HiOutlineOfficeBuilding}
          label="Warehouses"
          value={stats.warehouses}
          color="bg-emerald-500"
          delay={0.2}
        />
        <StatCard
          icon={HiOutlineSwitchHorizontal}
          label="Stock Movements"
          value={stats.movements}
          color="bg-amber-500"
          delay={0.3}
        />
        <StatCard
          icon={HiOutlineExclamation}
          label="Low Stock Items"
          value={stats.lowStock}
          color="bg-red-500"
          delay={0.4}
        />
      </div>
    </div>
  );
}
