import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/auth.api";
import { ToastContainer, toast } from "react-toastify";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { toast.error("Please enter a valid email address"); return; }

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      if (response.success) { setEmailSent(true); toast.success("Password reset link sent!"); }
      else { toast.error(response.message || "Failed to send reset link"); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">Forgot Your<br />Password?</h1>
            <p className="text-white/70 text-lg">No worries! We'll send you a secure link to reset your password and get back to your account.</p>
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

          {!emailSent ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-gray-500 text-sm mt-2 mb-8">
                Enter your registered email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-[#0B4E3C] focus:ring-2 focus:ring-[#0B4E3C]/20 outline-none transition bg-gray-50 focus:bg-white" required id="forgot-email-input" />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email} className="w-full h-12 rounded-xl bg-[#0B4E3C] text-white font-semibold hover:bg-[#093F31] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#0B4E3C]/25" id="send-reset-link-btn">
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Sending...
                    </span>
                  ) : "Send Reset Link →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Check Your Email</h1>
              <p className="text-gray-500 text-sm text-center mt-2">We've sent a password reset link to</p>
              <p className="text-[#0B4E3C] font-semibold text-sm text-center mt-1">{email}</p>

              <div className="mt-6 bg-[#0B4E3C]/5 border border-[#0B4E3C]/20 rounded-xl p-4">
                <p className="text-sm text-gray-600 text-center">📧 Click the link in the email to reset your password. The link expires in <strong>15 minutes</strong>.</p>
              </div>

              <button onClick={() => { setEmailSent(false); setEmail(""); }} className="mt-6 w-full h-12 rounded-xl border-2 border-[#0B4E3C] text-[#0B4E3C] font-semibold hover:bg-[#0B4E3C]/5 transition" id="try-another-email-btn">
                Try another email
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            <button type="button" onClick={() => navigate("/login")} className="text-sm text-gray-500 hover:text-[#0B4E3C] font-medium hover:underline" id="back-to-login-from-forgot">← Back to Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
