const express = require("express");
const {
  registerRider,
  getAllRiders,
  getRidersByStoreLocation,
  updateRiderStatus,
  updateRiderAvailability,
  getRiderProfile,
  getRiderOrders,
  updateOrderStatus,
  updateRiderLocation,
  checkLocationCoverage,
  acceptOrder,
  rejectOrder,
} = require("../controller/rider.controller");
const {
  authMiddleware,
  adminMiddleware,
  riderMiddleware,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public route for rider registration
router.post("/register", registerRider);

// Rider routes
router.get("/profile", authMiddleware, riderMiddleware, getRiderProfile);
router.put(
  "/availability",
  authMiddleware,
  riderMiddleware,
  updateRiderAvailability,
);
router.put("/location", authMiddleware, riderMiddleware, updateRiderLocation);
router.get("/orders", authMiddleware, riderMiddleware, getRiderOrders);
router.put(
  "/order/:id/status",
  authMiddleware,
  riderMiddleware,
  updateOrderStatus,
);
router.post("/order/:id/accept", authMiddleware, riderMiddleware, acceptOrder);
router.post("/order/:id/reject", authMiddleware, riderMiddleware, rejectOrder);

// Public route to check store coverage (no auth required for customer)
router.post("/check-coverage", checkLocationCoverage);

// Admin routes
router.get("/", authMiddleware, adminMiddleware, getAllRiders);
router.get(
  "/store/:storeLocationId",
  authMiddleware,
  adminMiddleware,
  getRidersByStoreLocation,
);
router.put("/:id/status", authMiddleware, adminMiddleware, updateRiderStatus);

module.exports = router;
