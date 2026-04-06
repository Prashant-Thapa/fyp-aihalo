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

    const { success, message, data } = await loginService(email, password);

    if (!success) {
      return res.status(401).json({
        success: false,
        message,
      });
    }

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      debug: err.message,
    });
  }
};

module.exports = { loginUser };
