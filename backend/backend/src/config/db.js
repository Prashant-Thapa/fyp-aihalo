const { Sequelize } = require("sequelize");
const db_name = process.env.DB_NAME || "aihalo";
const db_user = process.env.DB_USERNAME || "root";
const password = process.env.DB_PASS || "";

console.log(`🔗 Attempting to connect to database: ${db_name}`);
console.log(`   User: ${db_user}`);
console.log(`   Host: localhost`);

let sequelize;
try {
  sequelize = new Sequelize(db_name, db_user, password, {
    host: "localhost",
    dialect: "mysql",
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
      evict: 30000,
    },
  });
} catch (err) {
  console.error("❌ Error creating Sequelize instance:", err.message);
  // Still export it so the app can continue to start
  sequelize = new Sequelize("sqlite::memory:");
}

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected");
  } catch (err) {
    console.error("❌ Connection test failed:", err.message);
  }
}

// Uncomment to test connection on startup
// testConnection();

module.exports = sequelize;
