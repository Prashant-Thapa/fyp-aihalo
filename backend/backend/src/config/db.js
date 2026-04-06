const { Sequelize } = require("sequelize");
const db_name = process.env.DB_NAME;
const db_user = process.env.DB_USERNAME;
const password = process.env.DB_PASS;

console.log("db", db_name);
console.log(db_user);
console.log(password)
const sequelize = new Sequelize(db_name, db_user, password, {
  host: "localhost",
  dialect: "mysql",
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connected");
  } catch (err) {
    console.error(err);
  }
}
testConnection();

module.exports = sequelize;
