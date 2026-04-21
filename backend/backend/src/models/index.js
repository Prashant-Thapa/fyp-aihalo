const User = require("./user.model");
const StoreLocation = require("./storeLocation.model");
const Product = require("./product.model");
const Rider = require("./rider.model");
const Order = require("./order.model");
const OrderItem = require("./orderItem.model");
const Cart = require("./cart.model");
const StockAlert = require("./stockAlert.model");
const EmailVerificationToken = require("./emailVerificationToken.model");
const PasswordResetToken = require("./passwordResetToken.model");

// Define associations

// User <-> StoreLocation
User.hasMany(StoreLocation, { foreignKey: "adminId", as: "storeLocations" });
StoreLocation.belongsTo(User, { foreignKey: "adminId", as: "admin" });

// StoreLocation <-> Product
StoreLocation.hasMany(Product, {
  foreignKey: "storeLocationId",
  as: "products",
});
Product.belongsTo(StoreLocation, {
  foreignKey: "storeLocationId",
  as: "storeLocation",
});

// User <-> Rider
User.hasOne(Rider, { foreignKey: "userId", as: "riderProfile" });
Rider.belongsTo(User, { foreignKey: "userId", as: "user" });

// StoreLocation <-> Rider
StoreLocation.hasMany(Rider, { foreignKey: "storeLocationId", as: "riders" });
Rider.belongsTo(StoreLocation, {
  foreignKey: "storeLocationId",
  as: "storeLocation",
});

// User <-> Order
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.belongsTo(User, { foreignKey: "userId", as: "user" });

// Rider <-> Order
Rider.hasMany(Order, { foreignKey: "riderId", as: "orders" });
Order.belongsTo(Rider, { foreignKey: "riderId", as: "rider" });

// StoreLocation <-> Order
StoreLocation.hasMany(Order, { foreignKey: "storeLocationId", as: "orders" });
Order.belongsTo(StoreLocation, {
  foreignKey: "storeLocationId",
  as: "storeLocation",
});

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: "productId", as: "orderItems" });
OrderItem.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User <-> Cart
User.hasMany(Cart, { foreignKey: "userId", as: "cartItems" });
Cart.belongsTo(User, { foreignKey: "userId", as: "user" });

// Product <-> Cart
Product.hasMany(Cart, { foreignKey: "productId", as: "cartEntries" });
Cart.belongsTo(Product, { foreignKey: "productId", as: "product" });

// Product <-> StockAlert
Product.hasMany(StockAlert, { foreignKey: "productId", as: "stockAlerts" });
StockAlert.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User <-> PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: "userId", as: "passwordResetTokens" });
PasswordResetToken.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = {
  User,
  StoreLocation,
  Product,
  Rider,
  Order,
  OrderItem,
  Cart,
  StockAlert,
  EmailVerificationToken,
  PasswordResetToken,
};

