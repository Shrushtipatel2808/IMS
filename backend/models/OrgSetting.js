const mongoose = require("mongoose");

const orgSettingSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
    default: "INVENFLOW Logistics",
    trim: true,
  },
  logoUrl: {
    type: String,
    default: "",
  },
  defaultCurrency: {
    type: String,
    default: "INR",
  },
  timezone: {
    type: String,
    default: "Asia/Kolkata",
  },
  businessType: {
    type: String,
    default: "Logistics",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("OrgSetting", orgSettingSchema);
