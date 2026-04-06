let io = null;

// Track connected riders: socketId -> riderId
const connectedRiders = new Map();

const initSocket = (server) => {
  const { Server } = require("socket.io");
  const { setSocketIO } = require("../services/riderAssignment.service");
  const Rider = require("../models/rider.model");

  io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Set socket instance in rider assignment service for notifications
  setSocketIO(io);

  io.on("connection", (socket) => {
    console.log(`[SOCKET] ✓ Connected: ${socket.id}`);

    // ============ JOIN/LEAVE ROOM EVENTS ============

    // Rider joins their personal rider room to receive order assignments
    socket.on("joinRiderRoom", async (riderId) => {
      const riderRoom = `rider_${riderId}`;
      socket.join(riderRoom);
      connectedRiders.set(socket.id, riderId);
      console.log(`[SOCKET] ✓ Rider ${riderId} joined room: ${riderRoom}`);

      // Mark rider as online
      try {
        await Rider.update(
          { isOnline: true, lastSeen: new Date() },
          { where: { id: riderId } },
        );
        console.log(`[SOCKET] ✓ Rider ${riderId} marked ONLINE`);
      } catch (err) {
        console.error(`[SOCKET] Failed to update rider online status:`, err.message);
      }
    });

    // Rider leaves their personal rider room
    socket.on("leaveRiderRoom", async (riderId) => {
      const riderRoom = `rider_${riderId}`;
      socket.leave(riderRoom);
      connectedRiders.delete(socket.id);
      console.log(`[SOCKET] ✓ Rider ${riderId} left room: ${riderRoom}`);

      // Mark rider as offline
      try {
        await Rider.update(
          { isOnline: false, lastSeen: new Date() },
          { where: { id: riderId } },
        );
        console.log(`[SOCKET] ✓ Rider ${riderId} marked OFFLINE`);
      } catch (err) {
        console.error(`[SOCKET] Failed to update rider offline status:`, err.message);
      }
    });

    // Join a store room (for receiving orders and updates for that store)
    socket.on("joinStoreRoom", (storeLocationId) => {
      const storeRoom = `store_${storeLocationId}`;
      socket.join(storeRoom);
      console.log(`[SOCKET] ✓ Joined store room: ${storeRoom}`);
    });

    // Leave store room
    socket.on("leaveStoreRoom", (storeLocationId) => {
      const storeRoom = `store_${storeLocationId}`;
      socket.leave(storeRoom);
      console.log(`[SOCKET] ✓ Left store room: ${storeRoom}`);
    });

    // Join an order room for real-time tracking
    socket.on("joinOrder", (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`[SOCKET] ✓ Joined order room: order_${orderId}`);
    });

    // Leave an order room
    socket.on("leaveOrder", (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`[SOCKET] ✓ Left order room: order_${orderId}`);
    });

    // Admin joins admin room for all store updates
    socket.on("joinAdminRoom", (adminId) => {
      const adminRoom = `admin_${adminId}`;
      socket.join(adminRoom);
      console.log(`[SOCKET] ✓ Admin ${adminId} joined room: ${adminRoom}`);
    });

    // Admin leaves admin room
    socket.on("leaveAdminRoom", (adminId) => {
      const adminRoom = `admin_${adminId}`;
      socket.leave(adminRoom);
      console.log(`[SOCKET] ✓ Admin ${adminId} left room: ${adminRoom}`);
    });

    // Customer joins order tracking room
    socket.on("joinCustomerOrder", (orderId) => {
      socket.join(`customer_order_${orderId}`);
      console.log(
        `[SOCKET] ✓ Customer joined order tracking: customer_order_${orderId}`,
      );
    });

    socket.on("leaveCustomerOrder", (orderId) => {
      socket.leave(`customer_order_${orderId}`);
      console.log(
        `[SOCKET] ✓ Customer left order tracking: customer_order_${orderId}`,
      );
    });

    // ============ HEARTBEAT EVENT ============

    // Rider heartbeat — keeps lastSeen updated
    socket.on("riderHeartbeat", async (data) => {
      const riderId = data?.riderId || connectedRiders.get(socket.id);
      if (riderId) {
        try {
          await Rider.update(
            { lastSeen: new Date(), isOnline: true },
            { where: { id: riderId } },
          );
        } catch (err) {
          // Silent - heartbeat failures should not log excessively
        }
      }
    });

    // ============ LOCATION EVENTS ============

    // Rider sends real-time location update during delivery
    socket.on("riderLocationUpdate", async (data) => {
      const { orderId, riderId, latitude, longitude } = data;
      console.log(
        `[SOCKET] Location update - Rider ${riderId} on Order ${orderId}: (${latitude}, ${longitude})`,
      );

      // Emit to order room (customer + admin tracking this order)
      io.to(`order_${orderId}`).emit("riderLocationUpdated", {
        orderId,
        riderId,
        latitude,
        longitude,
        timestamp: new Date(),
      });

      // Also emit to the customer order room
      io.to(`customer_order_${orderId}`).emit("riderLocationUpdated", {
        orderId,
        riderId,
        latitude,
        longitude,
        timestamp: new Date(),
      });

      // Persist rider location to DB
      try {
        await Rider.update(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude), lastSeen: new Date() },
          { where: { id: riderId } },
        );
      } catch (err) {
        // Non-critical
      }
    });

    // ============ AVAILABILITY EVENTS ============

    // Rider updates their availability status
    socket.on("riderAvailabilityChange", async (data) => {
      const { riderId, storeLocationId, isAvailable } = data;
      console.log(
        `[SOCKET] Rider ${riderId} availability: ${isAvailable ? "ONLINE" : "OFFLINE"}`,
      );

      // Update rider online status in DB
      try {
        await Rider.update(
          { isOnline: isAvailable, isAvailable, lastSeen: new Date() },
          { where: { id: riderId } },
        );
      } catch (err) {
        console.error("[SOCKET] Failed to update availability:", err.message);
      }

      // Notify store and admin that a rider's availability changed
      io.to(`store_${storeLocationId}`).emit("riderAvailabilityChanged", {
        riderId,
        storeLocationId,
        isAvailable,
        timestamp: new Date(),
      });
    });

    // ============ ORDER STATUS EVENTS ============

    // Emit when order status changes (from backend, not frontend)
    // This will be called from order controller
    socket.on("updateOrderStatus", (data) => {
      const { orderId, status, riderId, storeLocationId } = data;
      console.log(`[SOCKET] Order ${orderId} status: ${status}`);

      // Emit to order tracking room (customer + admin)
      io.to(`order_${orderId}`).emit("orderStatusChanged", {
        orderId,
        status,
        riderId,
        timestamp: new Date(),
      });

      // Also emit to store for visibility
      if (storeLocationId) {
        io.to(`store_${storeLocationId}`).emit("orderStatusChanged", {
          orderId,
          status,
          riderId,
          timestamp: new Date(),
        });
      }
    });

    socket.on("disconnect", async () => {
      console.log(`[SOCKET] ✗ Disconnected: ${socket.id}`);

      // If this was a rider, mark them offline
      const riderId = connectedRiders.get(socket.id);
      if (riderId) {
        connectedRiders.delete(socket.id);

        // Check if rider has any other active connections
        let stillConnected = false;
        for (const [, rId] of connectedRiders) {
          if (rId === riderId) {
            stillConnected = true;
            break;
          }
        }

        if (!stillConnected) {
          try {
            const rider = await Rider.findByPk(riderId);
            if (rider) {
              await rider.update({ isOnline: false, lastSeen: new Date() });
              console.log(`[SOCKET] ✓ Rider ${riderId} auto-marked OFFLINE on disconnect`);

              // Notify store
              if (rider.storeLocationId) {
                io.to(`store_${rider.storeLocationId}`).emit("riderAvailabilityChanged", {
                  riderId,
                  storeLocationId: rider.storeLocationId,
                  isAvailable: false,
                  timestamp: new Date(),
                });
              }
            }
          } catch (err) {
            console.error(`[SOCKET] Failed to mark rider offline on disconnect:`, err.message);
          }
        }
      }
    });
  });

  // ============ PERIODIC CLEANUP ============
  // Every 30 seconds, mark riders with stale lastSeen as offline
  setInterval(async () => {
    try {
      const { Op } = require("sequelize");
      const cutoff = new Date(Date.now() - 15000); // 15 seconds stale
      const staleRiders = await Rider.findAll({
        where: {
          isOnline: true,
          lastSeen: { [Op.lt]: cutoff },
        },
      });
      for (const rider of staleRiders) {
        await rider.update({ isOnline: false });
        console.log(`[SOCKET_CLEANUP] Rider ${rider.id} marked OFFLINE (stale lastSeen)`);
      }
    } catch (err) {
      // Silent cleanup errors
    }
  }, 30000);

  console.log("[SOCKET] ✓ Socket.IO initialized successfully");
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket first.");
  }
  return io;
};

