const sequelize = require("../config/db");
const { Rider, Order, StoreLocation, User } = require("../models/index");
const {
  calculateDistance,
  calculateDistanceWithMetrics,
} = require("../utils/distanceCalculator");

// Configuration for rider assignment
const ASSIGNMENT_CONFIG = {
  MAX_RADIUS_KM: 5, // Maximum radius to search for riders (km)
  MIN_RIDER_RATING: 3.5, // Minimum rider rating (optional)
  PREFER_VERIFIED_ONLY: true, // Only assign verified riders
};

// Get socket instance - will be set by server
let io = null;
const setSocketIO = (socketIO) => {
  io = socketIO;
};
const getSocketIO = () => io;

/**
 * Find the nearest available rider for an order
 * @param {number} orderId - Order ID
 * @param {number} storeLocationId - Store location ID
 * @param {number} deliveryLat - Delivery latitude
 * @param {number} deliveryLon - Delivery longitude
 * @param {object} options - Additional options (radius, etc.)
 * @returns {object} Nearest rider or null if none found
 */
const findNearestRider = async (
  orderId,
  storeLocationId,
  deliveryLat,
  deliveryLon,
  options = {},
) => {
  try {
    const maxRadius = options.maxRadius || ASSIGNMENT_CONFIG.MAX_RADIUS_KM;
    const excludeRiderIds = options.excludeRiderIds || [];

    // Get store location
    const storeLocation = await StoreLocation.findByPk(storeLocationId);
    if (!storeLocation) {
      throw new Error("Store location not found");
    }

    console.log(
      `[RIDER_ASSIGNMENT] Finding nearest rider for order ${orderId} to delivery (${deliveryLat}, ${deliveryLon})`,
    );

    // Build base WHERE clause — exclude only explicitly offline riders
    const { Op } = require("sequelize");
    const baseWhere = {
      storeLocationId,
      isAvailable: true,
      [Op.or]: [
        { isOnline: true },
        { isOnline: null },  // existing riders may have NULL before migration
      ],
    };

    // Exclude rejected riders if any
    if (excludeRiderIds.length > 0) {
      baseWhere.id = { [Op.notIn]: excludeRiderIds };
    }

    console.log(`[RIDER_ASSIGNMENT] Base filter: storeId=${storeLocationId}, excludeRiders=[${excludeRiderIds.join(",")}]`);

    // Fetch available riders for this store
    // Strategy: Try verified+approved first, then verified, then any available
    let availableRiders = await Rider.findAll({
      where: {
        ...baseWhere,
        isVerified: true,
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    console.log(
      `[RIDER_ASSIGNMENT] Found ${availableRiders.length} verified+approved riders for store ${storeLocationId}`,
    );

    // If no verified approved riders, try verified riders (any status)
    if (availableRiders.length === 0) {
      console.log(
        `[RIDER_ASSIGNMENT] No verified+approved riders found, searching for verified riders...`,
      );
      availableRiders = await Rider.findAll({
        where: {
          ...baseWhere,
          isVerified: true,
        },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone"],
          },
        ],
      });
      console.log(
        `[RIDER_ASSIGNMENT] Found ${availableRiders.length} verified riders (any status)`,
      );
    }

    // If still no riders, try ANY available rider
    if (availableRiders.length === 0) {
      console.log(
        `[RIDER_ASSIGNMENT] No verified riders found, searching for ANY available rider`,
      );
      availableRiders = await Rider.findAll({
        where: baseWhere,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email", "phone"],
          },
        ],
      });
      console.log(
        `[RIDER_ASSIGNMENT] Found ${availableRiders.length} available riders (any status/verification)`,
      );
    }

    if (availableRiders.length === 0) {
      console.log(
        `[RIDER_ASSIGNMENT] No available riders found within store ${storeLocationId}`,
      );
      return null;
    }

    // Calculate distances from each rider to store and delivery
    const ridersWithDistance = availableRiders
      .map((rider) => {
        const storeLat = parseFloat(storeLocation.latitude);
        const storeLon = parseFloat(storeLocation.longitude);
        const riderLat = parseFloat(rider.latitude);
        const riderLon = parseFloat(rider.longitude);
        const delLat = parseFloat(deliveryLat);
        const delLon = parseFloat(deliveryLon);

        // Validate coordinates
        if (
          isNaN(storeLat) ||
          isNaN(storeLon) ||
          isNaN(riderLat) ||
          isNaN(riderLon) ||
          isNaN(delLat) ||
          isNaN(delLon)
        ) {
          console.warn(
            `Invalid coordinates for rider ${rider.id}: store(${storeLat}, ${storeLon}), rider(${riderLat}, ${riderLon}), delivery(${delLat}, ${delLon})`,
          );
          return null;
        }

        const distanceToStore = calculateDistance(
          storeLat,
          storeLon,
          riderLat,
          riderLon,
        );
        const distanceToDelivery = calculateDistance(
          delLat,
          delLon,
          riderLat,
          riderLon,
        );

        const riderData = {
          ...rider.dataValues,
          distanceToStore: parseFloat(distanceToStore.toFixed(2)),
          distanceToDelivery: parseFloat(distanceToDelivery.toFixed(2)),
          totalDistance: parseFloat(
            (distanceToStore + distanceToDelivery).toFixed(2),
          ),
        };

        console.log(
          `[RIDER_ASSIGNMENT] Rider ${rider.id} (${rider.user?.name}): Store=${riderData.distanceToStore}km, Delivery=${riderData.distanceToDelivery}km, Total=${riderData.totalDistance}km, Verified=${rider.isVerified}, Status=${rider.status}`,
        );

        return riderData;
      })
      .filter((rider) => rider !== null && rider.distanceToStore <= maxRadius)
      .sort((a, b) => a.distanceToStore - b.distanceToStore);

    if (ridersWithDistance.length === 0) {
      console.log(
        `[RIDER_ASSIGNMENT] No riders within ${maxRadius}km radius or all exceed max distance`,
      );
      return null;
    }

    const nearestRider = ridersWithDistance[0];
    console.log(
      `[RIDER_ASSIGNMENT] ✓ Selected nearest rider: ${nearestRider.id} (${nearestRider.user?.name}) at ${nearestRider.totalDistance}km away`,
    );

    // Return the nearest rider
    return nearestRider;
  } catch (error) {
    console.error("Error finding nearest rider:", error);
    throw error;
  }
};

