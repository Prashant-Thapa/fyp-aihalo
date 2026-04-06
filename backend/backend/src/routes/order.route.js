const express = require("express");
const {
    createOrder,
    getUserOrders,
    getOrderById,
    reorderItems,
    confirmDelivery,
} = require("../controller/order.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

// All order routes require authentication
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/:id", authMiddleware, getOrderById);
router.post("/:id/reorder", authMiddleware, reorderItems);
router.post("/:id/confirm", authMiddleware, confirmDelivery);

module.exports = router;
