const OrgSetting = require("../models/OrgSetting");
const SettingsUser = require("../models/SettingsUser");
const SettingsWarehouse = require("../models/SettingsWarehouse");
const AutomationRule = require("../models/AutomationRule");
const NotificationSetting = require("../models/NotificationSetting");
const IntegrationSetting = require("../models/IntegrationSetting");
const SecuritySetting = require("../models/SecuritySetting");
const ReportSetting = require("../models/ReportSetting");
const Location = require("../models/Location");
const UnitOfMeasure = require("../models/UnitOfMeasure");
const ReorderRule = require("../models/ReorderRule");
const mongoose = require("mongoose");

const mockMonitor = () => ({
  dbStatus: "Healthy",
  apiLatencyMs: Math.round(80 + Math.random() * 60),
  activeSessions: 3 + Math.floor(Math.random() * 5),
});

const ensureOrgDocument = async () => {
  let doc = await OrgSetting.findOne();
  if (!doc) {
    doc = await OrgSetting.create({ organizationName: "INVENFLOW Logistics" });
  }
  return doc;
};

exports.getOrgSettings = async (_req, res) => {
  try {
    const doc = await ensureOrgDocument();
    return res.status(200).json(doc);
  } catch (error) {
    console.error("Org settings fetch error", error);
    return res.status(500).json({ message: "Unable to load organization settings" });
  }
};

exports.updateOrgSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = await ensureOrgDocument();
    doc.organizationName = payload.organizationName || doc.organizationName;
    doc.logoUrl = payload.logoUrl || doc.logoUrl;
    doc.defaultCurrency = payload.defaultCurrency || doc.defaultCurrency;
    doc.timezone = payload.timezone || doc.timezone;
    doc.businessType = payload.businessType || doc.businessType;
    doc.metadata = payload.metadata || doc.metadata;
    doc.updatedAt = new Date();
    await doc.save();
    return res.status(200).json(doc);
  } catch (error) {
    console.error("Org settings update error", error);
    return res.status(500).json({ message: "Unable to update organization settings" });
  }
};

const userRolePermissions = {
  Admin: ["warehouse", "inventory", "analytics", "settings"],
  Manager: ["inventory", "analytics"],
  Operator: ["operations"],
  Viewer: ["read"],
};

exports.listUsers = async (_req, res) => {
  try {
    const users = await SettingsUser.find();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Settings users fetch error", error);
    return res.status(500).json({ message: "Unable to load users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const payload = req.body || {};
    const user = await SettingsUser.create({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      permissions: userRolePermissions[payload.role] || [],
    });
    return res.status(201).json({ user });
  } catch (error) {
    console.error("Create settings user error", error);
    return res.status(500).json({ message: "Unable to create user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    await SettingsUser.findByIdAndDelete(id);
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete settings user error", error);
    return res.status(500).json({ message: "Unable to delete user" });
  }
};

exports.listWarehouseConfigs = async (_req, res) => {
  try {
    const warehouses = await SettingsWarehouse.find();
    return res.status(200).json({ warehouses });
  } catch (error) {
    console.error("Warehouse settings fetch error", error);
    return res.status(500).json({ message: "Unable to load warehouses" });
  }
};

exports.createWarehouseConfig = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ message: "Warehouse name is required" });
    const warehouse = await SettingsWarehouse.create({
      name: payload.name,
      city: payload.city || "",
      location: payload.location || "",
      warehouseType: payload.warehouseType || "Storage",
      capacity: payload.capacity || 10000,
      active: payload.active !== undefined ? payload.active : true,
    });
    return res.status(201).json({ warehouse });
  } catch (error) {
    console.error("Create warehouse config error", error);
    return res.status(500).json({ message: "Unable to create warehouse" });
  }
};

exports.deleteWarehouseConfig = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid warehouse id" });
    await SettingsWarehouse.findByIdAndDelete(id);
    return res.status(200).json({ message: "Warehouse deleted" });
  } catch (error) {
    console.error("Delete warehouse config error", error);
    return res.status(500).json({ message: "Unable to delete warehouse" });
  }
};

