const { Cart, Product, StoreLocation } = require("../models/index");

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        // Check if product exists and is in stock
        const product = await Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock",
            });
        }

        // Check if item already in cart
        const existingItem = await Cart.findOne({
            where: { userId, productId },
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (product.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient stock for requested quantity",
                });
            }
            await existingItem.update({ quantity: newQuantity });
            return res.status(200).json({
                success: true,
                message: "Cart updated",
                data: existingItem,
            });
        }

        const cartItem = await Cart.create({
            userId,
            productId,
            quantity,
        });

        return res.status(201).json({
            success: true,
            message: "Item added to cart",
            data: cartItem,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            debug: err.message,
        });
    }
};

// Get user's cart
const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await Cart.findAll({
            where: { userId },
            include: [
                {
                    model: Product,
                    as: "product",
                    attributes: ["id", "name", "price", "imageUrl", "stock", "category"],
                    include: [
                        {
                            model: StoreLocation,
                            as: "storeLocation",
                            attributes: ["id", "name", "address"],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        // Calculate total
        const total = cartItems.reduce((sum, item) => {
            return sum + parseFloat(item.product.price) * item.quantity;
        }, 0);

        return res.status(200).json({
            success: true,
            data: {
                items: cartItems,
                total: parseFloat(total.toFixed(2)),
                count: cartItems.length,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            debug: err.message,
        });
    }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Valid quantity is required",
            });
        }

        const cartItem = await Cart.findOne({
            where: { id, userId },
            include: [{ model: Product, as: "product" }],
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        if (cartItem.product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock",
            });
        }

        await cartItem.update({ quantity });

        return res.status(200).json({
            success: true,
            message: "Cart item updated",
            data: cartItem,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            debug: err.message,
        });
    }
};

// Remove item from cart
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const cartItem = await Cart.findOne({
            where: { id, userId },
        });

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found",
            });
        }

        await cartItem.destroy();

        return res.status(200).json({
            success: true,
            message: "Item removed from cart",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            debug: err.message,
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.destroy({ where: { userId } });

        return res.status(200).json({
            success: true,
            message: "Cart cleared",
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            debug: err.message,
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};
