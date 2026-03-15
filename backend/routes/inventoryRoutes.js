const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  transferStock,
  adjustStock,
  getStockMovements,
} = require("../controllers/inventoryController");

router.use(authMiddleware);

router.post("/transfers", transferStock);
router.post("/adjustments", adjustStock);
router.get("/movements", getStockMovements);

module.exports = router;

