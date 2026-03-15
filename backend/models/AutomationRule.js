const mongoose = require("mongoose");

const automationRuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  condition: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AutomationRule", automationRuleSchema);
