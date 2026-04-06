import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

/**
 * Hook for handling real-time rider notifications
 * Joins rider-specific room to receive order assignments and updates
 */
const useRiderNotifications = (riderId) => {
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!riderId || !user || user.role !== "rider") {
      return;
    }

    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
      });

      socketRef.current.on("connect", () => {
        console.log(`[RIDER_SOCKET] Connected: ${socketRef.current.id}`);
        // Join rider-specific room to receive new order assignments
        socketRef.current.emit("joinRiderRoom", riderId);
        console.log(`[RIDER_SOCKET] Joined rider room: rider_${riderId}`);
      });

      socketRef.current.on("disconnect", () => {
        console.log("[RIDER_SOCKET] Disconnected");
      });

      return () => {
        if (socketRef.current && riderId) {
          socketRef.current.emit("leaveRiderRoom", riderId);
          socketRef.current.disconnect();
        }
      };
    } catch (error) {
      console.error("[RIDER_SOCKET] Error initializing socket:", error);
    }
  }, [riderId, user]);

  /**
   * Listen for new order assignments
   */
  const onNewOrderAssigned = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off("newOrderAssigned");
      socketRef.current.on("newOrderAssigned", (data) => {
        console.log("[RIDER_SOCKET] New order assigned:", data);
        callback(data);
      });
    }
  }, []);

  /**
   * Listen for order status changes
   */
  const onOrderStatusChanged = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off("orderStatusChanged");
      socketRef.current.on("orderStatusChanged", (data) => {
        console.log("[RIDER_SOCKET] Order status changed:", data);
        callback(data);
      });
    }
  }, []);

  /**
   * Listen for rider location updates from other riders (for tracking)
   */
  const onRiderLocationUpdated = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.off("riderLocationUpdated");
      socketRef.current.on("riderLocationUpdated", (data) => {
        callback(data);
      });
    }
  }, []);

  /**
   * Emit rider location update
   */
  const emitLocationUpdate = useCallback((data) => {
    if (socketRef.current) {
      socketRef.current.emit("riderLocationUpdate", data);
    }
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  return {
    onNewOrderAssigned,
    onOrderStatusChanged,
    onRiderLocationUpdated,
    emitLocationUpdate,
    getSocket,
  };
};

export default useRiderNotifications;
