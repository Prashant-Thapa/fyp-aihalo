const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { JWT_SECRET } = require("../middleware/auth.middleware");

const loginService = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log(`Login failed: User not found with email: ${email}`);
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    console.log(`Login attempt for user: ${email}, role: ${user.role}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`Login failed: Invalid password for user: ${email}`);
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`Login successful for user: ${email} (${user.role})`);

    return {
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    };
  } catch (err) {
    console.error("Login service error:", err);
    throw err;
  }
};

module.exports = { loginService };
