import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, User, Phone, Car, FileText, AlertCircle } from "lucide-react";
import LocationMap from "../components/LocationMap";
import { registerRider } from "../api/rider.api";
import { getAllStoreLocations } from "../api/storeLocation.api";

const RiderRegister = () => {
  const navigate = useNavigate();
  const [storeLocations, setStoreLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    vehicleType: "bike",
    vehicleNumber: "",
    licenseNumber: "",
    latitude: "",
    longitude: "",
    storeLocationId: "",
  });

  const vehicleTypes = [
    { value: "bike", label: "Motorcycle" },
    { value: "scooter", label: "Scooter" },
    { value: "bicycle", label: "Bicycle" },
    { value: "car", label: "Car" },
  ];

  useEffect(() => {
    fetchStoreLocations();
    getCurrentLocation();
  }, []);

  const fetchStoreLocations = async () => {
    try {
      const response = await getAllStoreLocations();
      setStoreLocations(response.data || []);
    } catch (err) {
      console.error("Failed to fetch store locations");
    }
  };

  const getCurrentLocation = () => {
    setFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toFixed(8),
            longitude: longitude.toFixed(8),
          }));
          setFetchingLocation(false);
          // Find nearby stores
          findNearbyStores(latitude, longitude);
        },
        (error) => {
          setError("Please enable location access to register as a rider.");
          setFetchingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setFetchingLocation(false);
    }
  };

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearbyStores = (lat, lng) => {
    const nearby = storeLocations
      .map((store) => {
        const distance = calculateDistance(
          lat,
          lng,
          parseFloat(store.latitude),
          parseFloat(store.longitude)
        );
        return { ...store, distance };
      })
      .filter((store) => store.distance <= store.radius)
      .sort((a, b) => a.distance - b.distance);

    setNearbyStores(nearby);
  };

  useEffect(() => {
    if (userLocation && storeLocations.length > 0) {
      findNearbyStores(userLocation.lat, userLocation.lng);
    }
  }, [storeLocations, userLocation]);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setFormData((prev) => ({ ...prev, storeLocationId: store.id.toString() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.storeLocationId) {
      setError("Please select a store location");
      return;
    }

    setLoading(true);

    try {
      const response = await registerRider({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        licenseNumber: formData.licenseNumber,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        storeLocationId: parseInt(formData.storeLocationId),
      });

      if (response.success) {
        setSuccess(
          "Registration submitted successfully! Please wait for admin approval. You can now login."
        );
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0B4E3C] rounded-full mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Become a Rider</h1>
          <p className="text-gray-500 mt-2">
            Join AI Halo's delivery network and start earning today
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Map Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#0B4E3C]" />
              Your Location & Nearby Stores
            </h2>

            {fetchingLocation ? (
              <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B4E3C] mx-auto mb-2"></div>
                  <p className="text-gray-500">Getting your location...</p>
                </div>
              </div>
            ) : (
              <>
                <LocationMap
                  center={userLocation ? [userLocation.lat, userLocation.lng] : [27.7172, 85.324]}
                  storeLocations={storeLocations}
                  userLocation={userLocation}
                  showRadius={true}
                  height="300px"
                  onMarkerClick={handleStoreSelect}
                />

                {/* Nearby Stores */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Available Stores Within Range:
                  </h3>
                  {nearbyStores.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                      No stores available in your area. You must be within 10km of a store location to register.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {nearbyStores.map((store) => (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => handleStoreSelect(store)}
                          className={`w-full p-3 rounded-lg border text-left transition ${
                            selectedStore?.id === store.id
                              ? "border-[#0B4E3C] bg-[#0B4E3C]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{store.name}</p>
                              <p className="text-sm text-gray-500">{store.address}</p>
                            </div>
                            <span className="text-sm text-[#0B4E3C] font-medium">
                              {store.distance.toFixed(1)} km away
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0B4E3C]" />
              Personal Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-[#0B4E3C]" />
              Vehicle Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  placeholder="BA 1 PA 1234"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  required
                  placeholder="Your driving license number"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading || nearbyStores.length === 0}
              className="flex-1 px-6 py-3 bg-[#0B4E3C] text-white rounded-lg hover:bg-[#093F31] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RiderRegister;
