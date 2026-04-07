import { useEffect, useState } from "react";
import { MapPin, Package, Users, TrendingUp, AlertTriangle, Bell, CheckCircle, X } from "lucide-react";
import { getMyStoreLocations } from "../../api/storeLocation.api";
import { getMyProducts } from "../../api/product.api";
import { getAllRiders } from "../../api/rider.api";
import { getStockAlerts, markAlertRead, markAllAlertsRead } from "../../api/stockAlert.api";
import { useAuth } from "../../context/AuthContext";
import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    storeLocations: 0,
    products: 0,
    riders: 0,
    pendingRiders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [storesRes, productsRes, ridersRes] = await Promise.all([
          getMyStoreLocations().catch(() => ({ data: [] })),
          getMyProducts().catch(() => ({ data: [] })),
          getAllRiders().catch(() => ({ data: [] })),
        ]);

        setStats({
          storeLocations: storesRes.data?.length || 0,
          products: productsRes.data?.length || 0,
          riders: ridersRes.data?.length || 0,
          pendingRiders: ridersRes.data?.filter((r) => r.status === "pending").length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch stock alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await getStockAlerts();
        if (res.success) {
          setStockAlerts(res.data || []);
        }
      } catch (error) {
        console.error("Error fetching stock alerts:", error);
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // Socket.IO for real-time stock alerts
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("stockAlert", (data) => {
      console.log("[ADMIN] Stock alert received:", data);
      // Add to alerts list if not already present
      setStockAlerts((prev) => {
        const exists = prev.find((a) => a.productId === data.alert.productId && !a.isRead);
        if (exists) {
          return prev.map((a) =>
            a.productId === data.alert.productId && !a.isRead
              ? { ...a, currentStock: data.alert.currentStock }
              : a
          );
        }
        return [data.alert, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDismissAlert = async (alertId) => {
    try {
      await markAlertRead(alertId);
      setStockAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error("Error dismissing alert:", error);
    }
  };

  const handleDismissAll = async () => {
    try {
      await markAllAlertsRead();
      setStockAlerts([]);
    } catch (error) {
      console.error("Error dismissing all alerts:", error);
    }
  };

  const unreadAlerts = stockAlerts.filter((a) => !a.isRead);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.name || "Admin"}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening with your delivery network today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={MapPin}
          label="Store Locations"
          value={stats.storeLocations}
          color="bg-[#0B4E3C]"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats.products}
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          label="Active Riders"
          value={stats.riders}
          color="bg-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Pending Approvals"
          value={stats.pendingRiders}
          color="bg-orange-500"
        />
      </div>

      {/* Low Stock Alerts Panel */}
      <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Low Stock Alerts</h2>
              <p className="text-sm text-gray-500">Products with stock below 20 units</p>
            </div>
            {unreadAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unreadAlerts.length}
              </span>
            )}
          </div>
          {unreadAlerts.length > 0 && (
            <button
              onClick={handleDismissAll}
              className="text-sm text-[#0B4E3C] hover:text-[#0a4534] font-medium flex items-center gap-1 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Dismiss All
            </button>
          )}
        </div>

        <div className="p-6">
          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B4E3C]"></div>
            </div>
          ) : unreadAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
              <p className="font-medium text-gray-600">All stocks are healthy!</p>
              <p className="text-sm">No products below the 20-unit threshold.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {alert.productName || alert.product?.name || "Unknown Product"}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-red-600 font-medium">
                          Stock: {alert.currentStock} units
                        </span>
                        <span className="text-xs text-gray-400">
                          Threshold: {alert.threshold} units
                        </span>
                        {alert.product?.storeLocation && (
                          <span className="text-xs text-gray-500">
                            • {alert.product.storeLocation.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/store-locations"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <MapPin className="w-5 h-5 text-[#0B4E3C]" />
            <span>Add Store Location</span>
          </a>
          <a
            href="/admin/products"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <Package className="w-5 h-5 text-blue-500" />
            <span>Add New Product</span>
          </a>
          <a
            href="/admin/riders"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
          >
            <Users className="w-5 h-5 text-purple-500" />
            <span>Manage Riders</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
