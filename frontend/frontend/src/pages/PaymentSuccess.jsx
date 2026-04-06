import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyEsewaPayment } from "../api/payment.api";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const data = searchParams.get("data");
        if (!data) {
          setError("No payment data received");
          setVerifying(false);
          return;
        }

        const res = await verifyEsewaPayment(data);
        if (res.success) {
          setVerified(true);
          setOrderId(res.data?.orderId);
        } else {
          setError(res.message || "Payment verification failed");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Payment verification failed");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [searchParams]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          {verifying ? (
            <>
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={40} className="text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Payment...
              </h1>
              <p className="text-gray-500">
                Please wait while we confirm your payment with eSewa.
              </p>
            </>
          ) : verified ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful! 🎉
              </h1>
              <p className="text-gray-500 mb-2">
                Your payment has been verified successfully.
              </p>
              {orderId && (
                <p className="text-sm text-gray-400 mb-6">
                  Order #{orderId} has been confirmed.
                </p>
              )}
              <div className="space-y-3">
                {orderId && (
                  <button
                    onClick={() => navigate(`/orders/${orderId}/track`)}
                    className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors"
                  >
                    Track Order
                  </button>
                )}
                <button
                  onClick={() => navigate("/orders")}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  View All Orders
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h1>
              <p className="text-red-500 mb-6">{error}</p>
              <button
                onClick={() => navigate("/orders")}
                className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors"
              >
                View Orders
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;
