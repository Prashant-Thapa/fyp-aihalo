/**
 * Rider API Client
 * Handles all rider-related API calls
 */

import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const riderAPI = {
  /**
   * Get nearby available riders
   */
  getNearbyRiders: async (latitude, longitude, storeLocationId, radius = 5) => {
    return axios.get(`${BASE_URL}/rider-assignment/nearby`, {
      params: {
        latitude,
        longitude,
        storeLocationId,
        radius,
      },
    });
  },

  /**
   * Assign nearest rider to an order
   */
  assignNearestRider: async (orderId) => {
    return axios.post(`${BASE_URL}/rider-assignment/assign/${orderId}`);
  },

  /**
   * Manually assign a specific rider to an order
   */
  manuallyAssignRider: async (orderId, riderId) => {
    return axios.post(`${BASE_URL}/rider-assignment/assign-manual`, {
      orderId,
      riderId,
    });
  },

  /**
   * Reassign order to a different rider
   */
  reassignRider: async (orderId, newRiderId) => {
    return axios.post(`${BASE_URL}/rider-assignment/reassign/${orderId}`, {
      newRiderId,
    });
  },

  /**
   * Update rider's current location (real-time tracking)
   */
  updateRiderLocation: async (riderId, latitude, longitude) => {
    return axios.put(`${BASE_URL}/rider-assignment/${riderId}/location`, {
      latitude,
      longitude,
    });
  },

  /**
   * Release rider after completing delivery
   */
  releaseRider: async (riderId) => {
    return axios.put(`${BASE_URL}/rider-assignment/${riderId}/release`);
  },

  /**
   * Get rider's assigned orders
   */
  getRiderOrders: async (riderId) => {
    return axios.get(`${BASE_URL}/rider-assignment/${riderId}/orders`);
  },
};

export default riderAPI;
