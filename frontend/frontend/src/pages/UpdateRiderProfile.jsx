import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, User, Phone, Car, AlertCircle, Upload } from "lucide-react";
import LocationMap from "../components/LocationMap";
import { getRiderProfileByEmail, updateRiderDocumentsPublic } from "../api/rider.api";
import { getAllStoreLocations } from "../api/storeLocation.api";
import { uploadPhoto } from "../api/upload.api";
import { toast, ToastContainer } from "react-toastify";

const UpdateRiderProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const [storeLocations, setStoreLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [riderProfile, setRiderProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicleType: "bike",
    vehicleNumber: "",
    licenseNumber: "",
    latitude: "",
    longitude: "",
    storeLocationId: "",
    profilePhoto: null,
    licenseFrontPhoto: null,
    licenseBackPhoto: null,
  });

  const [uploadedPhotos, setUploadedPhotos] = useState({
    profilePhoto: null,
    licenseFrontPhoto: null,
    licenseBackPhoto: null,
  });

  const vehicleTypes = [
    { value: "bike", label: "Motorcycle" },
    { value: "scooter", label: "Scooter" },
    { value: "bicycle", label: "Bicycle" },
    { value: "car", label: "Car" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetchingProfile(true);
      
      // Get email from navigation state (passed from Login component)
      const email = location.state?.email;
      
      if (!email) {
        toast.error("Email information missing. Please login again.");
        navigate("/login");
        return;
      }

      // Use public endpoint to fetch rider profile by email
      const [profileRes, storesRes] = await Promise.all([
        getRiderProfileByEmail(email),
        getAllStoreLocations(),
      ]);

      const profile = profileRes.data;
      setRiderProfile(profile);
      setStoreLocations(storesRes.data || []);

      // Pre-fill form with existing data
      setFormData({
        name: profile.user?.name || "",
        phone: profile.phone || "",
        vehicleType: profile.vehicleType || "bike",
        vehicleNumber: profile.vehicleNumber || "",
        licenseNumber: profile.licenseNumber || "",
        latitude: profile.latitude || "",
        longitude: profile.longitude || "",
        storeLocationId: profile.storeLocationId || "",
        profilePhoto: null,
        licenseFrontPhoto: null,
        licenseBackPhoto: null,
      });

      setUploadedPhotos({
        profilePhoto: profile.profilePhoto || null,
        licenseFrontPhoto: profile.licenseFrontPhoto || null,
        licenseBackPhoto: profile.licenseBackPhoto || null,
      });

      setUserLocation({
        lat: parseFloat(profile.latitude),
        lng: parseFloat(profile.longitude),
      });
      setSelectedStore(profile.storeLocationId);
    } catch (err) {
      toast.error("Failed to fetch your profile");
      navigate("/login");
    } finally {
      setFetchingProfile(false);
    }
  };

  const getCurrentLocation = () => {
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
          findNearbyStores(latitude, longitude);
        },
        (error) => {
          toast.error("Please enable location access");
        }
      );
    }
  };

  const findNearbyStores = (lat, lng) => {
    const nearby = storeLocations.filter((store) => {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
      return distance <= store.radius;
    });
    setNearbyStores(nearby);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value) => (value * Math.PI) / 180;

  const handleFileChange = async (e, photoType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file");
      return;
    }

    try {
      setLoading(true);
      const response = await uploadPhoto(file);
      if (response.success) {
        setUploadedPhotos((prev) => ({
          ...prev,
          [photoType]: response.url,
        }));
        toast.success("Photo uploaded successfully!");
      }
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    }));
    findNearbyStores(lat, lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneRegex = /^(98|97)\d{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error("Please enter a valid Nepali phone number (98/97 + 8 digits)");
        setLoading(false);
        return;
      }

      if (!formData.storeLocationId) {
        toast.error("Please select a store location");
        setLoading(false);
        return;
      }

      const response = await updateRiderDocumentsPublic(
        riderProfile.id,
        uploadedPhotos.profilePhoto || riderProfile.profilePhoto,
        uploadedPhotos.licenseFrontPhoto || riderProfile.licenseFrontPhoto,
        uploadedPhotos.licenseBackPhoto || riderProfile.licenseBackPhoto
      );

      if (response.success) {
        setSubmitSuccess(true);
        toast.success("✅ Profile updated successfully! Your application is now pending admin review.");
        // Don't redirect - let user see success message
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {submitSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Profile Updated!</h2>
              <p className="text-gray-600 mb-6">
                Your application has been resubmitted and is now pending admin review. You will be notified once the admin reviews your updated information.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {!submitSuccess && (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Update Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Update your information based on the feedback you received
          </p>
        </div>

        {/* Rejection Info Card */}
        {riderProfile?.rejectionReason && (
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Reason for Previous Rejection:</h3>
                <p className="text-blue-800 mt-2">{riderProfile.rejectionReason}</p>
                <p className="text-sm text-blue-700 mt-3">
                  Please address these issues and update your information. Your application will be reviewed again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (Cannot be changed)
                </label>
                <input
                  type="email"
                  value={riderProfile?.user?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number (98/97 + 8 digits)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9841234567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Vehicle Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="BA 1 AB 1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* License Number */}
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Location Information</h2>
            
            {/* Map */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Your Location on Map
              </label>
              <LocationMap
                onLocationSelect={handleLocationSelect}
                initialLocation={userLocation}
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>
            </div>

            {/* Store Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Store Location
              </label>
              <select
                name="storeLocationId"
                value={formData.storeLocationId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select a store...</option>
                {storeLocations.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} - {store.address}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Documents</h2>
            
            <div className="space-y-6">
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Profile Photo (Passport Size)
                </label>
                {uploadedPhotos.profilePhoto && (
                  <div className="mb-3">
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${uploadedPhotos.profilePhoto}`}
                      alt="Profile"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ Photo updated</p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "profilePhoto")}
                  accept="image/*"
                  className="hidden"
                  id="profilePhoto"
                />
                <label
                  htmlFor="profilePhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                </label>
              </div>

              {/* License Front */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  License (Front Side)
                </label>
                {uploadedPhotos.licenseFrontPhoto && (
                  <div className="mb-3">
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${uploadedPhotos.licenseFrontPhoto}`}
                      alt="License Front"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ Photo updated</p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "licenseFrontPhoto")}
                  accept="image/*"
                  className="hidden"
                  id="licenseFrontPhoto"
                />
                <label
                  htmlFor="licenseFrontPhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                </label>
              </div>

              {/* License Back */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  License (Back Side)
                </label>
                {uploadedPhotos.licenseBackPhoto && (
                  <div className="mb-3">
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace("/api", "")}${uploadedPhotos.licenseBackPhoto}`}
                      alt="License Back"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <p className="text-xs text-green-600 mt-1">✅ Photo updated</p>
                  </div>
                )}
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, "licenseBackPhoto")}
                  accept="image/*"
                  className="hidden"
                  id="licenseBackPhoto"
                />
                <label
                  htmlFor="licenseBackPhoto"
                  className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Submit Updated Profile"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateRiderProfile;
