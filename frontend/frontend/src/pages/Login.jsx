import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rejectionInfo, setRejectionInfo] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (state === "register") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          toast.error("Please enter a valid email address");
          setLoading(false);
          return;
        }
        if (!formData.name || formData.name.trim().length < 2) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }

        const response = await registerUser(
          formData.name,
          formData.email,
          formData.phone,
        );
        if (response.success) {
          toast.success("OTP sent to your email! Please check your inbox.");
          setTimeout(() => {
            navigate("/verify-email", {
              state: { email: response.data.email },
            });
          }, 500);
        } else {
          toast.error(response.message || "Registration failed");
        }
      } else {
        const response = await loginUser(formData.email, formData.password);
        if (response.success) {
          login(response.data.user, response.data.token);
          toast.success("Login successful!");
          if (response.data.user.role === "admin") {
            navigate("/admin");
          } else if (response.data.user.role === "rider") {
            navigate("/rider");
          } else {
            navigate("/");
          }
        } else {
          if (response.canReRegister && response.rejectionReason) {
            setRejectionInfo({
              reason: response.rejectionReason,
              message: response.message,
            });
          } else {
            toast.error(response?.message || "Login failed");
          }
        }
      }
    } catch (err) {
      if (
        err.response?.data?.canReRegister &&
        err.response?.data?.rejectionReason
      ) {
        setRejectionInfo({
          reason: err.response.data.rejectionReason,
          message: err.response.data.message,
        });
        setShowResetModal(true);
      } else {
        toast.error(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0B4E3C] via-[#0d6b52] to-[#0B4E3C]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            {/* LOGO PLACEHOLDER - Replace the src with your actual logo */}
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">AI Halo</h2>
              <p className="text-white/70 text-xs">Delivery System</p>
            </div>
          </div>

          {/* Main Content */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Welcome to<br />AI Halo Delivery
            </h1>
            <p className="text-white/70 text-lg mb-8">
              Your trusted delivery partner
            </p>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-white/90 text-sm">Fast & reliable delivery</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-white/90 text-sm">Secure & verified accounts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-white/90 text-sm">Real-time order tracking</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">1000+</p>
              <p className="text-white/60 text-xs mt-1">Daily Deliveries</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50+</p>
              <p className="text-white/60 text-xs mt-1">Active Riders</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">98%</p>
              <p className="text-white/60 text-xs mt-1">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-[#0B4E3C] rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-[#0B4E3C] text-xl font-bold">AI Halo</h2>
              <p className="text-gray-500 text-xs">Delivery System</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {state === "login" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-gray-500 text-sm mt-2 mb-8">
            {state === "login"
              ? "Enter your credentials to access your account"
              : "Fill in your details to get started with AI Halo"}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name (Signup only) */}
            {state !== "login" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Phone (Signup only) */}
            {state !== "login" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number (optional)"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Password (Login only) */}
            {state === "login" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {/* Forgot password */}
            {state === "login" && (
              <div className="flex justify-end mb-6">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#0B4E3C] font-medium hover:underline"
                  id="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${state !== "login" ? "mt-2" : ""} w-full h-12 rounded-xl bg-[#0B4E3C] text-white font-semibold hover:bg-[#093F31] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#0B4E3C]/25`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : state === "login" ? (
                <>Sign In →</>
              ) : (
                <>Sign Up →</>
              )}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-sm text-gray-500 text-center mt-6">
            {state === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setState((prev) => (prev === "login" ? "register" : "login"));
                setError("");
                setSuccess("");
              }}
              className="text-[#0B4E3C] font-semibold ml-1 hover:underline"
            >
              {state === "login" ? "Register" : "Sign In"}
            </button>
          </p>

          {/* Rider Registration Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Want to become a delivery rider?
              <button
                type="button"
                onClick={() => navigate("/rider-register")}
                className="text-[#0B4E3C] font-semibold ml-1 hover:underline"
              >
                Register as Rider
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showResetModal && rejectionInfo && (
        <div className="fixed inset-0 backdrop-blur-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              ❌ Registration Rejected
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-700"><strong>Reason for rejection:</strong></p>
              <p className="text-sm text-red-700 mt-2">{rejectionInfo.reason}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700"><strong>📋 What to do:</strong></p>
              <p className="text-sm text-blue-700 mt-2">
                Update your documents with the improvements mentioned above. You can re-submit your application immediately.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  navigate("/update-rider-profile", {
                    state: {
                      email: formData.email,
                      rejectionReason: rejectionInfo.reason,
                    },
                  });
                }}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Update My Profile
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setRejectionInfo(null);
                }}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                OK, I Understand
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-6 text-center">
              Need help? Contact admin support with details about your rejection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
