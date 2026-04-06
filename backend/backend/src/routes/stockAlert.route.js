const express = require("express");
const {
  getStockAlerts,
  markAlertRead,
  markAllAlertsRead,
} = require("../controller/stockAlert.controller");
const { authMiddleware, adminMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// All stock alert routes require admin auth
router.get("/", authMiddleware, adminMiddleware, getStockAlerts);
router.put("/read-all", authMiddleware, adminMiddleware, markAllAlertsRead);
router.put("/:id/read", authMiddleware, adminMiddleware, markAlertRead);

module.exports = router;
