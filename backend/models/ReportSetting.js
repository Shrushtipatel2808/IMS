const mongoose = require("mongoose");

const reportSettingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  format: {
    type: String,
    enum: ["CSV", "Excel", "PDF"],
    default: "CSV",
  },
  lastExported: {
    type: Date,
    default: Date.now,
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

module.exports = mongoose.model("ReportSetting", reportSettingSchema);
