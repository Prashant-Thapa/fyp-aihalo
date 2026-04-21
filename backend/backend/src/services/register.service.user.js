const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const registerUserService = async (email, password, name, role = "user") => {
  try {
    const isUserExist = await User.findOne({ where: { email } });
    if (isUserExist) {
      return {
        success: false,
        message: "User already exist",
      };
    }

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role,
      name,
    });

    return {
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    };
  } catch (err) {
    throw err;
  }
};

module.exports = { registerUserService };
