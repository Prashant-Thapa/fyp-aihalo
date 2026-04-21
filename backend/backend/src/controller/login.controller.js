const { loginService } = require("../services/login.service");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginService(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
        canReRegister: result.canReRegister,
        rejectionReason: result.rejectionReason,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    console.error("❌ Login controller error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports = { loginUser };
