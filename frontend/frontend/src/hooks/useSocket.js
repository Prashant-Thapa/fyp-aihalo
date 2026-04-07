import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const useSocket = (orderId) => {
    const socketRef = useRef(null);
    const listenersRef = useRef({});

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
        });

        if (orderId) {
            socketRef.current.emit("joinOrder", orderId);
        }

        return () => {
            if (orderId) {
                socketRef.current.emit("leaveOrder", orderId);
            }
            socketRef.current.disconnect();
        };
    }, [orderId]);

    const onStatusUpdate = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.off("orderStatusUpdated");
            socketRef.current.on("orderStatusUpdated", callback);
            listenersRef.current.statusUpdate = callback;
        }
    }, []);

    const onLocationUpdate = useCallback((callback) => {
        if (socketRef.current) {
            socketRef.current.off("riderLocationUpdated");
            socketRef.current.on("riderLocationUpdated", callback);
            listenersRef.current.locationUpdate = callback;
        }
    }, []);

    const emitLocationUpdate = useCallback((data) => {
        if (socketRef.current) {
            socketRef.current.emit("riderLocationUpdate", data);
        }
    }, []);

    const getSocket = useCallback(() => socketRef.current, []);

    return {
        socket: socketRef.current,
        onStatusUpdate,
        onLocationUpdate,
        emitLocationUpdate,
        getSocket,
    };
};

export default useSocket;
