const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Rider = require("../models/rider.model");
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log(`Login failed: Email not verified for user: ${email}`);
      return {
        success: false,
        message: "Please verify your email before logging in. Check your inbox for the verification email.",
      };
    }

    // Check if user is a rider
    if (user.role === "rider") {
      const rider = await Rider.findOne({ where: { userId: user.id } });

      if (!rider) {
        return {
          success: false,
          message: "Rider profile not found",
          rejectionReason: "Rider profile missing",
          canReRegister: true,
        };
      }

      console.log(`Rider status for user ${email}: ${rider.status}`);

      // Check if rider is rejected
      if (rider.status === "rejected") {
        return {
          success: false,
          message: `Your registration has been rejected. Reason: ${rider.rejectionReason || "No reason provided"}. Please contact support to re-register.`,
          rejectionReason: rider.rejectionReason,
          canReRegister: true,
        };
      }

      // Check if rider is pending approval
      if (rider.status === "pending") {
        return {
          success: false,
          message:
            "Your registration is pending approval. Please wait for admin verification.",
          rejectionReason: null,
          canReRegister: false,
        };
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
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
