const mongoose = require("mongoose");

const integrationSettingSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ["Shopify", "Amazon", "Flipkart", "Blinkit"],
    required: true,
  },
  apiKey: {
    type: String,
    required: true,
  },
  webhookUrl: {
    type: String,
    required: true,
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IntegrationSetting", integrationSettingSchema);
