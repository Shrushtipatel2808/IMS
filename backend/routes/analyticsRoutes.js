const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getSupplyChainInsights,
  getDemandForecast,
  getTransferNetwork,
  applyInsightTransfer,
  getLiveOperationsFeed,
} = require("../controllers/analyticsController");

router.use(authMiddleware);

router.get("/insights", getSupplyChainInsights);
router.get("/forecast", getDemandForecast);
router.get("/transfer-network", getTransferNetwork);
router.get("/live-feed", getLiveOperationsFeed);
router.post("/apply-transfer", applyInsightTransfer);

module.exports = router;

