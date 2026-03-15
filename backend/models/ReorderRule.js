const mongoose = require("mongoose");

const reorderRuleSchema = new mongoose.Schema({
  productSku: { type: String, required: true, trim: true },
  minimumStockLevel: { type: Number, required: true, default: 10 },
  reorderQuantity: { type: Number, required: true, default: 50 },
  preferredSupplier: { type: String, default: "", trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ReorderRule", reorderRuleSchema);
