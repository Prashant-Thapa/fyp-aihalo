import { useState, useEffect } from "react";
import { Check, X, User, MapPin, Phone, Bike, FileText, Camera } from "lucide-react";
import { getAllRiders, updateRiderStatus } from "../../api/rider.api";
import { getMyStoreLocations } from "../../api/storeLocation.api";

const RidersPage = () => {
  const [riders, setRiders] = useState([]);
  const [storeLocations, setStoreLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved, rejected
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRider, setSelectedRider] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingRiderId, setRejectingRiderId] = useState(null);

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

  const handleStatusUpdate = async (riderId, status, reason = null) => {
    try {
      setError("");
      const payload = { status };
      if (status === "rejected" && reason) {
        payload.rejectionReason = reason;
      }
      await updateRiderStatus(riderId, status, payload);
      setSuccess(`Rider ${status} successfully!`);
      fetchData();
      setShowModal(false);
      setShowRejectionModal(false);
      setRejectionReason("");
      setRejectingRiderId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update rider status");
    }
  };

  const handleRejectClick = (riderId) => {
    setRejectingRiderId(riderId);
    setShowRejectionModal(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    handleStatusUpdate(rejectingRiderId, "rejected", rejectionReason);
  };

  const handleReconsider = async (riderId) => {
    try {
      setError("");
      // When reconsidering, change status to "pending" without rejection reason
      await updateRiderStatus(riderId, "pending", { status: "pending" });
      setSuccess("✅ Rider status changed to pending! They can now login and wait for approval or update their information.");
      fetchData();
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update rider status");
    }
  };

  const handleViewRider = (rider) => {
    setSelectedRider(rider);
    setShowModal(true);
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

                    <button 
                      onClick={() => handleViewRider(rider)}
                      className="border p-2 rounded-lg mt-10 cursor-pointer w-full bg-green-500 text-white hover:bg-green-400 hover:duration-75" 
                    >
                      View
                    </button>
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
                      onClick={() => handleRejectClick(rider.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}

                {/* view rider */}
              

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
                    onClick={() => handleReconsider(rider.id)}
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

      {/* View Modal */}
      {showModal && selectedRider && (
        <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold text-gray-800">Rider Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Name</p>
                    <p className="text-gray-900 mt-1">{selectedRider.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-gray-900 mt-1">{selectedRider.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Phone</p>
                    <p className="text-gray-900 mt-1">{selectedRider.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">License Number</p>
                    <p className="text-gray-900 mt-1">{selectedRider.licenseNumber}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Vehicle Type</p>
                    <p className="text-gray-900 mt-1 capitalize">{selectedRider.vehicleType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Vehicle Number</p>
                    <p className="text-gray-900 mt-1">{selectedRider.vehicleNumber}</p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Store Location</p>
                    <p className="text-gray-900 mt-1">{selectedRider.storeLocation?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Address</p>
                    <p className="text-gray-900 mt-1">{selectedRider.storeLocation?.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Latitude</p>
                    <p className="text-gray-900 mt-1 text-sm font-mono">{selectedRider.latitude}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Longitude</p>
                    <p className="text-gray-900 mt-1 text-sm font-mono">{selectedRider.longitude}</p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* Profile Photo */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <p className="text-xs font-semibold text-gray-600 p-2 bg-gray-50 border-b">Profile Photo</p>
                    {selectedRider.profilePhoto ? (
                      <>
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.profilePhoto}`}
                        alt="Profile"
                        className="w-full h-32 object-cover"
                        />
                         <a href={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.licenseBackPhoto}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          View Full Image
                        </a>
                        </>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* License Front */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <p className="text-xs font-semibold text-gray-600 p-2 bg-gray-50 border-b">License (Front)</p>
                    {selectedRider.licenseFrontPhoto ? (
                      <>
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.licenseFrontPhoto}`}
                        alt="License Front"
                        className="w-full h-32 object-cover"
                        />
                         <a href={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.licenseBackPhoto}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          View Full Image
                        </a>
                        </>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* License Back */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <p className="text-xs font-semibold text-gray-600 p-2 bg-gray-50 border-b">License (Back)</p>
                    {selectedRider.licenseBackPhoto ? (
                      <>
                      <img
                        src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.licenseBackPhoto}`}
                        alt="License Back"
                        className="w-full h-32 object-cover"
                        />
                        <a href={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${selectedRider.licenseBackPhoto}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                          View Full Image
                        </a>
                      </>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Status</p>
                    <p className="text-gray-900 mt-1 font-semibold capitalize">{selectedRider.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Verified</p>
                    <p className="text-gray-900 mt-1 font-semibold">{selectedRider.isVerified ? "✓ Yes" : "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Available</p>
                    <p className="text-gray-900 mt-1 font-semibold">{selectedRider.isAvailable ? "✓ Yes" : "No"}</p>
                  </div>
                </div>
                {selectedRider.status === "rejected" && selectedRider.rejectionReason && (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm text-red-600 font-medium mb-2">Rejection Reason:</p>
                    <p className="text-gray-700 text-sm">{selectedRider.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRider.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleStatusUpdate(selectedRider.id, "approved")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectClick(selectedRider.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Reject Rider Registration
            </h2>
            
            <p className="text-gray-600 mb-4 text-sm">
              Please provide a reason for rejection. This will help the rider understand why they were rejected.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Document quality is poor, License expired, Incomplete information, etc."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="4"
            />

            <div className="space-y-3">
              <button
                onClick={handleConfirmReject}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason("");
                  setRejectingRiderId(null);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidersPage;
