const Product = require("../models/product.model");
const StoreLocation = require("../models/storeLocation.model");
const fs = require("fs");
const path = require("path");
const { checkAndCreateAlerts, STOCK_THRESHOLD } = require("./stockAlert.controller");
const { emitStockAlert } = require("../socket/socketHandler");

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, storeLocationId } = req.body;
    const adminId = req.user.id;

    if (!name || !price || !category || !storeLocationId) {
      // Delete uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: "Name, price, category, and store location are required",
      });
    }

    // Verify the store location belongs to this admin
    const storeLocation = await StoreLocation.findOne({
      where: { id: storeLocationId, adminId },
    });

    if (!storeLocation) {
      // Delete uploaded file if unauthorized
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        message: "Store location not found or unauthorized",
      });
    }

    // Build image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      imageUrl,
      stock: stock || 0,
      storeLocationId,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { storeLocationId, category } = req.query;
    
    const whereClause = { isActive: true };
    if (storeLocationId) whereClause.storeLocationId = storeLocationId;
    if (category) whereClause.category = category;

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: products,
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

// Get products by store location (for admin)
const getMyProducts = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get all store locations for this admin
    const storeLocations = await StoreLocation.findAll({
      where: { adminId },
      attributes: ["id"],
    });

    const storeLocationIds = storeLocations.map((loc) => loc.id);

    const products = await Product.findAll({
      where: {
        storeLocationId: storeLocationIds,
        isActive: true,
      },
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: products,
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

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
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

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, isActive } = req.body;
    const adminId = req.user.id;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          where: { adminId },
        },
      ],
    });

    if (!product) {
      // Delete uploaded file if product not found
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    // Handle image update
    let imageUrl = product.imageUrl;
    if (req.file) {
      // Delete old image if it exists and is a local file
      if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
        const oldImagePath = path.join(__dirname, "../..", product.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/products/${req.file.filename}`;
    }

    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      category: category || product.category,
      imageUrl: imageUrl,
      stock: stock !== undefined ? stock : product.stock,
      isActive: isActive !== undefined ? isActive : product.isActive,
    });

    // Reload the product with associations to return fresh data
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          attributes: ["id", "name", "address"],
        },
      ],
    });

    // Check for low stock alert after update
    if (updatedProduct.stock < STOCK_THRESHOLD) {
      try {
        const alerts = await checkAndCreateAlerts([updatedProduct.id]);
        for (const alert of alerts) {
          emitStockAlert(alert);
        }
      } catch (alertErr) {
        console.error("[STOCK_ALERT] Warning:", alertErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (err) {
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: StoreLocation,
          as: "storeLocation",
          where: { adminId },
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unauthorized",
      });
    }

    await product.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
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
  createProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
