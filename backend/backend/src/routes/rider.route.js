const express = require("express");
const {
  registerRider,
  getAllRiders,
  getRidersByStoreLocation,
  updateRiderStatus,
  updateRiderAvailability,
  getRiderProfile,
  getRiderProfileByEmail,
  getRiderOrders,
  updateOrderStatus,
  updateRiderLocation,
  checkLocationCoverage,
  acceptOrder,
  rejectOrder,
  resetRejectedRegistration,
  updateRiderDocuments,
  updateRiderDocumentsPublic,
} = require("../controller/rider.controller");
const {
  authMiddleware,
  adminMiddleware,
  riderMiddleware,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Public route for rider registration
router.post("/register", registerRider);

// Public route to reset rejected registration and re-register
router.post("/reset-rejected", resetRejectedRegistration);

// Public route to get rider profile by email (for rejected riders updating profile)
router.get("/profile-by-email", getRiderProfileByEmail);

// Public route to update rider documents (for rejected riders without auth token)
router.put("/:id/documents-public", updateRiderDocumentsPublic);

// Rider routes
router.get("/profile", authMiddleware, riderMiddleware, getRiderProfile);
router.put(
  "/availability",
  authMiddleware,
  riderMiddleware,
  updateRiderAvailability,
);
router.put("/location", authMiddleware, riderMiddleware, updateRiderLocation);
// Update documents for rejected/pending riders
router.put("/:id/documents", authMiddleware, riderMiddleware, updateRiderDocuments);
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
