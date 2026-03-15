const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  validateDelivery,
} = require("../controllers/deliveryController");

// All delivery routes require authentication
router.use(authMiddleware);

router.post("/", createDelivery);
router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
router.put("/:id/validate", validateDelivery);

module.exports = router;
