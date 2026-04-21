const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const Rider = sequelize.define("Rider", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleType: {
    type: DataTypes.ENUM("bike", "scooter", "car", "bicycle"),
    allowNull: false,
    defaultValue: "bike",
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  licenseNumber: {
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
    allowNull: false,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "approved", "rejected"),
    allowNull: false,
    defaultValue: "pending",
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
    profilePhoto:{
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseFrontPhoto:{
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseBackPhoto:{
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Rider;
