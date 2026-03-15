const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createReceipt,
  getReceipts,
  getReceiptById,
  validateReceipt,
} = require("../controllers/receiptController");

// All receipt routes require authentication
router.use(authMiddleware);

router.post("/", createReceipt);
router.get("/", getReceipts);
router.get("/:id", getReceiptById);
router.put("/:id/validate", validateReceipt);

module.exports = router;
