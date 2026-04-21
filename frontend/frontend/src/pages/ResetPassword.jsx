import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordAPI } from "../api/auth.api";
import { ToastContainer, toast } from "react-toastify";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) { toast.error("Invalid reset link."); navigate("/forgot-password", { replace: true }); }
  }, [token, navigate]);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#0B4E3C"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters long"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    try {
      const response = await resetPasswordAPI(token, password);
      if (response.success) { setResetSuccess(true); toast.success("Password reset successful!"); }
      else { toast.error(response.message || "Failed to reset password"); }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to reset password.";
      toast.error(errorMsg);
      if (errorMsg.includes("expired") || errorMsg.includes("invalid")) {
        setTimeout(() => navigate("/forgot-password", { replace: true }), 2000);
      }
    } finally { setLoading(false); }
  };

  const EyeIcon = ({ show }) => show ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  );

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0B4E3C] via-[#0d6b52] to-[#0B4E3C]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-col justify-center items-center p-12 w-full">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 border border-white/20">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white text-center">All Done!</h1>
            <p className="text-white/70 text-lg text-center mt-4">Your password has been reset successfully</p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Password Reset Successful!</h1>
            <p className="text-gray-500 text-sm mt-2">Your password has been updated. You can now login with your new password.</p>
            <button onClick={() => navigate("/login", { replace: true })} className="mt-8 w-full h-12 rounded-xl bg-[#0B4E3C] text-white font-semibold hover:bg-[#093F31] transition-all shadow-lg shadow-[#0B4E3C]/25" id="go-to-login-btn">
              Go to Sign In →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick draggable pauseOnHover />

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#0B4E3C] via-[#0d6b52] to-[#0B4E3C]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">AI Halo</h2>
              <p className="text-white/70 text-xs">Delivery System</p>
            </div>
          </div>

          <div>
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">Set New<br />Password</h1>
            <p className="text-white/70 text-lg">Choose a strong password to keep your account secure. Make it at least 6 characters long.</p>
          </div>

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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-[#0B4E3C] rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-[#0B4E3C] text-xl font-bold">AI Halo</h2>
              <p className="text-gray-500 text-xs">Delivery System</p>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-gray-500 text-sm mt-2 mb-8">Enter your new password below. Make sure it's at least 6 characters long.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full h-12 pl-11 pr-12 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white" required minLength={6} id="new-password-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><EyeIcon show={showPassword} /></button>
              </div>
            </div>

            {password && (
              <div className="mb-4">
                <div className="flex gap-1 mb-1">{[1, 2, 3, 4, 5].map((level) => (<div key={level} className="h-1.5 flex-1 rounded-full transition-all duration-300" style={{ backgroundColor: strength >= level ? strengthColor : "#e5e7eb" }} />))}</div>
                <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={`w-full h-12 pl-11 pr-12 rounded-xl border outline-none transition bg-gray-50 focus:bg-white ${confirmPassword && password !== confirmPassword ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20"}`} required minLength={6} id="confirm-new-password-input" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><EyeIcon show={showConfirmPassword} /></button>
              </div>
              {confirmPassword && password !== confirmPassword && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
            </div>

            <button type="submit" disabled={loading || password.length < 6 || password !== confirmPassword} className="w-full h-12 rounded-xl bg-[#0B4E3C] text-white font-semibold hover:bg-[#093F31] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#0B4E3C]/25" id="reset-password-btn">
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Resetting...
                </span>
              ) : "Reset Password →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate("/login")} className="text-sm text-gray-500 hover:text-[#0B4E3C] font-medium hover:underline" id="back-to-login-from-reset">← Back to Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
