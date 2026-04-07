import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import Header from "../components/Header";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const CartPage = () => {
  const { items, total, count, loading, updateItem, removeItem } = useCart();
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  const handleQuantityChange = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdating(id);
      await updateItem(id, newQuantity);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (id) => {
    try {
      setUpdating(id);
      await removeItem(id);
    } catch {
      alert("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4E3C]"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/products")}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-gray-500">
                {count} {count === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Add some products to get started!
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-[#0B4E3C] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0a4534] transition-colors"
              >
                <ShoppingBag size={20} />
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center transition-all hover:shadow-md"
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {item.product?.imageUrl ? (
                        <img
                          src={`${API_BASE}${item.product.imageUrl}`}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.product?.category}
                      </p>
                      <p className="text-[#0B4E3C] font-bold mt-1">
                        रु {parseFloat(item.product?.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={updating === item.id || item.quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={updating === item.id}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-20">
                      <p className="font-bold text-gray-900">
                        रु{" "}
                        {(
                          parseFloat(item.product?.price) * item.quantity
                        ).toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updating === item.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Order Summary
                  </h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({count} items)</span>
                      <span>रु {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span className="text-[#0B4E3C]">
                          रु {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full bg-[#0B4E3C] text-white py-3 rounded-xl font-semibold hover:bg-[#0a4534] transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={20} />
                    Proceed to Checkout
                  </button>
                  <Link
                    to="/products"
                    className="block text-center text-[#0B4E3C] mt-3 text-sm hover:underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartPage;
