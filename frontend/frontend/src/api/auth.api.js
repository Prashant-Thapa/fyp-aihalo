import api from "./axios";

// Register a new user (step 1 - sends OTP, no password yet)
export const registerUser = async (name, email, phone) => {
  const response = await api.post("/user/register", {
    name,
    email,
    phone,
  });
  return response.data;
};

// Verify OTP (step 2)
export const verifyOTP = async (email, otp) => {
  const response = await api.post("/user/verify-otp", {
    email,
    otp,
  });
  return response.data;
};

// Create password after OTP verification (step 3)
export const createPassword = async (setupToken, password) => {
  const response = await api.post("/user/create-password", {
    setupToken,
    password,
  });
  return response.data;
};

// Resend OTP
export const resendOTP = async (email) => {
  const response = await api.post("/user/resend-otp", {
    email,
  });
  return response.data;
};

// Login user
export const loginUser = async (email, password) => {
  const response = await api.post("/user/login", {
    email,
    password,
  });
  return response.data;
};

// Forgot password - sends reset link
export const forgotPassword = async (email) => {
  const response = await api.post("/user/forgot-password", {
    email,
  });
  return response.data;
};

// Reset password using token from email
export const resetPasswordAPI = async (token, password) => {
  const response = await api.post("/user/reset-password", {
    token,
    password,
  });
  return response.data;
};

// Get current user from token
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

// Logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Check if user is admin
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === "admin";
};

// Check if user is rider
export const isRider = () => {
  const user = getCurrentUser();
  return user?.role === "rider";
};
