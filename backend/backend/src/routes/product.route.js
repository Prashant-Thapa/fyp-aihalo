const express = require("express");
const {
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controller/product.controller");
const { authMiddleware, adminMiddleware } = require("../middleware/auth.middleware");
const { handleUpload } = require("../middleware/upload.middleware");

const router = express.Router();

// Admin routes (specific routes first)
router.get("/admin/my-products", authMiddleware, adminMiddleware, getMyProducts);
router.post("/", authMiddleware, adminMiddleware, handleUpload, createProduct);
router.put("/:id", authMiddleware, adminMiddleware, handleUpload, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

// Public routes
router.get("/", getAllProducts);
router.get("/:id", getProductById);

module.exports = router;
