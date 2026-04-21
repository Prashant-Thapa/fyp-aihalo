const express = require("express");
const { verifyOTP, createPassword, resendOTP } = require("../controller/verification.controller");
const { forgotPassword, resetPassword } = require("../controller/forgotPassword.controller");

const router = express.Router();

// Email verification routes
router.post("/verify-otp", verifyOTP);
router.post("/create-password", createPassword);
router.post("/resend-otp", resendOTP);

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
