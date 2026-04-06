import api from "./axios";

// Register a new user
export const registerUser = async (name, email, password) => {
  const response = await api.post("/user/register", {
    name,
    email,
    password,
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
