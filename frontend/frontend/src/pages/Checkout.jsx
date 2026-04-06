import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/order.api";
import { initiateEsewaPayment } from "../api/payment.api";
import { getAllStoreLocations } from "../api/storeLocation.api";
import { checkLocationCoverage } from "../api/rider.api";
import {
  MapPin,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Store,
  AlertCircle,
  CreditCard,
  Banknote,
} from "lucide-react";
import Header from "../components/Header";

const Checkout = () => {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const esewaFormRef = useRef(null);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // eSewa redirect state
  const [esewaFormData, setEsewaFormData] = useState(null);
  const [esewaPaymentUrl, setEsewaPaymentUrl] = useState("");

  // Fetch available stores on component mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await getAllStoreLocations();
        if (response.success && response.data) {
          setStores(response.data);
          if (response.data.length > 0) {
            setSelectedStore(response.data[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Failed to fetch stores:", err);
        setError("Failed to load store locations");
      } finally {
        setLoadingStores(false);
      }
    };
    fetchStores();
  }, []);

  // Check coverage whenever location or store changes
  useEffect(() => {
    if (!selectedStore || !latitude || !longitude) {
      setCoverage(null);
      return;
    }

    const checkCoverage = async () => {
      try {
        setCheckingCoverage(true);
        const response = await checkLocationCoverage(
          parseInt(selectedStore),
          parseFloat(latitude),
          parseFloat(longitude),
        );
        if (response.success) {
          setCoverage(response.data);
          setError(""); // Clear previous errors
        }
      } catch (err) {
        console.error("Failed to check coverage:", err);
        setCoverage(null);
      } finally {
        setCheckingCoverage(false);
      }
    };

    const timer = setTimeout(checkCoverage, 500); // Debounce
    return () => clearTimeout(timer);
  }, [selectedStore, latitude, longitude]);

  // Auto-submit eSewa form when data is ready
  useEffect(() => {
    if (esewaFormData && esewaFormRef.current) {
      esewaFormRef.current.submit();
    }
  }, [esewaFormData]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        () => {
          setError(
            "Could not get your location. Please enter coordinates manually.",
          );
        },
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStore) {
      setError("Please select a store");
      return;
    }

    if (!deliveryAddress || !latitude || !longitude) {
      setError("Please fill in all fields");
      return;
    }

    // Check if location is within coverage
    if (coverage && !coverage.isInCoverage) {
      setError(
        `Location is outside delivery area (${coverage.distance.toFixed(1)}km away, radius: ${coverage.radius}km)`,
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create the order
      const response = await createOrder({
        storeLocationId: parseInt(selectedStore),
        deliveryAddress,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        paymentMethod,
      });

      if (response.success) {
        if (paymentMethod === "esewa") {
          // Initiate eSewa payment
          try {
            const paymentRes = await initiateEsewaPayment(response.data.id);
            if (paymentRes.success) {
              // Set form data to trigger auto-submission to eSewa
              setEsewaPaymentUrl(paymentRes.data.paymentUrl);
              setEsewaFormData(paymentRes.data.formData);
            } else {
              setError("Failed to initiate eSewa payment. Please try again.");
            }
          } catch (payErr) {
            setError(payErr.response?.data?.message || "eSewa payment initiation failed");
          }
        } else {
          // COD — show success directly
          setOrderSuccess(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Order Placed!
            </h1>
            <p className="text-gray-500 mb-2">
              Your order #{orderSuccess.id} has been confirmed.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {orderSuccess.rider
                ? "A rider has been assigned to your order."
                : "We'll assign a rider shortly."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/orders/${orderSuccess.id}/track`)}
                className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors"
              >
                Track Order
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                View All Orders
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Your cart is empty
            </h2>
            <button
              onClick={() => navigate("/products")}
              className="text-[#0B4E3C] hover:underline"
            >
              Browse Products
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/cart")}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Delivery Form */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-[#0B4E3C]" />
                Delivery Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Store
                  </label>
                  {loadingStores ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B4E3C]"></div>
                      Loading stores...
                    </div>
                  ) : stores.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-red-50 text-red-600">
                      No stores available
                    </div>
                  ) : (
                    <select
                      value={selectedStore}
                      onChange={(e) => setSelectedStore(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
                    >
                      <option value="">-- Select a store --</option>
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name} ({store.address})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none resize-none"
                    rows="3"
                    placeholder="Enter your full delivery address..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none"
                      placeholder="27.7172"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0B4E3C] focus:border-transparent outline-none"
                      placeholder="85.3240"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-full bg-blue-50 text-blue-600 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  📍 Use My Current Location
                </button>

                {/* Coverage Status */}
                {checkingCoverage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <span className="text-sm text-yellow-700">
                      Checking delivery coverage...
                    </span>
                  </div>
                )}

                {coverage && !checkingCoverage && (
                  <div
                    className={`rounded-xl p-4 flex items-start gap-3 border ${
                      coverage.isInCoverage
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {coverage.isInCoverage ? (
                      <>
                        <CheckCircle
                          size={20}
                          className="text-green-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="font-semibold text-green-800">
                            ✓ Inside Delivery Area
                          </p>
                          <p className="text-sm text-green-700">
                            {coverage.distance.toFixed(1)}km from store (radius:{" "}
                            {coverage.radius}km)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle
                          size={20}
                          className="text-red-600 shrink-0 mt-0.5"
                        />
                        <div>
                          <p className="font-semibold text-red-800">
                            ✗ Outside Delivery Area
                          </p>
                          <p className="text-sm text-red-700">
                            {coverage.distance.toFixed(1)}km away (radius:{" "}
                            {coverage.radius}km)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="border-t border-gray-100 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "cod"
                          ? "border-[#0B4E3C] bg-[#0B4E3C]/5 ring-1 ring-[#0B4E3C]/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          paymentMethod === "cod"
                            ? "bg-[#0B4E3C] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Banknote size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800">
                          Cash on Delivery
                        </p>
                        <p className="text-xs text-gray-500">Pay when delivered</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("esewa")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === "esewa"
                          ? "border-[#60BB46] bg-[#60BB46]/5 ring-1 ring-[#60BB46]/20"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          paymentMethod === "esewa"
                            ? "bg-[#60BB46] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <CreditCard size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-gray-800">
                          eSewa
                        </p>
                        <p className="text-xs text-gray-500">Pay online now</p>
                      </div>
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (coverage && !coverage.isInCoverage) ||
                    checkingCoverage
                  }
                  className={`w-full text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    paymentMethod === "esewa"
                      ? "bg-[#60BB46] hover:bg-[#52a83d]"
                      : "bg-[#0B4E3C] hover:bg-[#0a4534]"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {paymentMethod === "esewa" ? "Redirecting to eSewa..." : "Placing Order..."}
                    </>
                  ) : checkingCoverage ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      {paymentMethod === "esewa" ? (
                        <CreditCard size={20} />
                      ) : (
                        <ShoppingBag size={20} />
                      )}
                      {paymentMethod === "esewa"
                        ? `Pay with eSewa — रु ${total.toFixed(2)}`
                        : `Place Order — रु ${total.toFixed(2)}`}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      रु{" "}
                      {(
                        parseFloat(item.product?.price) * item.quantity
                      ).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#0B4E3C]">रु {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {paymentMethod === "esewa" ? (
                    <>
                      <CreditCard size={16} className="text-[#60BB46]" />
                      Paying via eSewa
                    </>
                  ) : (
                    <>
                      <Banknote size={16} className="text-[#0B4E3C]" />
                      Cash on Delivery
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden eSewa form for auto-submission */}
      {esewaFormData && (
        <form
          ref={esewaFormRef}
          action={esewaPaymentUrl}
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(esewaFormData).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </>
  );
};

export default Checkout;
