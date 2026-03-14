const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later" },
});

// Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/products", apiLimiter, require("./routes/products"));
app.use("/api/warehouses", apiLimiter, require("./routes/warehouses"));
app.use("/api/stock-movements", apiLimiter, require("./routes/stockMovements"));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to DB and start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(() => {
    console.log("Starting server without database connection...");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  });

module.exports = app;
