require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const transferRoutes = require("./routes/transferRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

require("./models/Warehouse");
require("./models/StockMovement");
require("./models/TransferLog");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.get("/", (_req, res) => {
  res.send("Inventory Management API Running 🚀");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);

// database + server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
  
