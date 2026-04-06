import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import LocationMap from "../../components/LocationMap";
import {
  getMyStoreLocations,
  createStoreLocation,
  updateStoreLocation,
  deleteStoreLocation,
} from "../../api/storeLocation.api";

const StoreLocationsPage = () => {
  const [storeLocations, setStoreLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radius: 10,
  });

  useEffect(() => {
    fetchStoreLocations();
  }, []);

  const fetchStoreLocations = async () => {
    try {
      setLoading(true);
      const response = await getMyStoreLocations();
      setStoreLocations(response.data || []);
    } catch (err) {
      setError("Failed to fetch store locations");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lng, radius: formData.radius });
    setFormData({
      ...formData,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingStore) {
        await updateStoreLocation(editingStore.id, formData);
        setSuccess("Store location updated successfully!");
      } else {
        await createStoreLocation(formData);
        setSuccess("Store location created successfully!");
      }
      fetchStoreLocations();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save store location");
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      radius: store.radius,
    });
    setSelectedLocation({
      lat: parseFloat(store.latitude),
      lng: parseFloat(store.longitude),
      radius: store.radius,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this store location?")) {
      return;
    }

    try {
      await deleteStoreLocation(id);
      setSuccess("Store location deleted successfully!");
      fetchStoreLocations();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete store location");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      radius: 10,
    });
    setSelectedLocation(null);
    setEditingStore(null);
    setShowModal(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude, radius: formData.radius });
          setFormData({
            ...formData,
            latitude: latitude.toFixed(8),
            longitude: longitude.toFixed(8),
          });
        },
        (error) => {
          setError("Failed to get your location. Please select on map.");
        }
      );
    }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store Locations</h1>
          <p className="text-gray-500 mt-1">
            Manage your store locations and delivery zones
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B4E3C] text-white rounded-lg hover:bg-[#093F31] transition"
        >
          <Plus className="w-5 h-5" />
          Add Location
        </button>
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

      {/* Map Overview */}
      <div className="mb-6">
        <LocationMap
          storeLocations={storeLocations}
          height="300px"
          showRadius={true}
        />
      </div>

      {/* Store Locations List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coordinates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Radius
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {storeLocations.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                  No store locations yet. Add your first location!
                </td>
              </tr>
            ) : (
              storeLocations.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0B4E3C]/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-[#0B4E3C]" />
                      </div>
                      <span className="font-medium">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{store.address}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {parseFloat(store.latitude).toFixed(4)}, {parseFloat(store.longitude).toFixed(4)}
                  </td>
                  <td className="px-6 py-4">{store.radius} km</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(store)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition mr-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold">
                {editingStore ? "Edit Store Location" : "Add New Store Location"}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} id="store-form">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Side - Form Fields */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Store Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude *
                        </label>
                        <input
                          type="text"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none"
                          required
                          readOnly
                          placeholder="Click on map"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude *
                        </label>
                        <input
                          type="text"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none"
                          required
                          readOnly
                          placeholder="Click on map"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Radius (km) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.radius}
                        onChange={(e) => {
                          const radius = parseInt(e.target.value);
                          setFormData({ ...formData, radius });
                          if (selectedLocation) {
                            setSelectedLocation({ ...selectedLocation, radius });
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="w-full py-2 border border-[#0B4E3C] text-[#0B4E3C] rounded-lg hover:bg-[#0B4E3C]/10 transition"
                    >
                      Use My Current Location
                    </button>
                  </div>

                  {/* Right Side - Map */}
                  <div className="flex-1 min-h-[350px]">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Click on map to select location
                    </label>
                    <div style={{ height: '320px', width: '100%' }}>
                      <LocationMap
                        key={showModal ? "modal-map-open" : "modal-map-closed"}
                        center={
                          selectedLocation
                            ? [selectedLocation.lat, selectedLocation.lng]
                            : [27.7172, 85.324]
                        }
                        selectedLocation={selectedLocation}
                        onMapClick={handleMapClick}
                        showRadius={true}
                        height={320}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex-shrink-0 flex justify-end gap-4 bg-gray-50">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="store-form"
                className="px-6 py-2 bg-[#0B4E3C] text-white rounded-lg hover:bg-[#093F31] transition"
              >
                {editingStore ? "Update Location" : "Add Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLocationsPage;
