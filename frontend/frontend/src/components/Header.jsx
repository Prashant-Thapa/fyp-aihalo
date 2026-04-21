// Header.jsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Package } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count } = useCart();

  const navbars = [
    { name: "Home", link: "/" },
    { name: "Products", link: "/products" },
    { name: "About", link: "/about" },
  ];

  const handleLoginRoute = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="text-emerald-600 text-2xl font-bold">
              AI Halo
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navbars.map((item) => (
                <Link
                  key={item.name}
                  to={item.link}
                  className="text-gray-700 font-medium hover:text-emerald-600 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === "user" && (
                  <Link
                    to="/orders"
                    className="text-gray-700 hover:text-emerald-600 transition flex items-center gap-1"
                  >
                    <Package size={18} />
                    <span className="hidden sm:inline">Orders</span>
                  </Link>
                )}

                {user.role === "user" && (
                  <Link
                    to="/cart"
                    className="relative text-gray-700 hover:text-emerald-600 transition p-2"
                  >
                    <ShoppingCart size={22} />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </Link>
                )}

                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-emerald-600 transition"
                  >
                    Dashboard
                  </Link>
                )}

                {user.role === "rider" && (
                  <Link
                    to="/rider"
                    className="text-gray-700 hover:text-emerald-600 transition"
                  >
                    Rider Dashboard
                  </Link>
                )}

                <span className="text-gray-500 text-sm hidden sm:block">
                  Hi, {user.name}
                </span>

                <button
                  className="px-4 py-1.5 border cursor-pointer border-emerald-200 text-emerald-600 rounded-md hover:bg-emerald-50 transition text-sm"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-4 py-1.5 border border-emerald-200 text-emerald-600 rounded-md hover:bg-emerald-50 transition text-sm"
                  onClick={handleLoginRoute}
                >
                  Login
                </button>

                <Link
                  to="/rider-register"
                  className="hidden sm:block px-4 py-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition font-medium text-sm"
                >
                  Become a Rider
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
