import api from "./axios";

// Register as a rider
export const registerRider = async (riderData) => {
  const response = await api.post("/riders/register", riderData);
  return response.data;
};

// Get rider profile
export const getRiderProfile = async () => {
  const response = await api.get("/riders/profile");
  return response.data;
};

// Update rider availability
export const updateRiderAvailability = async (data) => {
  const response = await api.put("/riders/availability", data);
  return response.data;
};

// Get all riders (admin only)
export const getAllRiders = async () => {
  const response = await api.get("/riders");
  return response.data;
};

// Get riders by store location (admin only)
export const getRidersByStoreLocation = async (storeLocationId) => {
  const response = await api.get(`/riders/store/${storeLocationId}`);
  return response.data;
};

// Update rider status (admin only)
export const updateRiderStatus = async (id, status) => {
  const response = await api.put(`/riders/${id}/status`, { status });
  return response.data;
};

// Get orders assigned to rider
export const getRiderOrders = async () => {
  const response = await api.get("/riders/orders");
  return response.data;
};

// Update order status (rider)
export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/riders/order/${orderId}/status`, { status });
  return response.data;
};

// Accept an assigned order (rider)
export const acceptOrder = async (orderId) => {
  const response = await api.post(`/riders/order/${orderId}/accept`);
  return response.data;
};

// Reject an assigned order (rider) — triggers smart reassignment
export const rejectOrder = async (orderId) => {
  const response = await api.post(`/riders/order/${orderId}/reject`);
  return response.data;
};

// Update rider's current location
export const updateRiderLocation = async (latitude, longitude) => {
  const response = await api.put("/riders/location", { latitude, longitude });
  return response.data;
};

// Check if delivery location is within store coverage area
export const checkLocationCoverage = async (
  storeLocationId,
  latitude,
  longitude,
) => {
  const response = await api.post("/riders/check-coverage", {
    storeLocationId,
    latitude,
    longitude,
  });
  return response.data;
};
