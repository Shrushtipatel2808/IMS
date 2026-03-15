const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  getWarehouseDashboard,
  getWarehouseCommandCenter,
} = require("../controllers/warehouseController");

router.use(authMiddleware);

router.post("/", createWarehouse);
router.get("/", getWarehouses);
router.get("/dashboard", getWarehouseDashboard);
router.get("/command-center", getWarehouseCommandCenter);
router.put("/:id", updateWarehouse);

module.exports = router;

