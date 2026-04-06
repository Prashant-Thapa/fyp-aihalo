const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  riderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      "pending",
      "confirmed",
      "rider_assigned",
      "accepted",
      "picked_up",
      "on_the_way",
      "delivered",
      "completed",
      "cancelled",
    ),
    allowNull: false,
    defaultValue: "pending",
  },
  rejectedRiders: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null,
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  deliveryAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  storeLocationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.ENUM("cod", "esewa"),
    allowNull: false,
    defaultValue: "cod",
  },
  paymentStatus: {
    type: DataTypes.ENUM("pending", "paid", "failed"),
    allowNull: false,
    defaultValue: "pending",
  },
  esewaTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deliveryOtp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Order;
