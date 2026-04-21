require("dotenv").config();
const bcrypt = require("bcryptjs");
const { User } = require("../models/index");

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: "admin@aihalo.com" },
    });

    if (existingAdmin) {
      console.log("✓ Admin user already exists");
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const newAdmin = await User.create({
      name: "Admin User",
      email: "admin@aihalo.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("✓ Admin user created successfully!");
    console.log("  Email: admin@aihalo.com");
    console.log("  Password: admin123");
    console.log("  ID:", newAdmin.id);
  } catch (err) {
    console.error("✗ Error seeding admin:", err.message);
  }
};


setTimeout(seedAdmin, 5000);

module.exports = seedAdmin;
