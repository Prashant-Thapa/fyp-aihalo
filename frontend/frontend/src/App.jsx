import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import RiderRegister from "./pages/RiderRegister";
import Products from "./pages/Products";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import UserOrders from "./pages/UserOrders";
import OrderTracking from "./pages/OrderTracking";

import AboutUs from "./pages/AboutUs";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StoreLocationsPage from "./pages/admin/StoreLocationsPage";
import ProductsPage from "./pages/admin/ProductsPage";
import RidersPage from "./pages/admin/RidersPage";

// Rider Pages
import RiderLayout from "./pages/rider/RiderLayout";
import RiderDashboard from "./pages/rider/RiderDashboard";
import RiderOrders from "./pages/rider/RiderOrders";
import RiderMap from "./pages/rider/RiderMap";
import RiderLocationUpdate from "./pages/rider/RiderLocationUpdate";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/products" element={<Products />} />
            <Route path="/rider-register" element={<RiderRegister />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failed" element={<PaymentFailed />} />

            {/* User Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<UserOrders />} />
              <Route path="/orders/:id/track" element={<OrderTracking />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route
                  path="store-locations"
                  element={<StoreLocationsPage />}
                />
                <Route path="products" element={<ProductsPage />} />
                <Route path="riders" element={<RidersPage />} />
              </Route>
            </Route>

            {/* Rider Routes */}
            <Route element={<ProtectedRoute allowedRoles={["rider"]} />}>
              <Route path="/rider" element={<RiderLayout />}>
                <Route index element={<RiderDashboard />} />
                <Route path="orders" element={<RiderOrders />} />
                <Route path="map" element={<RiderMap />} />
                <Route
                  path="location-update"
                  element={<RiderLocationUpdate />}
                />
              </Route>
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl">404 - Page Not Found</h1>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
