import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (state === "register") {
        const response = await registerUser(
          formData.name,
          formData.email,
          formData.password
        );
        if (response.success) {
          setSuccess("Registration successful! Please login.");
          setState("login");
          setFormData({ ...formData, name: "" });
        }
      } else {
        const response = await loginUser(formData.email, formData.password);
        if (response.success) {
          login(response.data.user, response.data.token);
          setSuccess("Login successful!");
          // Redirect based on role
          if (response.data.user.role === "admin") {
            navigate("/admin");
          } else if (response.data.user.role === "rider") {
            navigate("/rider");
          } else {
            navigate("/");
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
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
    <div className="min-h-screen bg-gradient-to-br from-[#0B4E3C]/10 to-white flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl px-8 py-10 shadow-lg"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#0B4E3C] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-semibold text-[#0B4E3C] text-center">
          {state === "login" ? "Welcome Back" : "Create Account"}
        </h1>

        <p className="text-gray-500 text-sm text-center mt-2">
          {state === "login"
            ? "Login to continue to AI Halo"
            : "Sign up to get started with AI Halo"}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        {/* Name (Signup only) */}
        {state !== "login" && (
          <div className="mt-6">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-11 px-4 rounded-md border border-gray-300 focus:border-[#0B4E3C] focus:ring-1 focus:ring-[#0B4E3C] outline-none"
              required
            />
          </div>
        )}

        {/* Email */}
        <div className="mt-4">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-md border border-gray-300 focus:border-[#0B4E3C] focus:ring-1 focus:ring-[#0B4E3C] outline-none"
            required
          />
        </div>

        {/* Password */}
        <div className="mt-4">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-11 px-4 rounded-md border border-gray-300 focus:border-[#0B4E3C] focus:ring-1 focus:ring-[#0B4E3C] outline-none"
            required
            minLength={6}
          />
        </div>

        {/* Forgot password */}
        {state === "login" && (
          <div className="mt-3 text-right">
            <button
              type="button"
              className="text-sm text-[#0B4E3C] hover:underline"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full h-11 rounded-md bg-[#0B4E3C] text-white font-medium hover:bg-[#093F31] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : state === "login" ? (
            "Login"
          ) : (
            "Sign up"
          )}
        </button>

        {/* Toggle */}
        <p className="text-sm text-gray-500 text-center mt-5">
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
            className="text-[#0B4E3C] font-medium ml-1 hover:underline"
          >
            {state === "login" ? "Sign up" : "Login"}
          </button>
        </p>

        {/* Rider Registration Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Want to become a delivery rider?
            <button
              type="button"
              onClick={() => navigate("/rider-register")}
              className="text-[#0B4E3C] font-medium ml-1 hover:underline"
            >
              Register as Rider
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
