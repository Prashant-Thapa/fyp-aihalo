import io from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

let socket = null;

/**
 * Initialize socket connection
 */
export const initSocket = () => {
  if (socket) return socket;

  socket = io(API_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on("connect", () => {
    console.log("[SOCKET] ✓ Connected to server");
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET] ✗ Disconnected from server");
  });

  socket.on("connect_error", (error) => {
    console.error("[SOCKET] ✗ Connection error:", error);
  });

  return socket;
};

/**
 * Get socket instance
 */
export const getSocket = () => {
  if (!socket) {
    initSocket();
  }
  return socket;
};

// ============ ROOM JOIN/LEAVE HELPERS ============

export const joinRiderRoom = (riderId) => {
  const sock = getSocket();
  sock.emit("joinRiderRoom", riderId);
  console.log(`[SOCKET] Joined rider room: rider_${riderId}`);
};

export const leaveRiderRoom = (riderId) => {
  const sock = getSocket();
  sock.emit("leaveRiderRoom", riderId);
  console.log(`[SOCKET] Left rider room: rider_${riderId}`);
};

export const joinStoreRoom = (storeLocationId) => {
  const sock = getSocket();
  sock.emit("joinStoreRoom", storeLocationId);
  console.log(`[SOCKET] Joined store room: store_${storeLocationId}`);
};

export const leaveStoreRoom = (storeLocationId) => {
  const sock = getSocket();
  sock.emit("leaveStoreRoom", storeLocationId);
  console.log(`[SOCKET] Left store room: store_${storeLocationId}`);
};

export const joinAdminRoom = (adminId) => {
  const sock = getSocket();
  sock.emit("joinAdminRoom", adminId);
  console.log(`[SOCKET] Joined admin room: admin_${adminId}`);
};

export const leaveAdminRoom = (adminId) => {
  const sock = getSocket();
  sock.emit("leaveAdminRoom", adminId);
  console.log(`[SOCKET] Left admin room: admin_${adminId}`);
};

export const joinCustomerOrder = (orderId) => {
  const sock = getSocket();
  sock.emit("joinCustomerOrder", orderId);
  console.log(`[SOCKET] Joined customer order room: customer_order_${orderId}`);
};

export const leaveCustomerOrder = (orderId) => {
  const sock = getSocket();
  sock.emit("leaveCustomerOrder", orderId);
  console.log(`[SOCKET] Left customer order room: customer_order_${orderId}`);
};

export const joinOrderRoom = (orderId) => {
  const sock = getSocket();
  sock.emit("joinOrder", orderId);
  console.log(`[SOCKET] Joined order room: order_${orderId}`);
};

export const leaveOrderRoom = (orderId) => {
  const sock = getSocket();
  sock.emit("leaveOrder", orderId);
  console.log(`[SOCKET] Left order room: order_${orderId}`);
};

// ============ EVENT LISTENERS ============

/**
 * Listen for new orders (for riders in store)
 */
export const onNewOrder = (callback) => {
  const sock = getSocket();
  sock.on("newOrder", (order) => {
    console.log("[SOCKET] Event: newOrder", order);
    callback(order);
  });
};

/**
 * Listen for order assignment (for rider)
 */
export const onOrderAssigned = (callback) => {
  const sock = getSocket();
  sock.on("orderAssigned", (data) => {
    console.log("[SOCKET] Event: orderAssigned", data);
    callback(data);
  });
};

/**
 * Listen for order status changes
 */
export const onOrderStatusChanged = (callback) => {
  const sock = getSocket();
  sock.on("orderStatusChanged", (data) => {
    console.log("[SOCKET] Event: orderStatusChanged", data);
    callback(data);
  });
};

/**
 * Listen for rider location updates
 */
export const onRiderLocationUpdated = (callback) => {
  const sock = getSocket();
  sock.on("riderLocationUpdated", (data) => {
    console.log("[SOCKET] Event: riderLocationUpdated", data);
    callback(data);
  });
};

/**
 * Listen for rider availability changes
 */
export const onRiderAvailabilityChanged = (callback) => {
  const sock = getSocket();
  sock.on("riderAvailabilityChanged", (data) => {
    console.log("[SOCKET] Event: riderAvailabilityChanged", data);
    callback(data);
  });
};

// ============ OUTGOING EVENTS ============

/**
 * Send rider location update
 */
export const sendRiderLocationUpdate = (
  orderId,
  riderId,
  latitude,
  longitude,
) => {
  const sock = getSocket();
  sock.emit("riderLocationUpdate", {
    orderId,
    riderId,
    latitude,
    longitude,
  });
  console.log(
    `[SOCKET] Sent: riderLocationUpdate order=${orderId}, location=({${latitude}, ${longitude}}`,
  );
};

/**
 * Notify rider availability change
 */
export const sendRiderAvailabilityChange = (
  riderId,
  storeLocationId,
  isAvailable,
) => {
  const sock = getSocket();
  sock.emit("riderAvailabilityChange", {
    riderId,
    storeLocationId,
    isAvailable,
  });
  console.log(
    `[SOCKET] Sent: riderAvailabilityChange rider=${riderId}, available=${isAvailable}`,
  );
};

/**
 * Update order status (from backend typically, but can be from frontend for testing)
 */
export const updateOrderStatus = (
  orderId,
  status,
  riderId,
  storeLocationId,
) => {
  const sock = getSocket();
  sock.emit("updateOrderStatus", {
    orderId,
    status,
    riderId,
    storeLocationId,
  });
  console.log(
    `[SOCKET] Sent: updateOrderStatus order=${orderId}, status=${status}`,
  );
};

// ============ HEARTBEAT ============

/**
 * Send rider heartbeat to keep online status alive
 */
export const sendRiderHeartbeat = (riderId) => {
  const sock = getSocket();
  sock.emit("riderHeartbeat", { riderId });
};

// ============ CLEANUP ============

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("[SOCKET] Socket disconnected and cleaned up");
  }
};

export default {
  initSocket,
  getSocket,
  joinRiderRoom,
  leaveRiderRoom,
  joinStoreRoom,
  leaveStoreRoom,
  joinAdminRoom,
  leaveAdminRoom,
  joinCustomerOrder,
  leaveCustomerOrder,
  joinOrderRoom,
  leaveOrderRoom,
  onNewOrder,
  onOrderAssigned,
  onOrderStatusChanged,
  onRiderLocationUpdated,
  onRiderAvailabilityChanged,
  sendRiderLocationUpdate,
  sendRiderAvailabilityChange,
  sendRiderHeartbeat,
  updateOrderStatus,
  disconnectSocket,
};
