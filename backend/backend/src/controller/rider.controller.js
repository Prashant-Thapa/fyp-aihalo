const Rider = require("../models/rider.model");
const User = require("../models/user.model");
const StoreLocation = require("../models/storeLocation.model");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

// Calculate distance using Haversine formula
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

// Register as a rider
const registerRider = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      latitude,
      longitude,
      storeLocationId,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !licenseNumber ||
      !latitude ||
      !longitude ||
      !storeLocationId
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if store location exists and is active
    const storeLocation = await StoreLocation.findOne({
      where: { id: storeLocationId, isActive: true },
    });

    if (!storeLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      });
    }

    // Calculate distance between rider and store location
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(storeLocation.latitude),
      parseFloat(storeLocation.longitude),
    );

    // Check if rider is within the store's radius (default 10km)
    if (distance > storeLocation.radius) {
      return res.status(400).json({
        success: false,
        message: `You are ${distance.toFixed(2)} km away from the store. You must be within ${storeLocation.radius} km to register as a rider for this location.`,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with rider role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "rider",
    });

    // Create rider profile
    const rider = await Rider.create({
      userId: user.id,
      phone,
      vehicleType: vehicleType || "bike",
      vehicleNumber,
      licenseNumber,
      latitude,
      longitude,
      storeLocationId,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Rider registration submitted successfully. Awaiting admin approval.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        rider: {
          id: rider.id,
          phone: rider.phone,
          vehicleType: rider.vehicleType,
          status: rider.status,
        },
      },
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

// Get all riders (admin only)
const getAllRiders = async (req, res) => {
  try {
    const riders = await Rider.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: riders,
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

// Get riders by store location (admin)
const getRidersByStoreLocation = async (req, res) => {
  try {
    const { storeLocationId } = req.params;
    const adminId = req.user.id;

    // Verify admin owns this store location
    const storeLocation = await StoreLocation.findOne({
      where: { id: storeLocationId, adminId },
    });

    if (!storeLocation) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this store location",
      });
    }

    const riders = await Rider.findAll({
      where: { storeLocationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: riders,
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

// Approve or reject rider (admin)
const updateRiderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved', 'rejected', or 'pending'",
      });
    }

    const rider = await Rider.findByPk(id, {
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          where: { adminId },
        },
      ],
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found or unauthorized",
      });
    }

    await rider.update({
      status,
      isVerified: status === "approved",
    });

    return res.status(200).json({
      success: true,
      message: `Rider ${status} successfully`,
      data: rider,
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

// Update rider availability
const updateRiderAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAvailable, latitude, longitude } = req.body;

    const rider = await Rider.findOne({ where: { userId } });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      });
    }

    const updateData = { lastSeen: new Date() };
    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
      updateData.isOnline = isAvailable; // Keep isOnline in sync — critical for production where socket may not be connected
    }
    if (latitude) updateData.latitude = latitude;
    if (longitude) updateData.longitude = longitude;

    await rider.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Rider availability updated",
      data: rider,
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

// Get rider profile
const getRiderProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const rider = await Rider.findOne({
      where: { userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: rider,
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

// Get orders assigned to rider
const getRiderOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const rider = await Rider.findOne({ where: { userId } });
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      });
    }

    const Order = require("../models/order.model");
    const OrderItem = require("../models/orderItem.model");
    const Product = require("../models/product.model");

    const orders = await Order.findAll({
      where: { riderId: rider.id },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price", "imageUrl"],
            },
          ],
        },
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address", "latitude", "longitude"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: orders,
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

