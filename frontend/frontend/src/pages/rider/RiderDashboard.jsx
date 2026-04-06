import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getRiderProfile, updateRiderAvailability } from "../../api/rider.api";
import { getRiderOrders } from "../../api/rider.api";
import { updateRiderLocation } from "../../api/rider.api";
import { useAuth } from "../../context/AuthContext";
import * as socketService from "../../services/socketService";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Bell,
  Edit,
  AlertCircle,
  Navigation,
  Phone,
  Store,
} from "lucide-react";

const statusColors = {
  rider_assigned: "bg-purple-100 text-purple-800",
  accepted: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-orange-100 text-orange-800",
  on_the_way: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels = {
  rider_assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked Up",
  on_the_way: "On The Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const RiderDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [notification, setNotification] = useState(null);
  const [liveGPS, setLiveGPS] = useState(false);
  const [currentCoords, setCurrentCoords] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchData();
    return () => {
      // Stop GPS watch on unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Socket setup
  useEffect(() => {
    if (!profile?.id) return;
    socketService.initSocket();
    socketService.joinRiderRoom(profile.id);

    // Listen for new order assignments
    socketService.onOrderAssigned((data) => {
      console.log("✓ New order assigned via socket:", data);
      showNotification(`🛵 New order #${data.orderId} assigned to you!`);

      if (data.orderId) {
        setOrders((prev) => {
          const exists = prev.some((o) => o.id === data.orderId);
          if (exists) return prev;
          return [
            data.order || { id: data.orderId, status: "rider_assigned" },
            ...prev,
          ];
        });
        // Refresh to get full order details
        fetchData();
      }
    });

    // Also listen on the "newOrderAssigned" event name (sent by riderAssignment.service.js)
    socketService.getSocket().on("newOrderAssigned", (data) => {
      console.log("✓ newOrderAssigned via socket:", data);
      showNotification(`🛵 New order #${data.orderId} assigned to you!`);
      fetchData();
    });

    socketService.onOrderStatusChanged((data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === data.orderId ? { ...order, status: data.status } : order,
        ),
      );
    });

    // Heartbeat: send every 3 seconds to keep rider online
    const heartbeatInterval = setInterval(() => {
      socketService.sendRiderHeartbeat(profile.id);
    }, 3000);

    return () => {
      clearInterval(heartbeatInterval);
      socketService.leaveRiderRoom(profile.id);
    };
  }, [profile?.id]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 6000);
  };

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        getRiderProfile(),
        getRiderOrders(),
      ]);
      if (profileRes.success) setProfile(profileRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
    } catch (err) {
      console.error("Failed to fetch rider data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      setToggling(true);
      const response = await updateRiderAvailability({ isAvailable: !profile.isAvailable });
      if (response.success) {
        const newAvailability = !profile.isAvailable;
        setProfile({ ...profile, isAvailable: newAvailability });
        socketService.sendRiderAvailabilityChange(
          profile.id,
          profile.storeLocationId,
          newAvailability,
        );
      }
    } catch (err) {
      console.error("Failed to update availability:", err);
    } finally {
      setToggling(false);
    }
  };

  // Toggle live GPS — broadcasts rider position every movement update
  const handleToggleLiveGPS = () => {
    if (!navigator.geolocation) {
      showNotification("❌ Geolocation not supported in your browser.");
      return;
    }

    if (liveGPS) {
      // Stop
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLiveGPS(false);
      showNotification("Live GPS stopped.");
    } else {
      // Start
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });

          // Save to DB (which also emits via socket to active order room)
          try {
            await updateRiderLocation(lat, lng);
          } catch {
            // Silently fail
          }

          // Also emit directly via socket to any active order room
          const activeOrder = orders.find(
            (o) => !["delivered", "cancelled"].includes(o.status),
          );
          if (activeOrder && profile?.id) {
            socketService.sendRiderLocationUpdate(activeOrder.id, profile.id, lat, lng);
          }
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
      watchIdRef.current = id;
      setLiveGPS(true);
      showNotification("✓ Live GPS active — your location is being broadcast to customers!");
    }
  };

  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  );
  const completedOrders = orders.filter((o) => o.status === "delivered");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Notification Banner */}
      {notification && (
        <div className="mb-5 p-4 rounded-xl flex items-center gap-3 shadow-lg bg-green-100 text-green-800 border border-green-300">
          <Bell size={20} />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rider Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {profile?.user?.name}!</p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={handleToggleAvailability}
          disabled={toggling}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold transition-all ${profile?.isAvailable
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
        >
          {profile?.isAvailable ? (
            <>
              <ToggleRight size={24} className="text-green-600" />
              Online
            </>
          ) : (
            <>
              <ToggleLeft size={24} />
              Offline
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock size={22} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
              <p className="text-xs text-gray-500">Active Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0B4E3C]/10 rounded-xl flex items-center justify-center">
              <Truck size={22} className="text-[#0B4E3C]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{profile?.vehicleType}</p>
              <p className="text-xs text-gray-500">Vehicle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Location + Live GPS row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current location card */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between ${profile?.latitude ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
          }`}>
          <div className="flex items-center gap-3">
            <MapPin className={profile?.latitude ? "text-blue-600" : "text-amber-600"} size={20} />
            <div>
              {profile?.latitude ? (
                <>
                  <p className="font-semibold text-blue-900 text-sm">Your Location</p>
                  <p className="text-xs text-blue-700 font-mono">
                    {currentCoords
                      ? `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`
                      : `${parseFloat(profile.latitude).toFixed(5)}, ${parseFloat(profile.longitude).toFixed(5)}`
                    }
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-900 text-sm">Location Not Set</p>
                  <p className="text-xs text-amber-700">You won't receive orders</p>
                </>
              )}
            </div>
          </div>
          <Link
            to="/rider/location-update"
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            <Edit size={13} />
            Update
          </Link>
        </div>

        {/* Live GPS broadcast card */}
        <div className={`rounded-2xl p-4 border flex items-center justify-between ${liveGPS ? "bg-green-50 border-green-300" : "bg-gray-50 border-gray-200"
          }`}>
          <div className="flex items-center gap-3">
            <Navigation className={liveGPS ? "text-green-600" : "text-gray-500"} size={20} />
            <div>
              <p className={`font-semibold text-sm ${liveGPS ? "text-green-900" : "text-gray-700"}`}>
                Live GPS Broadcast
              </p>
              <p className={`text-xs ${liveGPS ? "text-green-700" : "text-gray-500"}`}>
                {liveGPS
                  ? "Broadcasting your location to customers"
                  : "Let customers track you in real-time"}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleLiveGPS}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${liveGPS
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-[#0B4E3C] text-white hover:bg-[#0a4534]"
              }`}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${liveGPS ? "bg-red-500 animate-pulse" : "bg-white"}`} />
            {liveGPS ? "Stop GPS" : "Start GPS"}
          </button>
        </div>
      </div>

      {/* Active Orders */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Orders</h2>
        {activeOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No active orders — set yourself Online to receive orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="font-bold text-[#0B4E3C] text-lg">
                    रु {parseFloat(order.totalPrice).toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  {/* Customer info */}
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400 shrink-0" />
                    <span><span className="font-medium">Customer:</span> {order.user?.name}</span>
                  </div>
                  {/* Customer phone */}
                  {(order.user?.phone || order.rider?.phone) && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#0B4E3C] shrink-0" />
                      <span>
                        <span className="font-medium">Phone:</span>{" "}
                        <a
                          href={`tel:${order.user?.phone}`}
                          className="text-[#0B4E3C] hover:underline"
                        >
                          {order.user?.phone || "Not provided"}
                        </a>
                      </span>
                    </div>
                  )}
                  {/* Delivery address */}
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-red-500 shrink-0" />
                    <span><span className="font-medium">Deliver to:</span> {order.deliveryAddress}</span>
                  </div>
                  {/* Customer location coords */}
                  <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
                    <MapPin size={14} className="text-red-400 shrink-0" />
                    <span>
                      {parseFloat(order.latitude).toFixed(5)}, {parseFloat(order.longitude).toFixed(5)}
                    </span>
                  </div>
                  {/* Store pickup */}
                  {order.storeLocation && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Store size={14} className="text-green-600 shrink-0" />
                      <span>
                        <span className="font-medium">Pick up from:</span>{" "}
                        {order.storeLocation.name} —{" "}
                        <span className="text-xs text-gray-500">
                          {order.storeLocation.address}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
                  {order.items
                    ?.map((item) => `${item.product?.name} ×${item.quantity}`)
                    .join(", ")}
                </div>

                {/* View orders action */}
                <div className="mt-3">
                  <Link
                    to="/rider/orders"
                    className="text-xs text-[#0B4E3C] font-semibold hover:underline"
                  >
                    Manage this order →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;
