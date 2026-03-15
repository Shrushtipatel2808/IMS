const mongoose = require("mongoose");

const securitySettingSchema = new mongoose.Schema({
  twoFactorEnabled: {
    type: Boolean,
    default: true,
  },
  sessionTimeoutMinutes: {
    type: Number,
    default: 30,
  },
  passwordPolicy: {
    minLength: { type: Number, default: 8 },
    requireNumbers: { type: Boolean, default: true },
    requireSpecial: { type: Boolean, default: true },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SecuritySetting", securitySettingSchema);
