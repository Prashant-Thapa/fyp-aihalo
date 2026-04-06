const StoreLocation = require("../models/storeLocation.model");

// Create a new store location
const createStoreLocation = async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius } = req.body;
    const adminId = req.user.id;

    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Name, address, latitude, and longitude are required",
      });
    }

    const storeLocation = await StoreLocation.create({
      name,
      address,
      latitude,
      longitude,
      radius: radius || 10,
      adminId,
    });

    return res.status(201).json({
      success: true,
      message: "Store location created successfully",
      data: storeLocation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get all store locations
const getAllStoreLocations = async (req, res) => {
  try {
    const storeLocations = await StoreLocation.findAll({
      where: { isActive: true },
    });

    return res.status(200).json({
      success: true,
      data: storeLocations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get store locations by admin
const getMyStoreLocations = async (req, res) => {
  try {
    const adminId = req.user.id;
    const storeLocations = await StoreLocation.findAll({
      where: { adminId, isActive: true },
    });

    return res.status(200).json({
      success: true,
      data: storeLocations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get store location by ID
const getStoreLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const storeLocation = await StoreLocation.findByPk(id);

    if (!storeLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: storeLocation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Update store location
const updateStoreLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, latitude, longitude, radius, isActive } = req.body;
    const adminId = req.user.id;

    const storeLocation = await StoreLocation.findOne({
      where: { id, adminId },
    });

    if (!storeLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found or unauthorized",
      });
    }

    await storeLocation.update({
      name: name || storeLocation.name,
      address: address || storeLocation.address,
      latitude: latitude || storeLocation.latitude,
      longitude: longitude || storeLocation.longitude,
      radius: radius || storeLocation.radius,
      isActive: isActive !== undefined ? isActive : storeLocation.isActive,
    });

    return res.status(200).json({
      success: true,
      message: "Store location updated successfully",
      data: storeLocation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Delete store location (soft delete)
const deleteStoreLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const storeLocation = await StoreLocation.findOne({
      where: { id, adminId },
    });

    if (!storeLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found or unauthorized",
      });
    }

    await storeLocation.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Store location deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get nearby store locations based on user's location
const getNearbyStoreLocations = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const storeLocations = await StoreLocation.findAll({
      where: { isActive: true },
    });

    // Filter locations within radius using Haversine formula
    const nearbyLocations = storeLocations.filter((location) => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      );
      return distance <= location.radius;
    });

    return res.status(200).json({
      success: true,
      data: nearbyLocations,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Haversine formula to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => (value * Math.PI) / 180;

module.exports = {
  createStoreLocation,
  getAllStoreLocations,
  getMyStoreLocations,
  getStoreLocationById,
  updateStoreLocation,
  deleteStoreLocation,
  getNearbyStoreLocations,
};
