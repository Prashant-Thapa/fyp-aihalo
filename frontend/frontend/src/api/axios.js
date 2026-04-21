import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("THis is api base url", API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if we have a token (meaning we were authenticated)
    // Don't redirect for 401 on auth-related endpoints since it's expected
    const authPaths = ["/login", "/register", "/verify-otp", "/create-password", "/forgot-password", "/reset-password", "/resend-otp"];
    const isAuthRequest = authPaths.some(path => error.config?.url?.includes(path));
    
    if (error.response?.status === 401 && !isAuthRequest) {
      // Token expired or invalid (and not a login request)
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
