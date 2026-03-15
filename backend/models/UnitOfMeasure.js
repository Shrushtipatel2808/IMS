const mongoose = require("mongoose");

const unitOfMeasureSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: "", trim: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UnitOfMeasure", unitOfMeasureSchema);