/**
 * Assign a rider to an order
 * @param {number} orderId - Order ID
 * @param {number} riderId - Rider ID to assign
 * @returns {object} Updated order
 */
const assignRiderToOrder = async (orderId, riderId) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const rider = await Rider.findByPk(riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    if (!rider.isAvailable) {
      throw new Error("Rider is not available");
    }

    // Update order with rider assignment
    await order.update({
      riderId,
      status: "rider_assigned",
    });

    // Mark rider as busy
    await rider.update({
      isAvailable: false,
    });

    // Fetch updated order with associations
    const updatedOrder = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: Rider,
          as: "rider",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "name", "email", "phone"],
            },
          ],
        },
      ],
    });

    // Send socket notification to the assigned rider
    try {
      const socketIO = getSocketIO();
      if (socketIO) {
        console.log(
          `[RIDER_ASSIGNMENT] Emitting newOrderAssigned to rider room: rider_${riderId}`,
        );
        socketIO.to(`rider_${riderId}`).emit("newOrderAssigned", {
          orderId: updatedOrder.id,
          order: updatedOrder,
          message: `New order #${updatedOrder.id} assigned to you!`,
          timestamp: new Date(),
        });

        // Also emit to all riders in the store to update their available orders
        socketIO
          .to(`store_${order.storeLocationId}`)
          .emit("orderStatusChanged", {
            orderId: updatedOrder.id,
            status: "rider_assigned",
            riderId,
            timestamp: new Date(),
          });
      }
    } catch (socketError) {
      console.log(
        "Socket notification skipped (socket not initialized):",
        socketError.message,
      );
    }

    console.log(
      `[RIDER_ASSIGNMENT] ✓ Order ${orderId} assigned to rider ${riderId} (${rider.user?.name})`,
    );

    return updatedOrder;
  } catch (error) {
    console.error("Error assigning rider to order:", error);
    throw error;
  }
};

