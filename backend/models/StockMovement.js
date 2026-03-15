const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["IN", "OUT"],
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  reference: {
    type: String,
    required: true,
    enum: ["Receipt", "Delivery", "Adjustment", "Transfer"],
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  note: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

stockMovementSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("StockMovement", stockMovementSchema);
