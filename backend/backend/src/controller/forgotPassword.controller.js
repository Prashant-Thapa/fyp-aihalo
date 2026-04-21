const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/user.model");
const PasswordResetToken = require("../models/passwordResetToken.model");
const { sendPasswordResetLink } = require("../services/email.service");

/**
 * Request password reset - sends reset link via email
 */
const forgotPassword = async (req, res) => {
  try {
    const { v4: uuidv4 } = await import("uuid");
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the user
    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Check if user is email verified
    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first before resetting password.",
      });
    }

    // Invalidate any existing unused reset tokens for this user
    await PasswordResetToken.update(
      { used: true },
      {
        where: {
          userId: user.id,
          used: false,
        },
      },
    );

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store the token
    await PasswordResetToken.create({
      userId: user.id,
      token: resetToken,
      expiresAt,
      used: false,
    });

    // Send reset email
    await sendPasswordResetLink(normalizedEmail, resetToken, user.name);

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Reset password using token from email link
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find the reset token
    const resetRecord = await PasswordResetToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link has expired or is invalid. Please request a new one.",
      });
    }

    // Find the user
    const user = await User.findByPk(resetRecord.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    resetRecord.used = true;
    await resetRecord.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (err) {
    console.error("❌ Reset password error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { forgotPassword, resetPassword };
