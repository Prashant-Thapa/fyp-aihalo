// Import all models with associations
const {
  User,
  StoreLocation,
  Product,
  Rider,
  Order,
  OrderItem,
  Cart,
  StockAlert,
} = require("../models/index");
const sequelize = require("../config/db");

const migrateDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    // DEV: Sync all models - use { alter: true } to update existing tables
    // Use { force: true } to drop and recreate (WARNING: deletes all data)
    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");
  } catch (err) {
    console.error("Unable to connect to the database:", err);
  }
};

migrateDatabase();

module.exports = migrateDatabase;
