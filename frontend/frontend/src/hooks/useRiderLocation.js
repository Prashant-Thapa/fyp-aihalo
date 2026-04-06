/**
 * useRiderLocation Hook
 * Manages rider's real-time location tracking and updates
 * Automatically sends location updates to the backend
 */

import { useEffect, useState, useCallback } from "react";
import riderAPI from "../api/riderAssignment.api";

export const useRiderLocation = (riderId, updateInterval = 10000) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);

  const updateLocation = useCallback(async (latitude, longitude) => {
    try {
      setLocation({ latitude, longitude });

      // Send to backend
      if (riderId) {
        await riderAPI.updateRiderLocation(riderId, latitude, longitude);
      }
    } catch (err) {
      console.error("Error updating location:", err);
      setError(err.message);
    }
  }, [riderId]);

  useEffect(() => {
    if (!riderId) return;

    // Start tracking location
    setIsTracking(true);

    // Get initial position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (err) => {
          setError(`Geolocation error: ${err.message}`);
        },
      );

      // Watch position for continuous tracking
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (err) => {
          console.error("Tracking error:", err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: updateInterval,
        },
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        setIsTracking(false);
      };
    } else {
      setError("Geolocation is not supported by this browser");
    }
  }, [riderId, updateInterval, updateLocation]);

  return {
    location,
    error,
    isTracking,
    updateLocation,
  };
};

export default useRiderLocation;
