import { useState, useEffect, useCallback } from "react";
import { MapPin, Loader, Navigation, CheckCircle } from "lucide-react";
import { getRiderProfile, updateRiderLocation } from "../../api/rider.api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Rider pin (green pulsing)
const riderIcon = new L.DivIcon({
  html: `
    <div style="
      width:40px; height:40px;
      background:linear-gradient(135deg,#0B4E3C,#1a7a5e);
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 14px rgba(11,78,60,0.45);
      border:3px solid white;
      font-size:18px;
    ">🛵</div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// Store icon (orange marker)
const storeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Click handler component — places pin where user clicks
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const RiderLocationUpdate = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [gpsWatching, setGpsWatching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Default map center (Kathmandu) — will update once profile or GPS loads
  const mapCenter =
    latitude && longitude
      ? [parseFloat(latitude), parseFloat(longitude)]
      : [27.7172, 85.324];

  useEffect(() => {
    fetchProfile();
    return () => {
      // Cleanup GPS watcher on unmount
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getRiderProfile();
      if (response.success) {
        setProfile(response.data);
        if (response.data.latitude) setLatitude(response.data.latitude.toString());
        if (response.data.longitude) setLongitude(response.data.longitude.toString());
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // Map click — pin location on click
  const handleMapClick = useCallback((lat, lng) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setSuccess("");
    setError("");
  }, []);

  // One-shot GPS
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setSuccess("");
        setError("");
      },
      () => setError("Could not get your location. Please enable location access."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Toggle live GPS watch
  const handleToggleLiveGPS = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    if (gpsWatching) {
      // Stop watching
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setGpsWatching(false);
      setSuccess("Live GPS stopped.");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      // Start watching — auto-update every movement
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          // Auto-save to server on each GPS update
          try {
            await updateRiderLocation(parseFloat(lat), parseFloat(lng));
          } catch {
            // Silently fail for background updates
          }
        },
        () => setError("GPS watch failed. Check location permissions."),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );
      setWatchId(id);
      setGpsWatching(true);
      setSuccess("Live GPS is active — your location updates automatically!");
      setTimeout(() => setSuccess(""), 5000);
    }
  };

  // Manual submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!latitude || !longitude) {
      setError("Please enter or pin your location on the map.");
      return;
    }

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    if (
      isNaN(parsedLat) ||
      isNaN(parsedLng) ||
      parsedLat < -90 ||
      parsedLat > 90 ||
      parsedLng < -180 ||
      parsedLng > 180
    ) {
      setError("Invalid coordinates. Latitude: -90…90, Longitude: -180…180.");
      return;
    }

    try {
      setUpdating(true);
      const response = await updateRiderLocation(parsedLat, parsedLng);
      if (response.success) {
        setSuccess("✓ Location updated! You are now visible for order assignment.");
        setProfile({ ...profile, latitude: response.data.latitude, longitude: response.data.longitude });
        setTimeout(() => setSuccess(""), 6000);
      } else {
        setError(response.message || "Update failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update location. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-[#0B4E3C]" size={40} />
          <p className="text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0B4E3C] to-[#1a7a5e] text-white px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <MapPin size={28} />
            <h1 className="text-2xl font-bold">My Location</h1>
          </div>
          <p className="text-green-200 text-sm">
            Set your location to receive orders from customers near your store
          </p>

          {/* Live GPS badge */}
          {gpsWatching && (
            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live GPS Active
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Store info banner */}
        {profile?.storeLocation && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-sm text-blue-800">
            🏪 <strong>Your Store:</strong> {profile.storeLocation.name} — Coverage radius: <strong>{profile.storeLocation.radius} km</strong>
          </div>
        )}

        {/* Error / Success alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* ── Interactive Map ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={17} className="text-[#0B4E3C]" />
              Click on the map to pin your location
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Then click <strong>Update Location</strong> below to save
            </p>
          </div>

          <div style={{ height: "360px" }}>
            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Rider pin */}
              {latitude && longitude && (
                <Marker
                  position={[parseFloat(latitude), parseFloat(longitude)]}
                  icon={riderIcon}
                >
                  <Popup>
                    <strong>📍 Your Location</strong>
                    <br />
                    {latitude}, {longitude}
                  </Popup>
                </Marker>
              )}

              {/* Store pin */}
              {profile?.storeLocation?.latitude && (
                <Marker
                  position={[
                    parseFloat(profile.storeLocation.latitude),
                    parseFloat(profile.storeLocation.longitude),
                  ]}
                  icon={storeIcon}
                >
                  <Popup>
                    <strong>🏪 {profile.storeLocation.name}</strong>
                    <br />
                    Your assigned store
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Set Location</h2>

          {/* GPS buttons row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {/* One-shot GPS */}
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors"
            >
              <Navigation size={18} />
              Use My GPS Location
            </button>

            {/* Live GPS toggle */}
            <button
              type="button"
              onClick={handleToggleLiveGPS}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium border transition-colors ${gpsWatching
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                }`}
            >
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${gpsWatching ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
              />
              {gpsWatching ? "Stop Live GPS" : "Start Live GPS Tracking"}
            </button>
          </div>

          {/* Manual input row */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 27.7172"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 85.3240"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            {/* Current coords display */}
            {latitude && longitude && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 font-mono text-sm text-[#0B4E3C]">
                📍 {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={updating || gpsWatching}
              className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  {gpsWatching ? "Live GPS is Auto-Saving" : "Update Location"}
                </>
              )}
            </button>
          </form>

          {gpsWatching && (
            <p className="text-xs text-green-600 text-center mt-3">
              ✓ Your location is being sent to the server automatically as you move
            </p>
          )}
        </div>

        {/* Tip box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm text-amber-800">
            💡 <strong>How it works:</strong> Click the map to pin your location, use GPS for automatic detection, or start Live GPS for continuous real-time tracking. You <strong>must</strong> be within the store's delivery radius to receive orders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiderLocationUpdate;
