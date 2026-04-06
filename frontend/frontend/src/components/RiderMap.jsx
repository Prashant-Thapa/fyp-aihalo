/**
 * RiderMap Component
 * Displays real-time map with store, rider, and delivery location
 * Uses coordinates to show distances and route
 *
 * Required Props:
 * - storeLocation: { latitude, longitude, name }
 * - riderLocation: { latitude, longitude }
 * - deliveryLocation: { latitude, longitude, address }
 * - orderId: number
 */

import React, { useEffect, useState } from "react";
import { getDistanceMetrics } from "../utils/distanceCalculator";
import "./RiderMap.css";

const RiderMap = ({
  storeLocation,
  riderLocation,
  deliveryLocation,
  orderId,
  orderStatus,
}) => {
  const [distances, setDistances] = useState({
    storeToRider: "0 km",
    riderToDelivery: "0 km",
    totalDistance: "0 km",
    estimatedTime: "0 min",
  });

  useEffect(() => {
    if (storeLocation && riderLocation && deliveryLocation) {
      // Calculate distance from store to rider
      const storeToRiderMetrics = getDistanceMetrics(
        storeLocation.latitude,
        storeLocation.longitude,
        riderLocation.latitude,
        riderLocation.longitude,
      );

      // Calculate distance from rider to delivery
      const riderToDeliveryMetrics = getDistanceMetrics(
        riderLocation.latitude,
        riderLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      );

      // Calculate total distance
      const totalDistanceMetrics = getDistanceMetrics(
        storeLocation.latitude,
        storeLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude,
      );

      setDistances({
        storeToRider: storeToRiderMetrics.displayDistance,
        riderToDelivery: riderToDeliveryMetrics.displayDistance,
        totalDistance: totalDistanceMetrics.displayDistance,
        estimatedTime: `${riderToDeliveryMetrics.estimatedTimeMinutes} min`,
      });
    }
  }, [storeLocation, riderLocation, deliveryLocation]);

  if (!storeLocation || !riderLocation || !deliveryLocation) {
    return (
      <div className="rider-map-container error">
        <p>Loading location data...</p>
      </div>
    );
  }

  return (
    <div className="rider-map-container">
      <div className="map-header">
        <h2>Order Tracking - #{orderId}</h2>
        <span className={`status-badge ${orderStatus}`}>
          {orderStatus?.toUpperCase()}
        </span>
      </div>

      {/* Map area - You'll need to integrate Google Maps or Leaflet */}
      <div className="map-area">
        <p className="map-placeholder">
          🗺️ Map Integration Required (Google Maps or Leaflet)
        </p>
        <div className="coordinates-info">
          <p>
            <strong>Store:</strong> {storeLocation.latitude},{" "}
            {storeLocation.longitude}
          </p>
          <p>
            <strong>Rider:</strong> {riderLocation.latitude},{" "}
            {riderLocation.longitude}
          </p>
          <p>
            <strong>Delivery:</strong> {deliveryLocation.latitude},{" "}
            {deliveryLocation.longitude}
          </p>
        </div>
      </div>

      {/* Distance Information */}
      <div className="distance-info">
        <div className="distance-card">
          <h3>Store to Rider</h3>
          <p className="distance-value">{distances.storeToRider}</p>
          <p className="location-name">{storeLocation.name}</p>
        </div>

        <div className="distance-card">
          <h3>Rider to Delivery</h3>
          <p className="distance-value">{distances.riderToDelivery}</p>
          <p className="location-name">{deliveryLocation.address}</p>
        </div>

        <div className="distance-card highlight">
          <h3>Total Distance</h3>
          <p className="distance-value">{distances.totalDistance}</p>
          <p className="estimated-time">Est. Time: {distances.estimatedTime}</p>
        </div>
      </div>

      {/* Route Summary */}
      <div className="route-summary">
        <div className="route-step">
          <div className="step-icon store">📍</div>
          <div className="step-content">
            <h4>Pickup</h4>
            <p>{storeLocation.name}</p>
          </div>
        </div>

        <div className="route-connector"></div>

        <div className="route-step">
          <div className="step-icon rider">🚗</div>
          <div className="step-content">
            <h4>In Transit</h4>
            <p>Rider on the way</p>
          </div>
        </div>

        <div className="route-connector"></div>

        <div className="route-step">
          <div className="step-icon delivery">🎯</div>
          <div className="step-content">
            <h4>Delivery</h4>
            <p>{deliveryLocation.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderMap;
