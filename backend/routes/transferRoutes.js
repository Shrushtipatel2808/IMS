const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createTransfer,
  getRecentTransfers,
  getTransferRecommendations,
} = require("../controllers/transferController");

router.use(authMiddleware);

router.post("/", createTransfer);
router.get("/recent", getRecentTransfers);
router.get("/recommendations", getTransferRecommendations);

module.exports = router;

