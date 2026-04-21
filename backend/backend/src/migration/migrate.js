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
  EmailVerificationToken,
  PasswordResetToken,
} = require("../models/index");
const sequelize = require("../config/db");

const migrateDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // DEV: Sync all models - use { alter: true } to update existing tables
    // Use { force: true } to drop and recreate (WARNING: deletes all data)
    await sequelize.sync({ alter: true });
    console.log("✅ All models were synchronized successfully.");
  } catch (err) {
    console.error("❌ Unable to connect to the database:", err.message);
    console.error(
      "Make sure MySQL is running and database credentials in .env are correct",
    );
    // Don't crash - let server start anyway
    process.exitCode = 0;
  }
};

// Run migration but don't wait for it
migrateDatabase().catch((err) => {
  console.error("Migration error:", err.message);
});

module.exports = migrateDatabase;

