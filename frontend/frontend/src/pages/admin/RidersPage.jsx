import { useState, useEffect } from "react";
import { Check, X, User, MapPin, Phone, Bike } from "lucide-react";
import { getAllRiders, updateRiderStatus } from "../../api/rider.api";
import { getMyStoreLocations } from "../../api/storeLocation.api";

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [storeLocations, setStoreLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ridersRes, storesRes] = await Promise.all([
        getAllRiders(),
        getMyStoreLocations(),
      ]);
      setRiders(ridersRes.data || []);
      setStoreLocations(storesRes.data || []);
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (riderId, status) => {
    try {
      setError("");
      await updateRiderStatus(riderId, status);
      setSuccess(`Rider ${status} successfully!`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update rider status");
    }
  };

  const filteredRiders = riders.filter((rider) => {
    if (filter === "all") return true;
    return rider.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getVehicleIcon = (type) => {
    return <Bike className="w-5 h-5" />;
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riders Management</h1>
          <p className="text-gray-500 mt-1">
            Manage and approve rider registrations
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-[#0B4E3C] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "pending" && riders.filter((r) => r.status === "pending").length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                  {riders.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {/* Riders List */}
      <div className="grid gap-4">
        {filteredRiders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            {filter === "all"
              ? "No riders registered yet."
              : `No ${filter} riders found.`}
          </div>
        ) : (
          filteredRiders.map((rider) => (
            <div
              key={rider.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Rider Info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">
                        {rider.user?.name || "Unknown"}
                      </h3>
                      {getStatusBadge(rider.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {rider.user?.email}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {rider.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        {getVehicleIcon(rider.vehicleType)}
                        {rider.vehicleType} {rider.vehicleNumber && `- ${rider.vehicleNumber}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {rider.storeLocation?.name || "Unknown Store"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      License: {rider.licenseNumber}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {rider.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(rider.id, "approved")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(rider.id, "rejected")}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {rider.status === "approved" && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        rider.isAvailable
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          rider.isAvailable ? "bg-green-500" : "bg-gray-400"
                        }`}
                      ></span>
                      {rider.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                )}

                {rider.status === "rejected" && (
                  <button
                    onClick={() => handleStatusUpdate(rider.id, "pending")}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                  >
                    Reconsider
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RidersPage;
