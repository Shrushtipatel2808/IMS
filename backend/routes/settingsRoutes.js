const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getOrgSettings,
  updateOrgSettings,
  listUsers,
  createUser,
  deleteUser,
  listWarehouseConfigs,
  createWarehouseConfig,
  deleteWarehouseConfig,
  updateWarehouseConfig,
  listAutomationRules,
  createAutomationRule,
  getNotificationSettings,
  updateNotificationSettings,
  listIntegrations,
  updateIntegration,
  createIntegration,
  getSecuritySettings,
  updateSecuritySettings,
  listReportSettings,
  exportReport,
  getSystemMonitor,
  listLocations,
  createLocation,
  listUOM,
  createUOM,
  listReorderRules,
  createReorderRule,
} = require("../controllers/settingsController");

router.use(authMiddleware);

router.get("/org", getOrgSettings);
router.put("/org", updateOrgSettings);

router.get("/users", listUsers);
router.post("/users", createUser);
router.delete("/users/:id", deleteUser);

router.get("/warehouses", listWarehouseConfigs);
router.post("/warehouses", createWarehouseConfig);
router.put("/warehouses/:id", updateWarehouseConfig);
router.delete("/warehouses/:id", deleteWarehouseConfig);

router.get("/locations", listLocations);
router.post("/locations", createLocation);

router.get("/uom", listUOM);
router.post("/uom", createUOM);

router.get("/reorder-rules", listReorderRules);
router.post("/reorder-rules", createReorderRule);

router.get("/rules", listAutomationRules);
router.post("/rules", createAutomationRule);

router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);

router.get("/integrations", listIntegrations);
router.post("/integrations", createIntegration);
router.put("/integrations/:id", updateIntegration);

router.get("/security", getSecuritySettings);
router.put("/security", updateSecuritySettings);

router.get("/reports", listReportSettings);
router.get("/reports/export", exportReport);

router.get("/monitor", getSystemMonitor);

module.exports = router;
