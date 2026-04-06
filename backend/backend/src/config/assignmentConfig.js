/**
 * Rider Assignment Configuration
 * Centralized configuration for the rider assignment system
 */

module.exports = {
  // Maximum distance to search for riders (km)
  MAX_ASSIGNMENT_RADIUS_KM: process.env.MAX_ASSIGNMENT_RADIUS_KM || 5,

  // Minimum rider rating for assignment (0-5)
  MIN_RIDER_RATING: process.env.MIN_RIDER_RATING || 0,

  // Only assign verified riders
  PREFER_VERIFIED_RIDERS:
    process.env.PREFER_VERIFIED_RIDERS !== "false" || true,

  // Auto-assign on order creation
  AUTO_ASSIGN_ON_CREATE: process.env.AUTO_ASSIGN_ON_CREATE !== "false" || true,

  // Estimated speed for time calculation (km/h)
  AVERAGE_RIDER_SPEED: process.env.AVERAGE_RIDER_SPEED || 20,

  // Enable real-time location tracking
  ENABLE_REAL_TIME_TRACKING:
    process.env.ENABLE_REAL_TIME_TRACKING !== "false" || true,

  // Location update interval for riders (milliseconds)
  LOCATION_UPDATE_INTERVAL: process.env.LOCATION_UPDATE_INTERVAL || 10000, // 10 seconds

  // Maximum orders per rider at once
  MAX_CONCURRENT_ORDERS_PER_RIDER:
    process.env.MAX_CONCURRENT_ORDERS_PER_RIDER || 1,

  // Assignment timeout (minutes before re-assignment if rider hasn't accepted)
  ASSIGNMENT_TIMEOUT_MINUTES: process.env.ASSIGNMENT_TIMEOUT_MINUTES || 5,

  // Enable priority assignment based on rider performance
  ENABLE_PERFORMANCE_PRIORITY:
    process.env.ENABLE_PERFORMANCE_PRIORITY === "true" || false,

  // Socket event names for real-time updates
  SOCKET_EVENTS: {
    RIDER_ASSIGNED: "rider_assigned",
    RIDER_LOCATION_UPDATED: "rider_location_updated",
    ORDER_STATUS_CHANGED: "order_status_changed",
    AVAILABLE_RIDERS_FOUND: "available_riders_found",
  },
};
