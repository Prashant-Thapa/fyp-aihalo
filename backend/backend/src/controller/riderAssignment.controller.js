/**
 * Rider Assignment Controller
 * Handles rider assignment operations and management
 */

const {
  findNearestRider,
  assignRiderToOrder,
  autoAssignNearestRider,
  getNearbyRiders,
  reassignRider,
  releaseRider,
  updateRiderLocation,
} = require("../services/riderAssignment.service");
const {
  Order,
  Rider,
  StoreLocation,
  OrderItem,
  Product,
  User,
} = require("../models/index");
const assignmentConfig = require("../config/assignmentConfig");

/**
 * Find and assign nearest rider to an order
 * POST /api/riders/assign/:orderId
 */
const assignNearestRiderToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Verify order exists
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.riderId) {
      return res.status(400).json({
        success: false,
        message: "Order already has a rider assigned",
      });
    }

    // Get first store location (in a more complex system, this would come from the order's products)
    const storeLocation = await StoreLocation.findOne({
      where: { isActive: true },
    });
    if (!storeLocation) {
      return res.status(400).json({
        success: false,
        message: "No active store location found",
      });
    }

    // Find nearest rider
    const nearestRider = await findNearestRider(
      orderId,
      storeLocation.id,
      parseFloat(order.latitude),
      parseFloat(order.longitude),
      { maxRadius: storeLocation.radius },
    );

    if (!nearestRider) {
      return res.status(404).json({
        success: false,
        message: `No available riders found within ${storeLocation.radius} km`,
      });
    }

    // Assign rider to order
    const assignedOrder = await assignRiderToOrder(orderId, nearestRider.id);

    return res.status(200).json({
      success: true,
      message: "Rider assigned successfully",
      data: {
        order: assignedOrder,
        rider: nearestRider,
        distance: nearestRider.distanceToStore,
      },
    });
  } catch (error) {
    console.error("Error assigning rider:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Get nearby available riders for an order
 * GET /api/riders/nearby?latitude=X&longitude=Y&storeLocationId=Z&radius=5
 */
const getNearbyAvailableRiders = async (req, res) => {
  try {
    const { latitude, longitude, storeLocationId, radius } = req.query;

    if (!latitude || !longitude || !storeLocationId) {
      return res.status(400).json({
        success: false,
        message: "latitude, longitude, and storeLocationId are required",
      });
    }

    const searchRadius =
      parseFloat(radius) || assignmentConfig.MAX_ASSIGNMENT_RADIUS_KM;

    const riders = await getNearbyRiders(
      {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        storeLocationId: parseInt(storeLocationId),
      },
      searchRadius,
    );

    return res.status(200).json({
      success: true,
      data: {
        count: riders.length,
        riders,
        searchRadius,
      },
    });
  } catch (error) {
    console.error("Error getting nearby riders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Manually assign a specific rider to an order
 * POST /api/riders/assign-manual
 */
const manuallyAssignRider = async (req, res) => {
  try {
    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
      return res.status(400).json({
        success: false,
        message: "orderId and riderId are required",
      });
    }

    // Verify order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify rider exists
    const rider = await Rider.findByPk(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    // Assign rider
    const assignedOrder = await assignRiderToOrder(orderId, riderId);

    return res.status(200).json({
      success: true,
      message: "Rider assigned successfully",
      data: assignedOrder,
    });
  } catch (error) {
    console.error("Error assigning rider:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Reassign order to a different rider
 * POST /api/riders/reassign/:orderId
 */
const reassignOrderRider = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newRiderId } = req.body;

    if (!newRiderId) {
      return res.status(400).json({
        success: false,
        message: "newRiderId is required",
      });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const reassignedOrder = await reassignRider(orderId, newRiderId);

    return res.status(200).json({
      success: true,
      message: "Order reassigned successfully",
      data: reassignedOrder,
    });
  } catch (error) {
    console.error("Error reassigning rider:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Release rider after completing delivery
 * PUT /api/riders/:riderId/release
 */
const releaseRiderAfterDelivery = async (req, res) => {
  try {
    const { riderId } = req.params;

    const rider = await Rider.findByPk(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    const releasedRider = await releaseRider(riderId);

    return res.status(200).json({
      success: true,
      message: "Rider released successfully",
      data: releasedRider,
    });
  } catch (error) {
    console.error("Error releasing rider:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Update rider's current location (real-time tracking)
 * PUT /api/riders/:riderId/location
 */
const updateCurrentRiderLocation = async (req, res) => {
  try {
    const { riderId } = req.params;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude are required",
      });
    }

    const updatedRider = await updateRiderLocation(
      riderId,
      latitude,
      longitude,
    );

    return res.status(200).json({
      success: true,
      message: "Rider location updated successfully",
      data: updatedRider,
    });
  } catch (error) {
    console.error("Error updating rider location:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

/**
 * Get rider's assigned orders
 * GET /api/riders/:riderId/orders
 */
const getRiderAssignedOrders = async (req, res) => {
  try {
    const { riderId } = req.params;

    const rider = await Rider.findByPk(riderId, {
      include: [
        {
          model: Order,
          as: "orders",
          include: [
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
              model: User,
              as: "user",
              attributes: ["id", "name", "email", "phone"],
            },
          ],
        },
      ],
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        riderId,
        orders: rider.orders || [],
        isAvailable: rider.isAvailable,
      },
    });
  } catch (error) {
    console.error("Error getting rider orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: error.message,
    });
  }
};

module.exports = {
  assignNearestRiderToOrder,
  getNearbyAvailableRiders,
  manuallyAssignRider,
  reassignOrderRider,
  releaseRiderAfterDelivery,
  updateCurrentRiderLocation,
  getRiderAssignedOrders,
};
