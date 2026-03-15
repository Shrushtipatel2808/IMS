import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import FloatingBackground from "./components/FloatingBackground";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Receipts from "./pages/Receipts";
import Deliveries from "./pages/Deliveries";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Warehouses from "./pages/Warehouses";
import Transfers from "./pages/Transfers";
import Adjustments from "./pages/Adjustments";
import StockLedger from "./pages/StockLedger";
import Login from "./pages/Login";

import { AuthProvider, useAuth } from "./lib/AuthContext";

function AppShell() {
  const { isAuth, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/login" && isAuth) {
      logout();
    }
  }, [location.pathname, isAuth]);

  if (!isAuth || location.pathname === "/login") {
    return (
      <div className="min-h-screen text-white relative overflow-hidden futuristic-shell">
        <FloatingBackground />
        <div className="relative z-10">
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden futuristic-shell">
      <FloatingBackground />

      <div className="flex min-h-screen relative z-10">
        <Sidebar />

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 flex flex-col"
        >
          <Navbar />

          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 space-y-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/receipts" element={<Receipts />} />
              <Route path="/deliveries" element={<Deliveries />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/adjustments" element={<Adjustments />} />
              <Route path="/ledger" element={<StockLedger />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </motion.div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
