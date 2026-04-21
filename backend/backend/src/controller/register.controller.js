const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const EmailVerificationToken = require("../models/emailVerificationToken.model");
const { sendVerificationOTP } = require("../services/email.service");
const { validateInput } = require("../services/validate");

const registerUser = async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    // Validate required fields (no password at this stage)
    const isValidate = validateInput(email, name);
    if (!isValidate) {
      return res.status(400).json({
        success: false,
        message: "Please input all the required fields (name and email)",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Force role to "user" (customer) for public registration only
    // Riders must register from the rider registration endpoint
    // Admins are created by other admins only
    const userRole = "user";

    // Check if user already exists in Users table
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists. Please login.",
      });
    }

    // Delete any old unverified tokens for this email (cleanup)
    await EmailVerificationToken.destroy({
      where: { email: normalizedEmail, verified: false },
    });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otpCode, salt);

    // Store pending registration with OTP
    await EmailVerificationToken.create({
      name,
      email: normalizedEmail,
      phone: phone || null,
      role: userRole,
      otpCode: hashedOTP,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      verified: false,
    });

    // Send OTP via SMTP email (non-blocking, fire and forget)
    let emailSent = false;
    sendVerificationOTP(normalizedEmail, otpCode, name)
      .then(() => {
        emailSent = true;
        console.log(`✅ OTP sent successfully to ${normalizedEmail}`);
      })
      .catch((emailErr) => {
        console.error(
          `⚠️  Failed to send verification email to ${normalizedEmail}:`,
          emailErr.message,
        );
      });

    // Return response with OTP (for development/testing if email fails)
    const isDevMode = process.env.NODE_ENV === "development";
    const response = {
      success: true,
      message: `Verification OTP has been sent to ${normalizedEmail}. Please check your inbox.`,
      data: {
        email: normalizedEmail,
        name: name,
      },
    };

    // Include OTP in response for development mode (for testing without real email)
    if (isDevMode) {
      response.data.otpCode = otpCode;
      response.message +=
        " [DEV MODE: OTP displayed for testing - normally only sent via email]";
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("❌ Registration error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

module.exports = { registerUser };
