/**
 * Frontend Distance Calculator Utility
 * Haversine formula for calculating distance between coordinates
 */

/**
 * Calculate distance between two coordinates
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
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

/**
 * Convert degrees to radians
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calculate distance with human-readable format
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {object} Distance metrics
 */
export const getDistanceMetrics = (lat1, lon1, lat2, lon2) => {
  const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
  const distanceM = distanceKm * 1000;
  const estimatedTimeMinutes = Math.ceil(distanceKm / 20); // 20 km/h avg speed

  return {
    distanceKm: distanceKm.toFixed(2),
    distanceM: Math.round(distanceM),
    estimatedTimeMinutes,
    displayDistance:
      distanceKm < 1
        ? `${Math.round(distanceM)} m`
        : `${distanceKm.toFixed(2)} km`,
  };
};

/**
 * Get center point between two coordinates (for map centering)
 */
export const getCenterPoint = (lat1, lon1, lat2, lon2) => {
  return {
    latitude: (parseFloat(lat1) + parseFloat(lat2)) / 2,
    longitude: (parseFloat(lon1) + parseFloat(lon2)) / 2,
  };
};
