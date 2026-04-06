/**
 * Rider Assignment Routes
 * Routes for the nearest rider assignment system
 */

const express = require("express");
const { authMiddleware } = require("../middleware/auth.middleware");
const {
  assignNearestRiderToOrder,
  getNearbyAvailableRiders,
  manuallyAssignRider,
  reassignOrderRider,
  releaseRiderAfterDelivery,
  updateCurrentRiderLocation,
  getRiderAssignedOrders,
} = require("../controller/riderAssignment.controller");

const router = express.Router();

/**
 * Public routes for finding nearby riders
 */

// Get nearby available riders for a location
// GET /api/riders/nearby?latitude=X&longitude=Y&storeLocationId=Z&radius=5
router.get("/nearby", getNearbyAvailableRiders);

/**
 * Protected routes requiring authentication
 */

// Assign nearest available rider to an order
// POST /api/riders/assign/:orderId
router.post("/assign/:orderId", authMiddleware, assignNearestRiderToOrder);

// Manually assign a specific rider to an order
// POST /api/riders/assign-manual
router.post("/assign-manual", authMiddleware, manuallyAssignRider);

// Reassign order to a different rider
// POST /api/riders/reassign/:orderId
router.post("/reassign/:orderId", authMiddleware, reassignOrderRider);

// Update rider's current location (for real-time tracking)
// PUT /api/riders/:riderId/location
router.put("/:riderId/location", authMiddleware, updateCurrentRiderLocation);

// Release rider after completing delivery
// PUT /api/riders/:riderId/release
router.put("/:riderId/release", authMiddleware, releaseRiderAfterDelivery);

// Get rider's assigned orders
// GET /api/riders/:riderId/orders
router.get("/:riderId/orders", authMiddleware, getRiderAssignedOrders);

module.exports = router;