/**
 * Auto-assign nearest rider when order is created
 * @param {object} order - Order object
 * @returns {object} Updated order with assigned rider or null
 */
const autoAssignNearestRider = async (order) => {
  try {
    console.log(`[AUTO_ASSIGN] Starting auto-assignment for order ${order.id}`);

    // Get store location
    const storeLocation = await StoreLocation.findByPk(order.storeLocationId);
    console.log("Tje stpre location", storeLocation)
    if (!storeLocation) {
      console.warn(
        `[AUTO_ASSIGN] Store location ${order.storeLocationId} not found for order ${order.id}`,
      );
      return order;
    }

    console.log(
      `[AUTO_ASSIGN] Found store: ${storeLocation.name} (ID: ${storeLocation.id})`,
    );


    const nearestRider = await findNearestRider(
      order.id,
      storeLocation.id,
      parseFloat(order.latitude),
      parseFloat(order.longitude),
      { maxRadius: storeLocation.radius || ASSIGNMENT_CONFIG.MAX_RADIUS_KM },
    );
    console.log("The nearstrider", nearestRider)

    if (nearestRider) {
      console.log(
        `[AUTO_ASSIGN] ✓ Assigning rider ${nearestRider.id} to order ${order.id}`,
      );
      const assignedOrder = await assignRiderToOrder(order.id, nearestRider.id);
      console.log(
        `[AUTO_ASSIGN] ✓ Order ${order.id} assigned to rider ${nearestRider.id}`,
      );
      return assignedOrder;
    } else {
      console.warn(
        `[AUTO_ASSIGN] ⚠ No nearest rider found for order ${order.id} at store ${storeLocation.name}`,
      );
      return order;
    }
  } catch (error) {
    console.error(
      `[AUTO_ASSIGN] ✗ Error in auto-assign for order ${order.id}:`,
      error.message,
    );
    return order;
  }
};

/**
 * Get all nearby riders for a location
 * Useful for manual assignment or showing available riders
 * @param {object} location - Location object { latitude, longitude, storeLocationId }
 * @param {number} radiusKm - Search radius in km
 * @returns {array} Array of nearby riders sorted by distance
 */