exports.updateWarehouseConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const warehouse = await SettingsWarehouse.findById(id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    warehouse.name = payload.name || warehouse.name;
    warehouse.city = payload.city !== undefined ? payload.city : warehouse.city;
    warehouse.location = payload.location || warehouse.location;
    warehouse.warehouseType = payload.warehouseType || warehouse.warehouseType;
    warehouse.capacity = payload.capacity || warehouse.capacity;
    warehouse.active = payload.active !== undefined ? payload.active : warehouse.active;
    warehouse.alertThresholdPercent = payload.alertThresholdPercent || warehouse.alertThresholdPercent;
    warehouse.updatedAt = new Date();
    await warehouse.save();
    return res.status(200).json({ warehouse });
  } catch (error) {
    console.error("Warehouse settings update error", error);
    return res.status(500).json({ message: "Unable to update warehouse" });
  }
};

exports.listLocations = async (_req, res) => {
  try {
    const locations = await Location.find().populate("warehouse", "name");
    return res.status(200).json({ locations });
  } catch (error) {
    console.error("Locations fetch error", error);
    return res.status(500).json({ message: "Unable to load locations" });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name || !payload.warehouse) {
      return res.status(400).json({ message: "Name and warehouse are required" });
    }
    const location = await Location.create({
      name: payload.name,
      warehouse: payload.warehouse,
      type: payload.type || "Rack",
    });
    return res.status(201).json({ location });
  } catch (error) {
    console.error("Create location error", error);
    return res.status(500).json({ message: "Unable to create location" });
  }
};

exports.listUOM = async (_req, res) => {
  try {
    const uoms = await UnitOfMeasure.find();
    return res.status(200).json({ uoms });
  } catch (error) {
    console.error("UOM fetch error", error);
    return res.status(500).json({ message: "Unable to load units of measure" });
  }
};

exports.createUOM = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ message: "UOM name is required" });
    const uom = await UnitOfMeasure.create({ name: payload.name, description: payload.description || "" });
    return res.status(201).json({ uom });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Unit already exists" });
    console.error("Create UOM error", error);
    return res.status(500).json({ message: "Unable to create unit of measure" });
  }
};

exports.listReorderRules = async (_req, res) => {
  try {
    const rules = await ReorderRule.find();
    return res.status(200).json({ rules });
  } catch (error) {
    console.error("Reorder rules fetch error", error);
    return res.status(500).json({ message: "Unable to load reorder rules" });
  }
};

exports.createReorderRule = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.productSku) return res.status(400).json({ message: "Product SKU is required" });
    const rule = await ReorderRule.create({
      productSku: payload.productSku,
      minimumStockLevel: payload.minimumStockLevel || 10,
      reorderQuantity: payload.reorderQuantity || 50,
      preferredSupplier: payload.preferredSupplier || "",
    });
    return res.status(201).json({ rule });
  } catch (error) {
    console.error("Create reorder rule error", error);
    return res.status(500).json({ message: "Unable to create reorder rule" });
  }
};

exports.listAutomationRules = async (_req, res) => {
  try {
    const rules = await AutomationRule.find();
    return res.status(200).json({ rules });
  } catch (error) {
    console.error("Automation rules fetch error", error);
    return res.status(500).json({ message: "Unable to load automation rules" });
  }
};

exports.createAutomationRule = async (req, res) => {
  try {
    const payload = req.body || {};
    const rule = await AutomationRule.create({
      title: payload.title,
      description: payload.description,
      condition: payload.condition,
      action: payload.action,
    });
    return res.status(201).json({ rule });
  } catch (error) {
    console.error("Create rule error", error);
    return res.status(500).json({ message: "Unable to create rule" });
  }
};

exports.getNotificationSettings = async (_req, res) => {
  try {
    let settings = await NotificationSetting.findOne();
    if (!settings) {
      settings = await NotificationSetting.create({});
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Notification fetch error", error);
    return res.status(500).json({ message: "Unable to load notifications" });
  }
};

exports.updateNotificationSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    let settings = await NotificationSetting.findOne();
    if (!settings) {
      settings = await NotificationSetting.create({});
    }
    settings.lowStockAlert = payload.lowStockAlert ?? settings.lowStockAlert;
    settings.transferFailureAlert = payload.transferFailureAlert ?? settings.transferFailureAlert;
    settings.deliveryDelayAlert = payload.deliveryDelayAlert ?? settings.deliveryDelayAlert;
    settings.forecastRiskAlert = payload.forecastRiskAlert ?? settings.forecastRiskAlert;
    settings.deliveryChannels.email = payload.deliveryChannels?.email ?? settings.deliveryChannels.email;
    settings.deliveryChannels.inApp = payload.deliveryChannels?.inApp ?? settings.deliveryChannels.inApp;
    settings.updatedAt = new Date();
    await settings.save();
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Notification update error", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
};

