const { Product, StockAlert, StoreLocation } = require("../models/index");
const { Op } = require("sequelize");

const STOCK_THRESHOLD = 20;

// Check products and create alerts for low stock
const checkAndCreateAlerts = async (productIds = null) => {
  try {
    const whereClause = { stock: { [Op.lt]: STOCK_THRESHOLD }, isActive: true };
    if (productIds) {
      whereClause.id = { [Op.in]: Array.isArray(productIds) ? productIds : [productIds] };
    }

    const lowStockProducts = await Product.findAll({ where: whereClause });

    const alerts = [];
    for (const product of lowStockProducts) {
      // Check if an unread alert already exists for this product
      const existingAlert = await StockAlert.findOne({
        where: { productId: product.id, isRead: false },
      });

      if (!existingAlert) {
        const alert = await StockAlert.create({
          productId: product.id,
          productName: product.name,
          currentStock: product.stock,
          threshold: STOCK_THRESHOLD,
        });
        alerts.push(alert);
      } else {
        // Update the stock count on the existing alert
        await existingAlert.update({ currentStock: product.stock });
        alerts.push(existingAlert);
      }
    }

    return alerts;
  } catch (err) {
    console.error("[STOCK_ALERT] Error checking stock:", err.message);
    return [];
  }
};

// GET /api/stock-alerts — get all alerts for admin
const getStockAlerts = async (req, res) => {
  try {
    const alerts = await StockAlert.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "stock", "imageUrl", "storeLocationId"],
          include: [
            {
              model: StoreLocation,
              as: "storeLocation",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      data: alerts,
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

// PUT /api/stock-alerts/:id/read — mark one alert as read
const markAlertRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await StockAlert.findByPk(id);

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    await alert.update({ isRead: true });

    return res.status(200).json({ success: true, message: "Alert marked as read" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/stock-alerts/read-all — mark all alerts as read
const markAllAlertsRead = async (req, res) => {
  try {
    await StockAlert.update({ isRead: true }, { where: { isRead: false } });

    return res.status(200).json({ success: true, message: "All alerts marked as read" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  checkAndCreateAlerts,
  getStockAlerts,
  markAlertRead,
  markAllAlertsRead,
  STOCK_THRESHOLD,
};
