import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getCart, addToCart as addToCartApi, updateCartItem as updateCartItemApi, removeCartItem as removeCartItemApi, clearCart as clearCartApi } from "../api/cart.api";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCart = useCallback(async () => {
        if (!isAuthenticated) {
            setItems([]);
            setTotal(0);
            setCount(0);
            return;
        }
        try {
            setLoading(true);
            const response = await getCart();
            if (response.success) {
                setItems(response.data.items);
                setTotal(response.data.total);
                setCount(response.data.count);
            }
        } catch (err) {
            console.error("Failed to fetch cart:", err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = async (productId, quantity = 1) => {
        try {
            const response = await addToCartApi(productId, quantity);
            if (response.success) {
                await fetchCart();
            }
            return response;
        } catch (err) {
            throw err;
        }
    };

    const updateItem = async (id, quantity) => {
        try {
            const response = await updateCartItemApi(id, quantity);
            if (response.success) {
                await fetchCart();
            }
            return response;
        } catch (err) {
            throw err;
        }
    };

    const removeItem = async (id) => {
        try {
            const response = await removeCartItemApi(id);
            if (response.success) {
                await fetchCart();
            }
            return response;
        } catch (err) {
            throw err;
        }
    };

    const emptyCart = async () => {
        try {
            const response = await clearCartApi();
            if (response.success) {
                setItems([]);
                setTotal(0);
                setCount(0);
            }
            return response;
        } catch (err) {
            throw err;
        }
    };

    const value = {
        items,
        total,
        count,
        loading,
        addToCart,
        updateItem,
        removeItem,
        emptyCart,
        fetchCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};

export default CartContext;
