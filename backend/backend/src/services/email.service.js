const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter connection on startup
transporter.verify().then(() => {
  console.log("✅ SMTP email transporter is ready");
}).catch((err) => {
  console.error("❌ SMTP connection error:", err.message);
  console.error("   Make sure SMTP_USER and SMTP_PASS are set correctly in .env");
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

/**
 * Send OTP verification email for registration
 */
const sendVerificationOTP = async (email, otpCode, name) => {
  const mailOptions = {
    from: `"AI Halo" <${FROM_EMAIL}>`,
    to: email,
    subject: "AI Halo - Verify Your Email Address",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0;">
        <div style="background: linear-gradient(135deg, #0B4E3C 0%, #14785C 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: white; font-size: 24px; font-weight: bold;">AI</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Thank you for registering with AI Halo. Use the verification code below to verify your email address:</p>
          <div style="background: #f0fdf4; border: 2px dashed #0B4E3C; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
            <p style="margin: 0; font-size: 36px; font-weight: 700; color: #0B4E3C; letter-spacing: 8px;">${otpCode}</p>
          </div>
          <p style="color: #ef4444; font-size: 13px; margin: 0 0 24px; text-align: center;">⏰ This code expires in <strong>15 minutes</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset link email
 */
const sendPasswordResetLink = async (email, token, name) => {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"AI Halo" <${FROM_EMAIL}>`,
    to: email,
    subject: "AI Halo - Reset Your Password",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0;">
        <div style="background: linear-gradient(135deg, #0B4E3C 0%, #14785C 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="color: white; font-size: 24px; font-weight: bold;">AI</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hello <strong>${name}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 0 0 24px;">
            <a href="${resetLink}" style="display: inline-block; background: #0B4E3C; color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px; text-align: center;">Or copy and paste this link:</p>
          <p style="color: #0B4E3C; font-size: 12px; margin: 0 0 24px; text-align: center; word-break: break-all;">${resetLink}</p>
          <p style="color: #ef4444; font-size: 13px; margin: 0 0 24px; text-align: center;">⏰ This link expires in <strong>15 minutes</strong></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationOTP,
  sendPasswordResetLink,
};
