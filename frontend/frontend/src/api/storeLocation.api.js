import api from "./axios";

// Get all store locations
export const getAllStoreLocations = async () => {
  const response = await api.get("/store-locations");
  return response.data;
};

// Get nearby store locations
export const getNearbyStoreLocations = async (latitude, longitude) => {
  const response = await api.get("/store-locations/nearby", {
    params: { latitude, longitude },
  });
  return response.data;
};

// Get store location by ID
export const getStoreLocationById = async (id) => {
  const response = await api.get(`/store-locations/${id}`);
  return response.data;
};

// Create store location (admin only)
export const createStoreLocation = async (storeData) => {
  const response = await api.post("/store-locations", storeData);
  return response.data;
};

// Get my store locations (admin only)
export const getMyStoreLocations = async () => {
  const response = await api.get("/store-locations/admin/my-locations");
  return response.data;
};

// Update store location (admin only)
export const updateStoreLocation = async (id, storeData) => {
  const response = await api.put(`/store-locations/${id}`, storeData);
  return response.data;
};

// Delete store location (admin only)
export const deleteStoreLocation = async (id) => {
  const response = await api.delete(`/store-locations/${id}`);
  return response.data;
};
