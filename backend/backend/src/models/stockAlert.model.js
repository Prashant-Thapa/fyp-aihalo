const sequelize = require("../config/db");
const { DataTypes } = require("sequelize");

const StockAlert = sequelize.define("StockAlert", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  currentStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  threshold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = StockAlert;
