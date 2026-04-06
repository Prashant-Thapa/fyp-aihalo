const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const StoreLocation = sequelize.define("StoreLocation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
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
  radius: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10, // 10 km default radius
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = StoreLocation;