// Update order status (rider)
const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "accepted",
      "picked_up",
      "on_the_way",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const rider = await Rider.findOne({ where: { userId } });
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      });
    }

    const Order = require("../models/order.model");
    const OrderItem = require("../models/orderItem.model");
    const Product = require("../models/product.model");

    const order = await Order.findOne({
      where: { id, riderId: rider.id },
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price", "imageUrl"],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not assigned to you",
      });
    }

    await order.update({ status });

    // Emit Socket.IO event
    try {
      const { getIO } = require("../socket/socketHandler");
      const io = getIO();
      io.to(`order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status,
        updatedAt: new Date(),
        order,
      });
    } catch (e) {
      console.log("Socket not available for status update notification");
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
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

// Update rider's current location coordinates
const updateRiderLocation = async (req, res) => {
  try {
    // Look up rider by userId (the JWT stores .id = userId, not riderId)
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude values",
      });
    }

    if (
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLon < -180 ||
      parsedLon > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude must be between -90 and 90, longitude between -180 and 180",
      });
    }

    // Find rider by userId (same as all other rider endpoints)
    const rider = await Rider.findOne({ where: { userId } });
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      });
    }

    await rider.update({
      latitude: parsedLat,
      longitude: parsedLon,
    });

    console.log(
      `[RIDER] Updated location for rider ${rider.id} (user ${userId}): (${parsedLat}, ${parsedLon})`,
    );

    // Emit real-time location update to any active order room for this rider
    try {
      const Order = require("../models/order.model");
      const { getIO } = require("../socket/socketHandler");
      const activeOrder = await Order.findOne({
        where: {
          riderId: rider.id,
          status: { [Op.in]: ["rider_assigned", "accepted", "picked_up", "on_the_way"] },
        },
      });
      if (activeOrder) {
        const io = getIO();
        io.to(`order_${activeOrder.id}`).emit("riderLocationUpdated", {
          orderId: activeOrder.id,
          riderId: rider.id,
          latitude: parsedLat,
          longitude: parsedLon,
          timestamp: new Date(),
        });
        console.log(`[RIDER] Emitted live location to order_${activeOrder.id}`);
      }
    } catch (socketErr) {
      // Non-critical — don't fail the response
      console.log("[RIDER] Socket emit skipped:", socketErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        id: rider.id,
        latitude: parsedLat,
        longitude: parsedLon,
        storeLocationId: rider.storeLocationId,
      },
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

// Check if a delivery location is within store coverage area
const checkLocationCoverage = async (req, res) => {
  try {
    const { storeLocationId, latitude, longitude } = req.body;

    if (!storeLocationId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Store location ID, latitude, and longitude are required",
      });
    }

    const storeLocation = await StoreLocation.findByPk(storeLocationId);
    if (!storeLocation) {
      return res.status(404).json({
        success: false,
        message: "Store location not found",
      });
    }

    // Calculate distance from store to delivery location
    const R = 6371; // Earth radius in km
    const dLat = toRad(
      parseFloat(latitude) - parseFloat(storeLocation.latitude),
    );
    const dLon = toRad(
      parseFloat(longitude) - parseFloat(storeLocation.longitude),
    );
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(parseFloat(storeLocation.latitude))) *
      Math.cos(toRad(parseFloat(latitude))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const radius = storeLocation.radius || 10;
    const isInCoverage = distance <= radius;

    console.log(
      `[COVERAGE] Store ${storeLocation.name} coverage check: distance=${distance.toFixed(2)}km, radius=${radius}km, coverage=${isInCoverage}`,
    );

    return res.status(200).json({
      success: true,
      data: {
        isInCoverage,
        distance: parseFloat(distance.toFixed(2)),
        radius,
        message: isInCoverage
          ? `Location is within ${radius}km coverage`
          : `Location is ${distance.toFixed(2)}km away (outside ${radius}km radius)`,
      },
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

// Accept an assigned order (rider)
const acceptOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const rider = await Rider.findOne({ where: { userId } });
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider profile not found" });
    }

    const Order = require("../models/order.model");
    const order = await Order.findOne({ where: { id, riderId: rider.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    if (order.status !== "rider_assigned") {
      return res.status(400).json({ success: false, message: "Order can only be accepted when status is rider_assigned" });
    }

    await order.update({ status: "accepted" });

    // Emit socket event
    try {
      const { getIO } = require("../socket/socketHandler");
      const io = getIO();
      io.to(`order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "accepted",
        updatedAt: new Date(),
      });
      io.to(`customer_order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "accepted",
        message: "Rider has accepted your order!",
        updatedAt: new Date(),
      });
    } catch (e) {
      console.log("Socket emit skipped:", e.message);
    }

    console.log(`[RIDER] ✓ Rider ${rider.id} accepted order ${id}`);
    return res.status(200).json({
      success: true,
      message: "Order accepted successfully",
      data: order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error", debug: err.message });
  }
};

// Reject an assigned order (rider) — triggers smart reassignment
const rejectOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const rider = await Rider.findOne({ where: { userId } });
    if (!rider) {
      return res.status(404).json({ success: false, message: "Rider profile not found" });
    }

    const Order = require("../models/order.model");
    const order = await Order.findOne({ where: { id, riderId: rider.id } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found or not assigned to you" });
    }

    if (order.status !== "rider_assigned") {
      return res.status(400).json({ success: false, message: "Order can only be rejected when status is rider_assigned" });
    }

    // Add this rider to rejected list (parse JSON defensively)
    let rejectedRiders = order.rejectedRiders || [];
    if (typeof rejectedRiders === "string") {
      try { rejectedRiders = JSON.parse(rejectedRiders); } catch { rejectedRiders = []; }
    }
    if (!rejectedRiders.includes(rider.id)) {
      rejectedRiders.push(rider.id);
    }

    // Reset order: remove rider assignment, set back to pending
    await order.update({
      riderId: null,
      status: "pending",
      rejectedRiders,
    });

    // Release rider back to available pool
    await rider.update({ isAvailable: true });

    console.log(`[RIDER] ✗ Rider ${rider.id} rejected order ${id}. Rejected riders: [${rejectedRiders.join(", ")}]`);

    // Emit socket events
    try {
      const { getIO } = require("../socket/socketHandler");
      const io = getIO();
      io.to(`order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "pending",
        message: "Rider declined. Finding another rider...",
        updatedAt: new Date(),
      });
      io.to(`customer_order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "pending",
        message: "Finding another rider for your order...",
        updatedAt: new Date(),
      });
    } catch (e) {
      console.log("Socket emit skipped:", e.message);
    }

    // Smart reassignment — find next nearest rider
    let reassignedOrder = null;
    try {
      const { assignNextRider } = require("../services/riderAssignment.service");
      reassignedOrder = await assignNextRider(parseInt(id));
    } catch (reassignErr) {
      console.error(`[RIDER] Reassignment failed for order ${id}:`, reassignErr.message);
    }

    return res.status(200).json({
      success: true,
      message: reassignedOrder
        ? `Order rejected. Reassigned to rider #${reassignedOrder.riderId}`
        : "Order rejected. No available rider found — order is pending.",
      data: reassignedOrder || order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error", debug: err.message });
  }
};

module.exports = {
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
};
