const express = require("express");
const {
  initiateEsewaPayment,
  verifyEsewaPayment,
  handlePaymentFailure,
} = require("../controller/payment.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// Initiate eSewa payment (authenticated user)
router.post("/esewa/initiate", authMiddleware, initiateEsewaPayment);

// eSewa callback verification (no auth - called by redirect)
router.get("/esewa/verify", verifyEsewaPayment);

// Handle payment failure
router.post("/esewa/failed", authMiddleware, handlePaymentFailure);

module.exports = router;
