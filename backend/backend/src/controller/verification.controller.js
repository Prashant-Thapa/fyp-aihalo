const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/user.model");
const EmailVerificationToken = require("../models/emailVerificationToken.model");
const { sendVerificationOTP } = require("../services/email.service");
const { JWT_SECRET } = require("../middleware/auth.middleware");

/**
 * Verify OTP code sent to email
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find the most recent non-expired token for this email
    const tokenRecord = await EmailVerificationToken.findOne({
      where: {
        email: email.toLowerCase().trim(),
        verified: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [["createdAt", "DESC"]],
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired or is invalid. Please request a new one.",
      });
    }

    // Compare OTP
    const isOTPValid = await bcrypt.compare(
      otp.toString(),
      tokenRecord.otpCode,
    );
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code. Please try again.",
      });
    }

    // Mark as verified
    tokenRecord.verified = true;
    await tokenRecord.save();

    // Generate a temporary setup token (valid 30 min) for password creation
    const setupToken = jwt.sign(
      {
        tokenId: tokenRecord.id,
        email: tokenRecord.email,
        purpose: "password-setup",
      },
      JWT_SECRET,
      { expiresIn: "30m" },
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. Please create your password.",
      data: {
        setupToken,
        email: tokenRecord.email,
        name: tokenRecord.name,
      },
    });
  } catch (err) {
    console.error("❌ Verify OTP error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create password after email verification
 */
const createPassword = async (req, res) => {
  try {
    const { setupToken, password } = req.body;

    if (!setupToken || !password) {
      return res.status(400).json({
        success: false,
        message: "Setup token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Verify the setup token
    let decoded;
    try {
      decoded = jwt.verify(setupToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Setup token has expired. Please register again.",
      });
    }

    if (decoded.purpose !== "password-setup") {
      return res.status(400).json({
        success: false,
        message: "Invalid setup token",
      });
    }

    // Find the verified token record
    const tokenRecord = await EmailVerificationToken.findByPk(decoded.tokenId);

    if (!tokenRecord || !tokenRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified. Please verify your email first.",
      });
    }

    // Check if user already exists (double safety)
    const existingUser = await User.findOne({
      where: { email: tokenRecord.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login.",
      });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: tokenRecord.name,
      email: tokenRecord.email,
      password: hashedPassword,
      phone: tokenRecord.phone,
      role: tokenRecord.role,
      isEmailVerified: true,
    });

    // Clean up used verification tokens for this email
    await EmailVerificationToken.destroy({
      where: { email: tokenRecord.email },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully! You can now login.",
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("❌ Create password error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Resend OTP to email
 */
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists in Users table
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Account already exists. Please login.",
      });
    }

    // Find the most recent pending token for this email
    const tokenRecord = await EmailVerificationToken.findOne({
      where: {
        email: normalizedEmail,
        verified: false,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found. Please register again.",
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otpCode, salt);

    // Update token record
    tokenRecord.otpCode = hashedOTP;
    tokenRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await tokenRecord.save();

    // Send email (non-blocking, fire and forget)
    sendVerificationOTP(normalizedEmail, otpCode, tokenRecord.name)
      .then(() => {
        console.log(`✅ OTP resent successfully to ${normalizedEmail}`);
      })
      .catch((emailErr) => {
        console.error(
          `⚠️  Failed to resend verification email to ${normalizedEmail}:`,
          emailErr.message,
        );
      });

    // Return response with OTP (for development/testing if email fails)
    const isDevMode = process.env.NODE_ENV === "development";
    const response = {
      success: true,
      message: `New OTP sent to ${normalizedEmail}.`,
    };

    // Include OTP in response for development mode (for testing without real email)
    if (isDevMode) {
      response.otpCode = otpCode;
      response.message +=
        " [DEV MODE: OTP displayed for testing - normally only sent via email]";
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Resend OTP error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { verifyOTP, createPassword, resendOTP };
