import api from "./axios";

// Create order from cart
export const createOrder = async (orderData) => {
    const response = await api.post("/orders", orderData);
    return response.data;
};

// Get user's orders
export const getUserOrders = async () => {
    const response = await api.get("/orders");
    return response.data;
};

// Get single order
export const getOrderById = async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
};

// Reorder – re-add a past order's items to cart
export const reorderItems = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/reorder`);
    return response.data;
};

// Confirm delivery (customer dual verification)
export const confirmDelivery = async (orderId) => {
    const response = await api.post(`/orders/${orderId}/confirm`);
    return response.data;
};
