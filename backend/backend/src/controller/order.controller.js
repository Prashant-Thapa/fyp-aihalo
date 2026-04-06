const {
  Order,
  OrderItem,
  Cart,
  Product,
  User,
  Rider,
  StoreLocation,
} = require("../models/index");
const { getIO, emitOrderCreated } = require("../socket/socketHandler");
const {
  autoAssignNearestRider,
} = require("../services/riderAssignment.service");
const { checkAndCreateAlerts, STOCK_THRESHOLD } = require("./stockAlert.controller");
const { emitStockAlert } = require("../socket/socketHandler");

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deliveryAddress, latitude, longitude, storeLocationId, paymentMethod } = req.body;

    console.log(`[ORDER_CREATE] Starting order creation for user ${userId}`);
    console.log(`[ORDER_CREATE] Selected store: ${storeLocationId}`);

    // Validate required fields
    if (!deliveryAddress || latitude === undefined || longitude === undefined) {
      console.log(`[ORDER_CREATE] ✗ Missing delivery details`);
      return res.status(400).json({
        success: false,
        message: "Delivery address, latitude, and longitude are required",
      });
    }

    if (!storeLocationId) {
      console.log(`[ORDER_CREATE] ✗ No store selected`);
      return res.status(400).json({
        success: false,
        message: "Store selection is required",
      });
    }

    // Validate latitude and longitude are valid numbers
    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);

    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      console.log(`[ORDER_CREATE] ✗ Invalid coordinates`);
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
      console.log(`[ORDER_CREATE] ✗ Coordinates out of range`);
      return res.status(400).json({
        success: false,
        message:
          "Latitude must be between -90 and 90, longitude between -180 and 180",
      });
    }

    // Validate store location exists and is active
    const parsedStoreId = parseInt(storeLocationId);
    if (isNaN(parsedStoreId)) {
      console.log(`[ORDER_CREATE] ✗ Invalid store ID: ${storeLocationId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid store location ID",
      });
    }

    const storeExists = await StoreLocation.findOne({
      where: {
        id: parsedStoreId,
        isActive: true,
      },
    });

    if (!storeExists) {
      console.log(
        `[ORDER_CREATE] ✗ Store ${parsedStoreId} not found or inactive`,
      );
      return res.status(400).json({
        success: false,
        message: "Selected store is not available",
      });
    }

    console.log(`[ORDER_CREATE] ✓ Store validated: ${storeExists.name}`);

    // Get user's cart items
    const cartItems = await Cart.findAll({
      where: { userId },
      include: [{ model: Product, as: "product" }],
    });

    if (cartItems.length === 0) {
      console.log(`[ORDER_CREATE] ✗ Cart is empty for user ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    console.log(`[ORDER_CREATE] ✓ Found ${cartItems.length} items in cart`);

    // Calculate total price
    let totalPrice = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        console.log(
          `[ORDER_CREATE] ✗ Insufficient stock for ${item.product.name}`,
        );
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
        });
      }
      totalPrice += parseFloat(item.product.price) * item.quantity;
    }

    console.log(`[ORDER_CREATE] ✓ Total price calculated: ${totalPrice}`);

    // Create order
    const order = await Order.create({
      userId,
      riderId: null, // Will be assigned automatically
      status: "pending",
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      deliveryAddress,
      latitude: parsedLat,
      longitude: parsedLon,
      storeLocationId: parsedStoreId,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: "pending",
    });

    console.log(
      `[ORDER_CREATE] ✓ Order created: ID=${order.id}, StoreID=${parsedStoreId}, Status=pending`,
    );

    // Create order items and track product IDs for stock alerts
    const updatedProductIds = [];
    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      });

      // Reduce stock
      await item.product.update({
        stock: item.product.stock - item.quantity,
      });
      updatedProductIds.push(item.productId);
    }

    console.log(`[ORDER_CREATE] ✓ Order items created`);

    // Check for low stock alerts after stock reduction
    try {
      const alerts = await checkAndCreateAlerts(updatedProductIds);
      for (const alert of alerts) {
        emitStockAlert(alert);
      }
    } catch (alertErr) {
      console.error("[STOCK_ALERT] Warning:", alertErr.message);
    }

    // Clear cart
    await Cart.destroy({ where: { userId } });

    // Auto-assign nearest available rider
    let assignedOrder = order;
    try {
      console.log(
        `[ORDER_CREATE] Starting auto-assignment for order ${order.id}...`,
      );
      assignedOrder = await autoAssignNearestRider(order);
      console.log(
        `[ORDER_CREATE] ✓ Auto-assignment completed. Rider assigned: ${assignedOrder.riderId || "NONE"}`,
      );
    } catch (assignmentError) {
      console.error(
        `[ORDER_CREATE] ✗ Rider assignment failed (continuing):`,
        assignmentError.message,
      );
      // Don't fail the order if rider assignment fails
    }

    // Fetch the complete order with associations
    const completeOrder = await Order.findByPk(assignedOrder.id, {
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
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: Rider,
          as: "rider",
          include: [
            { model: User, as: "user", attributes: ["id", "name", "email"] },
          ],
        },
      ],
    });

    console.log(
      `[ORDER_CREATE] ✓ Final order status: ${completeOrder.status}, Rider: ${completeOrder.riderId || "NONE"}`,
    );

    // Emit socket events to notify relevant parties
    try {
      // Emit new order to store room (all riders in this store)
      emitOrderCreated(completeOrder);

      // If a rider was assigned, emit assignment notification
      if (completeOrder.rider) {
        const { emitOrderAssigned } = require("../socket/socketHandler");
        emitOrderAssigned(completeOrder, completeOrder.rider);
      }
    } catch (e) {
      // Socket.IO might not be initialized during testing
      console.log("[ORDER_CREATE] Socket notification skipped:", e.message);
    }

    console.log(`[ORDER_CREATE] ✓ Order processing completed successfully`);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: completeOrder,
    });
  } catch (err) {
    console.error("[ORDER_CREATE] ✗ Error creating order:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get all orders for authenticated user
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId },
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
          model: Rider,
          as: "rider",
          include: [{ model: User, as: "user", attributes: ["id", "name"] }],
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

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "price", "imageUrl", "category"],
              include: [
                {
                  model: StoreLocation,
                  as: "storeLocation",
                  attributes: [
                    "id",
                    "name",
                    "address",
                    "latitude",
                    "longitude",
                  ],
                },
              ],
            },
          ],
        },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: Rider,
          as: "rider",
          include: [
            { model: User, as: "user", attributes: ["id", "name", "email"] },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
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

// Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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

// Reorder – re-add a past order's items to the cart
const reorderItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify order belongs to user
    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const outOfStock = [];
    let addedCount = 0;

    for (const item of order.items) {
      const product = item.product;
      if (!product || product.stock < 1) {
        outOfStock.push(product ? product.name : `Product #${item.productId}`);
        continue;
      }

      const qty = Math.min(item.quantity, product.stock);

      // Upsert into cart
      const existingCartItem = await Cart.findOne({
        where: { userId, productId: product.id },
      });

      if (existingCartItem) {
        const newQty = Math.min(existingCartItem.quantity + qty, product.stock);
        await existingCartItem.update({ quantity: newQty });
      } else {
        await Cart.create({ userId, productId: product.id, quantity: qty });
      }
      addedCount++;
    }

    return res.status(200).json({
      success: true,
      message:
        addedCount > 0 ? "Items added to cart" : "No items could be added",
      data: { addedCount, outOfStock },
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

// Confirm delivery (customer dual verification)
const confirmDelivery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        { model: Rider, as: "rider" },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivery can only be confirmed when status is 'delivered'",
      });
    }

    await order.update({ status: "completed" });

    // Release rider back to available pool
    if (order.riderId) {
      const rider = await Rider.findByPk(order.riderId);
      if (rider) {
        await rider.update({ isAvailable: true });
      }
    }

    // Emit socket events
    try {
      const io = getIO();
      io.to(`order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "completed",
        message: "Delivery confirmed! Order completed.",
        updatedAt: new Date(),
      });
      io.to(`customer_order_${order.id}`).emit("orderStatusUpdated", {
        orderId: order.id,
        status: "completed",
        message: "Thank you! Delivery confirmed.",
        updatedAt: new Date(),
      });
      // Notify rider
      if (order.riderId) {
        io.to(`rider_${order.rider?.id || order.riderId}`).emit("orderStatusUpdated", {
          orderId: order.id,
          status: "completed",
          message: `Order #${order.id} delivery confirmed by customer!`,
          updatedAt: new Date(),
        });
      }
    } catch (e) {
      console.log("Socket emit skipped:", e.message);
    }

    console.log(`[ORDER] ✓ Customer ${userId} confirmed delivery for order ${id}`);

    return res.status(200).json({
      success: true,
      message: "Delivery confirmed! Order completed.",
      data: order,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error", debug: err.message });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  reorderItems,
  confirmDelivery,
};
