const mongoose = require("mongoose");

const settingsWarehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    default: "",
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  warehouseType: {
    type: String,
    enum: ["Main", "Storage", "Production"],
    default: "Storage",
  },
  capacity: {
    type: Number,
    default: 10000,
  },
  active: {
    type: Boolean,
    default: true,
  },
  alertThresholdPercent: {
    type: Number,
    default: 15,
  },
  linkedWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SettingsWarehouse", settingsWarehouseSchema);