const getNearbyRiders = async (
  location,
  radiusKm = ASSIGNMENT_CONFIG.MAX_RADIUS_KM,
) => {
  try {
    const { latitude, longitude, storeLocationId } = location;

    const availableRiders = await Rider.findAll({
      where: {
        storeLocationId,
        isAvailable: true,
        isVerified: ASSIGNMENT_CONFIG.PREFER_VERIFIED_ONLY,
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
    });

    const ridersWithDistance = availableRiders
      .map((rider) => {
        const distance = calculateDistanceWithMetrics(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(rider.latitude),
          parseFloat(rider.longitude),
        );

        return {
          ...rider.dataValues,
          ...distance,
        };
      })
      .filter((rider) => rider.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return ridersWithDistance;
  } catch (error) {
    console.error("Error getting nearby riders:", error);
    throw error;
  }
};

/**
 * Reassign order to a different rider
 * Used when rider cannot complete delivery or needs support
 * @param {number} orderId - Order ID
 * @param {number} newRiderId - New rider ID
 * @returns {object} Updated order
 */
const reassignRider = async (orderId, newRiderId) => {
  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    // Release current rider if any
    if (order.riderId) {
      const currentRider = await Rider.findByPk(order.riderId);
      if (currentRider) {
        await currentRider.update({ isAvailable: true });
      }
    }

    // Assign new rider
    return await assignRiderToOrder(orderId, newRiderId);
  } catch (error) {
    console.error("Error reassigning rider:", error);
    throw error;
  }
};

/**
 * Mark rider as available after completing delivery
 * @param {number} riderId - Rider ID
 * @returns {object} Updated rider
 */
const releaseRider = async (riderId) => {
  try {
    const rider = await Rider.findByPk(riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    await rider.update({ isAvailable: true });
    return rider;
  } catch (error) {
    console.error("Error releasing rider:", error);
    throw error;
  }
};

/**
 * Update rider's current location (real-time tracking)
 * @param {number} riderId - Rider ID
 * @param {number} latitude - Current latitude
 * @param {number} longitude - Current longitude
 * @returns {object} Updated rider
 */
const updateRiderLocation = async (riderId, latitude, longitude) => {
  try {
    const rider = await Rider.findByPk(riderId);
    if (!rider) {
      throw new Error("Rider not found");
    }

    await rider.update({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });

    return rider;
  } catch (error) {
    console.error("Error updating rider location:", error);
    throw error;
  }
};

/**
 * Smart reassignment: assign the next nearest available rider for an order
 * Filters out riders in the order's rejectedRiders list and offline riders
 * @param {number} orderId - Order ID
 * @returns {object|null} Updated order with new rider, or null if no rider found
 */
const assignNextRider = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [{ model: StoreLocation, as: "storeLocation" }],
    });
    if (!order) {
      throw new Error("Order not found");
    }

    const storeLocation = order.storeLocation || await StoreLocation.findByPk(order.storeLocationId);
    if (!storeLocation) {
      console.warn(`[REASSIGN] Store location not found for order ${orderId}`);
      return null;
    }

    // Parse rejectedRiders (MySQL JSON may return string)
    let rejectedRiders = order.rejectedRiders || [];
    if (typeof rejectedRiders === "string") {
      try { rejectedRiders = JSON.parse(rejectedRiders); } catch { rejectedRiders = []; }
    }
    // Ensure all IDs are numbers for proper SQL comparison
    rejectedRiders = rejectedRiders.map(id => parseInt(id)).filter(id => !isNaN(id));
    console.log(`[REASSIGN] Finding next rider for order ${orderId}, excluded riders: [${rejectedRiders.join(", ")}]`);

    const nearestRider = await findNearestRider(
      orderId,
      storeLocation.id,
      parseFloat(order.latitude),
      parseFloat(order.longitude),
      {
        maxRadius: storeLocation.radius || ASSIGNMENT_CONFIG.MAX_RADIUS_KM,
        excludeRiderIds: rejectedRiders,
      },
    );

    if (nearestRider) {
      console.log(`[REASSIGN] ✓ Assigning rider ${nearestRider.id} to order ${orderId}`);
      const assignedOrder = await assignRiderToOrder(orderId, nearestRider.id);
      return assignedOrder;
    } else {
      console.warn(`[REASSIGN] ⚠ No available riders for order ${orderId}. All rejected or offline.`);
      // Emit socket event so admin/customer knows
      try {
        const socketIO = getSocketIO();
        if (socketIO) {
          socketIO.to(`store_${storeLocation.id}`).emit("noRiderAvailable", {
            orderId,
            message: `No riders available for order #${orderId}`,
            timestamp: new Date(),
          });
          socketIO.to(`customer_order_${orderId}`).emit("noRiderAvailable", {
            orderId,
            message: "All nearby riders are busy. Please wait...",
            timestamp: new Date(),
          });
        }
      } catch (socketErr) {
        console.log("[REASSIGN] Socket emit skipped:", socketErr.message);
      }
      return null;
    }
  } catch (error) {
    console.error(`[REASSIGN] ✗ Error in assignNextRider for order ${orderId}:`, error.message);
    throw error;
  }
};

module.exports = {
  ASSIGNMENT_CONFIG,
  findNearestRider,
  assignRiderToOrder,
  autoAssignNearestRider,
  getNearbyRiders,
  reassignRider,
  releaseRider,
  updateRiderLocation,
  assignNextRider,
  setSocketIO,
  getSocketIO,
};
