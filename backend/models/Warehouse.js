const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    trim: true,
    default: "",
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

warehouseSchema.pre("save", async function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Warehouse", warehouseSchema);
