const express = require("express");
const {
    addToCart,
    getCart,
    updateCartItem,
    removeCartItem,
    clearCart,
} = require("../controller/cart.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// All cart routes require authentication
router.post("/add", authMiddleware, addToCart);
router.get("/", authMiddleware, getCart);
router.put("/:id", authMiddleware, updateCartItem);
router.delete("/clear", authMiddleware, clearCart);
router.delete("/:id", authMiddleware, removeCartItem);

module.exports = router;