exports.listIntegrations = async (_req, res) => {
  try {
    const integrations = await IntegrationSetting.find();
    return res.status(200).json({ integrations });
  } catch (error) {
    console.error("Integrations fetch error", error);
    return res.status(500).json({ message: "Unable to load integrations" });
  }
};

exports.createIntegration = async (req, res) => {
  try {
    const payload = req.body || {};
    const integration = await IntegrationSetting.create(payload);
    return res.status(201).json({ integration });
  } catch (error) {
    console.error("Create integration error", error);
    return res.status(500).json({ message: "Unable to create integration" });
  }
};

exports.updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const integration = await IntegrationSetting.findById(id);
    if (!integration) return res.status(404).json({ message: "Integration not found" });
    integration.apiKey = payload.apiKey || integration.apiKey;
    integration.webhookUrl = payload.webhookUrl || integration.webhookUrl;
    integration.lastSyncedAt = new Date();
    await integration.save();
    return res.status(200).json({ integration });
  } catch (error) {
    console.error("Update integration error", error);
    return res.status(500).json({ message: "Unable to update integration" });
  }
};

exports.getSecuritySettings = async (_req, res) => {
  try {
    let settings = await SecuritySetting.findOne();
    if (!settings) {
      settings = await SecuritySetting.create({});
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Security fetch error", error);
    return res.status(500).json({ message: "Unable to load security settings" });
  }
};

exports.updateSecuritySettings = async (req, res) => {
  try {
    const payload = req.body || {};
    let settings = await SecuritySetting.findOne();
    if (!settings) {
      settings = await SecuritySetting.create({});
    }
    settings.twoFactorEnabled = payload.twoFactorEnabled ?? settings.twoFactorEnabled;
    settings.sessionTimeoutMinutes = payload.sessionTimeoutMinutes ?? settings.sessionTimeoutMinutes;
    settings.passwordPolicy.minLength = payload.passwordPolicy?.minLength ?? settings.passwordPolicy.minLength;
    settings.passwordPolicy.requireNumbers = payload.passwordPolicy?.requireNumbers ?? settings.passwordPolicy.requireNumbers;
    settings.passwordPolicy.requireSpecial = payload.passwordPolicy?.requireSpecial ?? settings.passwordPolicy.requireSpecial;
    settings.updatedAt = new Date();
    await settings.save();
    return res.status(200).json(settings);
  } catch (error) {
    console.error("Security update error", error);
    return res.status(500).json({ message: "Unable to update security settings" });
  }
};

exports.listReportSettings = async (_req, res) => {
  try {
    const reports = await ReportSetting.find();
    return res.status(200).json({ reports });
  } catch (error) {
    console.error("Reports fetch error", error);
    return res.status(500).json({ message: "Unable to load reports" });
  }
};

exports.exportReport = async (req, res) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const rows = [
      ["Report", "Status", "Generated At"],
      ["Inventory", "Ready", new Date().toISOString()],
      ["Warehouse Performance", "Ready", new Date().toISOString()],
      ["Stock Movement", "Ready", new Date().toISOString()],
    ];
    if (format === "pdf") {
      return res.status(501).json({ message: "PDF exports are not ready in this demo" });
    }
    const csv = rows.map((row) => row.join(",")).join("\n");
    res.setHeader("Content-Disposition", `attachment; filename=settings-report.${format}`);
    res.setHeader("Content-Type", "text/csv");
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export report error", error);
    return res.status(500).json({ message: "Unable to export report" });
  }
};

exports.getSystemMonitor = async (_req, res) => {
  try {
    const monitor = mockMonitor();
    return res.status(200).json(monitor);
  } catch (error) {
    console.error("Monitor fetch error", error);
    return res.status(500).json({ message: "Unable to load monitor data" });
  }
};
