const { registerUserService } = require("../services/register.service.user");
const { validateInput } = require("../services/validate");

const registerUser = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const isValidate = validateInput(email, password, name);
    if (!isValidate) {
      return res.status(400).json({
        success: false,
        message: "Please input all the required fields",
      });
    }

    // Only allow "user" role for public registration
    const userRole = role === "admin" ? "admin" : "user";

    const { success, message, data } = await registerUserService(
      email,
      password,
      name,
      userRole,
    );

    if (!success) {
      return res.status(400).json({
        success: false,
        message,
      });
    }
    return res.status(201).json({
      success,
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

module.exports = { registerUser };
