/**
 * RiderOrderTracking Component
 * Displays rider's assigned orders with real-time distance tracking
 * Shows orders and allows rider to update status
 */

import React, { useState, useEffect, useCallback } from "react";
import { getDistanceMetrics } from "../utils/distanceCalculator";
import riderAPI from "../api/rider.api";
import "./RiderOrderTracking.css";

const RiderOrderTracking = ({ riderId, riderLocation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchRiderOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await riderAPI.getRiderOrders(riderId);
      if (response.data.success) {
        setOrders(response.data.data.orders || []);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [riderId]);

  useEffect(() => {
    fetchRiderOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchRiderOrders, 30000);
    return () => clearInterval(interval);
  }, [riderId, fetchRiderOrders]);

  const calculateDistanceToOrder = (order) => {
    if (!riderLocation || !order) return null;

    return getDistanceMetrics(
      riderLocation.latitude,
      riderLocation.longitude,
      order.latitude,
      order.longitude,
    );
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: "#ffc107",
      confirmed: "#0dcaf0",
      rider_assigned: "#0d6efd",
      accepted: "#0d6efd",
      picked_up: "#198754",
      on_the_way: "#6f42c1",
      delivered: "#198754",
      cancelled: "#dc3545",
    };
    return colors[status] || "#6c757d";
  };

  if (loading) {
    return (
      <div className="rider-order-tracking">
        <div className="loading-state">
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rider-order-tracking">
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchRiderOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rider-order-tracking">
      <div className="tracking-header">
        <h2>Active Orders</h2>
        <div className="order-count">
          <span className="count-badge">{orders.length}</span>
          {orders.length > 1 && <p>Multiple orders</p>}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>📦 No active orders</p>
          <p className="sub-text">Check back soon for new delivery requests</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const distance = calculateDistanceToOrder(order);
            const statusColor = getOrderStatusColor(order.status);

            return (
              <div
                key={order.id}
                className="order-card"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-header">
                  <div className="order-id">
                    <span className="label">Order</span>
                    <span className="id">#{order.id}</span>
                  </div>
                  <div
                    className="order-status"
                    style={{ borderColor: statusColor }}
                  >
                    <span style={{ color: statusColor }}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Customer</span>
                    <span className="value">
                      {order.user?.name || "Unknown"}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Delivery Address</span>
                    <span className="value address">
                      {order.deliveryAddress}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Total Price</span>
                    <span className="value price">${order.totalPrice}</span>
                  </div>
                </div>

                {distance && (
                  <div className="distance-badge">
                    <span className="distance">{distance.displayDistance}</span>
                    <span className="time">
                      ~{distance.estimatedTimeMinutes} min
                    </span>
                  </div>
                )}

                <div className="order-items-preview">
                  <span className="label">Items:</span>
                  <div className="items">
                    {order.items?.slice(0, 3).map((item) => (
                      <span key={item.id} className="item-badge">
                        {item.product?.name}
                      </span>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="item-badge more">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-actions">
                  <button className="btn btn-view">View Details</button>
                  <button className="btn btn-navigate">📍 Navigate</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Order Modal/Detail */}
      {selectedOrder && (
        <div
          className="order-detail-modal"
          onClick={() => setSelectedOrder(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedOrder(null)}
            >
              ✕
            </button>

            <h3>Order #{selectedOrder.id}</h3>

            <div className="detail-section">
              <h4>Customer Information</h4>
              <p>
                <strong>Name:</strong> {selectedOrder.user?.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedOrder.user?.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedOrder.user?.email}
              </p>
            </div>

            <div className="detail-section">
              <h4>Delivery Details</h4>
              <p>
                <strong>Address:</strong> {selectedOrder.deliveryAddress}
              </p>
              <p>
                <strong>Location:</strong> {selectedOrder.latitude},{" "}
                {selectedOrder.longitude}
              </p>
            </div>

            <div className="detail-section">
              <h4>Order Items</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product?.name}</td>
                      <td>{item.quantity}</td>
                      <td>${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="total">
                <strong>Total:</strong>
                <strong>${selectedOrder.totalPrice}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary">Accept Order</button>
              <button className="btn btn-secondary">Decline Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderOrderTracking;
