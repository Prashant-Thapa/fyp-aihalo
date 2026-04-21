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

// Get rider profile by email (public route for rejected riders)
export const getRiderProfileByEmail = async (email) => {
  const response = await api.get("/riders/profile-by-email", {
    params: { email },
  });
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
export const updateRiderStatus = async (id, status, payload = null) => {
  const data = payload || { status };
  const response = await api.put(`/riders/${id}/status`, data);
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

// Reset rejected registration and allow re-register
export const resetRejectedRegistration = async (email, password) => {
  const response = await api.post("/riders/reset-rejected", {
    email,
    password,
  });
  return response.data;
};

// Update rider documents (for rejected riders to resubmit)
export const updateRiderDocuments = async (riderId, profilePhoto, licenseFrontPhoto, licenseBackPhoto) => {
  const response = await api.put(`/riders/${riderId}/documents`, {
    profilePhoto,
    licenseFrontPhoto,
    licenseBackPhoto,
  });
  return response.data;
};

// Update rider documents without auth (for rejected riders updating profile)
export const updateRiderDocumentsPublic = async (riderId, profilePhoto, licenseFrontPhoto, licenseBackPhoto) => {
  const response = await api.put(`/riders/${riderId}/documents-public`, {
    profilePhoto,
    licenseFrontPhoto,
    licenseBackPhoto,
  });
  return response.data;
};