// Helper function to emit events from backend services
const emitOrderCreated = (order) => {
  if (!io) return;
  io.to(`store_${order.storeLocationId}`).emit("newOrder", {
    id: order.id,
    storeLocationId: order.storeLocationId,
    latitude: order.latitude,
    longitude: order.longitude,
    status: order.status,
    totalPrice: order.totalPrice,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt,
  });
  console.log(
    `[SOCKET] ✓ Emitted: newOrder #${order.id} to store_${order.storeLocationId}`,
  );
};

const emitOrderAssigned = (order, rider) => {
  if (!io) return;

  // Notify the assigned rider
  io.to(`rider_${rider.id}`).emit("orderAssigned", {
    orderId: order.id,
    order: {
      id: order.id,
      storeLocationId: order.storeLocationId,
      userId: order.userId,
      latitude: order.latitude,
      longitude: order.longitude,
      deliveryAddress: order.deliveryAddress,
      totalPrice: order.totalPrice,
      status: order.status,
    },
    rider: {
      id: rider.id,
      latitude: rider.latitude,
      longitude: rider.longitude,
    },
    message: `New order #${order.id} assigned!`,
    timestamp: new Date(),
  });

  // Notify admin
  io.to(`admin_${order.adminId || "all"}`).emit("orderAssigned", {
    orderId: order.id,
    riderId: rider.id,
    storeLocationId: order.storeLocationId,
    status: order.status,
    timestamp: new Date(),
  });

  // Notify customer
  io.to(`customer_order_${order.id}`).emit("orderAssigned", {
    orderId: order.id,
    riderId: rider.id,
    riderName: rider.user?.name,
    message: `A rider has been assigned to your order!`,
    timestamp: new Date(),
  });

  console.log(
    `[SOCKET] ✓ Emitted: orderAssigned #${order.id} to rider_${rider.id}`,
  );
};

const emitStockAlert = (alertData) => {
  if (!io) return;
  // Emit to all connected admin clients
  io.emit("stockAlert", {
    alert: alertData,
    message: `Low stock alert: ${alertData.productName} has only ${alertData.currentStock} units left!`,
    timestamp: new Date(),
  });
  console.log(
    `[SOCKET] ✓ Emitted: stockAlert for product "${alertData.productName}" (stock: ${alertData.currentStock})`,
  );
};

module.exports = {
  initSocket,
  getIO,
  emitOrderCreated,
  emitOrderAssigned,
  emitStockAlert,
};
