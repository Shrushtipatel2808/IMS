import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineSwitchHorizontal,
  HiOutlineLogout,
} from "react-icons/hi";

const navItems = [
  { to: "/", label: "Dashboard", icon: HiOutlineHome },
  { to: "/products", label: "Products", icon: HiOutlineCube },
  { to: "/warehouses", label: "Warehouses", icon: HiOutlineOfficeBuilding },
  { to: "/stock-movements", label: "Stock Moves", icon: HiOutlineSwitchHorizontal },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-wide">📦 IMS</h1>
        <p className="text-gray-400 text-sm mt-1">Inventory Manager</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link key={item.to} to={item.to}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <item.icon className="text-lg" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <HiOutlineLogout className="text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
}
