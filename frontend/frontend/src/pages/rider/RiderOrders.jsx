import { useState, useEffect } from "react";
import { getRiderOrders, updateOrderStatus, acceptOrder as acceptOrderApi, rejectOrder as rejectOrderApi } from "../../api/rider.api";
import { useAuth } from "../../context/AuthContext";
import useRiderNotifications from "../../hooks/useRiderNotifications";
import {
  Package,
  MapPin,
  User,
  CheckCircle,
  ArrowRight,
  XCircle,
  Bell,
} from "lucide-react";

const statusFlow = [
  "rider_assigned",
  "accepted",
  "picked_up",
  "on_the_way",
  "delivered",
];

const statusLabels = {
  rider_assigned: "Assigned",
  accepted: "Accepted",
  picked_up: "Picked Up",
  on_the_way: "On The Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColors = {
  rider_assigned: "bg-purple-100 text-purple-800",
  accepted: "bg-indigo-100 text-indigo-800",
  picked_up: "bg-orange-100 text-orange-800",
  on_the_way: "bg-cyan-100 text-cyan-800",
  delivered: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const nextStatusLabel = {
  rider_assigned: "Accept Order",
  accepted: "Mark Picked Up",
  picked_up: "Start Delivery",
  on_the_way: "Mark Delivered",
};

const RiderOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("active");
  const [notification, setNotification] = useState(null);

  // Get rider ID
  const riderId = user?.id;

  // Setup real-time notifications
  const { onNewOrderAssigned } = useRiderNotifications(riderId);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!riderId) return;

    // Listen for new order assignments
    onNewOrderAssigned((data) => {
      console.log("New order assigned in RiderOrders:", data);
      setNotification({
        type: "success",
        message: `New order #${data.orderId} assigned!`,
      });

      // Add to orders list if not already there
      setOrders((prev) => {
        const orderExists = prev.some((o) => o.id === data.orderId);
        if (!orderExists && data.order) {
          return [data.order, ...prev];
        }
        return prev;
      });

      // Auto-dismiss notification
      setTimeout(() => setNotification(null), 5000);
    });
  }, [riderId, onNewOrderAssigned]);

  const fetchOrders = async () => {
    try {
      const response = await getRiderOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(orderId);
      let response;
      
      // Use dedicated accept endpoint for rider_assigned -> accepted
      if (newStatus === "accepted") {
        response = await acceptOrderApi(orderId);
      } else {
        response = await updateOrderStatus(orderId, newStatus);
      }
      
      if (response.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (orderId) => {
    try {
      setUpdating(orderId);
      const response = await rejectOrderApi(orderId);
      if (response.success) {
        // Remove the order from this rider's list (it's been reassigned or set to pending)
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setNotification({
          type: "success",
          message: response.message || "Order rejected and reassigned.",
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject order");
    } finally {
      setUpdating(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx >= 0 && idx < statusFlow.length - 1) {
      return statusFlow[idx + 1];
    }
    return null;
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "active")
      return !["delivered", "cancelled"].includes(o.status);
    if (filter === "completed") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-lg animate-in fade-in slide-in-from-top ${notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-blue-100 text-blue-800 border border-blue-300"
            }`}
        >
          <Bell size={20} />
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {["active", "completed", "cancelled", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f
                ? "bg-[#0B4E3C] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No {filter} orders</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{order.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <User size={14} />
                      <span>
                        {order.user?.name} — {order.user?.email}
                      </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <MapPin size={14} className="text-red-500" />
                      <span>{order.deliveryAddress}</span>
                    </div>

                    {/* Store pickup */}
                    {order.storeLocation && (
                      <div className="flex items-center gap-2 text-sm text-green-700 mb-1">
                        <MapPin size={14} className="text-green-600" />
                        <span>
                          <span className="font-medium">Pick up from:</span>{" "}
                          {order.storeLocation.name}
                          {order.storeLocation.address && ` — ${order.storeLocation.address}`}
                        </span>
                      </div>
                    )}

                    {/* Items */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Items: </span>
                        {order.items
                          ?.map(
                            (item) => `${item.product?.name} ×${item.quantity}`,
                          )
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-[#0B4E3C]">
                      रु {parseFloat(order.totalPrice).toFixed(2)}
                    </p>

                    {/* Status Actions */}
                    {nextStatus && (
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() =>
                            handleStatusUpdate(order.id, nextStatus)
                          }
                          disabled={updating === order.id}
                          className="w-full flex items-center justify-center gap-2 bg-[#0B4E3C] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#0a4534] transition-colors disabled:opacity-50"
                        >
                          {updating === order.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <ArrowRight size={16} />
                              {nextStatusLabel[order.status]}
                            </>
                          )}
                        </button>
                        {order.status === "rider_assigned" && (
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={updating === order.id}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === "delivered" && (
                      <div className="mt-4 flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle size={16} />
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RiderOrders;
