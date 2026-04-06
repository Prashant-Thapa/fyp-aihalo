import api from "./axios";

// Add item to cart
export const addToCart = async (productId, quantity = 1) => {
    const response = await api.post("/cart/add", { productId, quantity });
    return response.data;
};

// Get user's cart
export const getCart = async () => {
    const response = await api.get("/cart");
    return response.data;
};

// Update cart item quantity
export const updateCartItem = async (id, quantity) => {
    const response = await api.put(`/cart/${id}`, { quantity });
    return response.data;
};

// Remove item from cart
export const removeCartItem = async (id) => {
    const response = await api.delete(`/cart/${id}`);
    return response.data;
};

// Clear entire cart
export const clearCart = async () => {
    const response = await api.delete("/cart/clear");
    return response.data;
};
