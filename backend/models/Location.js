const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "SettingsWarehouse", required: true },
  type: { type: String, enum: ["Rack", "Storage", "Production"], default: "Rack" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Location", locationSchema);
