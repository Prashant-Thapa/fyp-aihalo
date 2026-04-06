const express = require("express");
const {
  createStoreLocation,
  getAllStoreLocations,
  getMyStoreLocations,
  getStoreLocationById,
  updateStoreLocation,
  deleteStoreLocation,
  getNearbyStoreLocations,
} = require("../controller/storeLocation.controller");
const { authMiddleware, adminMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// Admin routes (specific routes first)
router.get("/admin/my-locations", authMiddleware, adminMiddleware, getMyStoreLocations);
router.post("/", authMiddleware, adminMiddleware, createStoreLocation);
router.put("/:id", authMiddleware, adminMiddleware, updateStoreLocation);
router.delete("/:id", authMiddleware, adminMiddleware, deleteStoreLocation);

// Public routes
router.get("/", getAllStoreLocations);
router.get("/nearby", getNearbyStoreLocations);
router.get("/:id", getStoreLocationById);

module.exports = router;
