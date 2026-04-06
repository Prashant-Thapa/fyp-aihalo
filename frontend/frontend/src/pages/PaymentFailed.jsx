import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import Header from "../components/Header";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Failed
          </h1>
          <p className="text-gray-500 mb-6">
            Your eSewa payment was not completed. Don't worry — your order is
            saved and you can try again.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/orders")}
              className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate("/products")}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentFailed;
