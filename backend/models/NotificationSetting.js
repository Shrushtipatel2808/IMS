const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema({
  lowStockAlert: {
    type: Boolean,
    default: true,
  },
  transferFailureAlert: {
    type: Boolean,
    default: true,
  },
  deliveryDelayAlert: {
    type: Boolean,
    default: true,
  },
  forecastRiskAlert: {
    type: Boolean,
    default: true,
  },
  deliveryChannels: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);
