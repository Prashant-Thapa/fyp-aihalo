import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Package,
  ShoppingCart,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { getAllProducts } from "../api/product.api";
import { getAllStoreLocations } from "../api/storeLocation.api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";

// const API_BASE_URL =
const API_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

// Helper to build image URL with cache-busting
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const base = imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`;
  return `${base}?t=${Date.now()}`;
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [storeLocations, setStoreLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      setAddingToCart(productId);
      await addToCart(productId, 1);
      setAddedToCart(productId);
      setTimeout(() => setAddedToCart(null), 2000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("name");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "All Categories",
    "Groceries",
    "Electronics",
    "Fashion",
    "Food & Beverages",
    "Health & Beauty",
    "Home & Kitchen",
    "Sports",
    "Books",
    "Others",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedStore,
    priceRange,
    sortBy,
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, storesRes] = await Promise.all([
        getAllProducts(),
        getAllStoreLocations(),
      ]);
      setProducts(productsRes.data || []);
      setStoreLocations(storesRes.data || []);
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("This is products", products);
  }, [products]);

  const applyFilters = () => {
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.description?.toLowerCase().includes(search) ||
          product.category.toLowerCase().includes(search),
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== "All Categories") {
      result = result.filter(
        (product) => product.category === selectedCategory,
      );
    }

    // Store filter
    if (selectedStore) {
      result = result.filter(
        (product) => product.storeLocationId === parseInt(selectedStore),
      );
    }

    // Price range filter
    if (priceRange.min !== "") {
      result = result.filter(
        (product) => parseFloat(product.price) >= parseFloat(priceRange.min),
      );
    }
    if (priceRange.max !== "") {
      result = result.filter(
        (product) => parseFloat(product.price) <= parseFloat(priceRange.max),
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredProducts(result);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedStore("");
    setPriceRange({ min: "", max: "" });
    setSortBy("name");
  };

  const hasActiveFilters =
    searchTerm ||
    (selectedCategory && selectedCategory !== "All Categories") ||
    selectedStore ||
    priceRange.min ||
    priceRange.max;

  return (
    <div className="">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0B4E3C] to-[#0d6b52] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Browse Products
          </h1>
          <p className="text-white/80 text-lg">
            Find everything you need with fast delivery
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 focus:ring-4 focus:ring-white/30 outline-none text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center gap-2 mb-4 px-4 py-2 bg-white rounded-lg shadow-sm"
        >
          <Filter className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-[#0B4E3C] text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <div
            className={`${
              showFilters ? "block" : "hidden"
            } md:block w-full md:w-64 flex-shrink-0`}
          >
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#0B4E3C] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Category
                </h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={
                          selectedCategory === category ||
                          (category === "All Categories" && !selectedCategory)
                        }
                        onChange={() =>
                          setSelectedCategory(
                            category === "All Categories" ? "" : category,
                          )
                        }
                        className="w-4 h-4 text-[#0B4E3C] focus:ring-[#0B4E3C]"
                      />
                      <span className="text-sm text-gray-600">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Store Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Store
                </h4>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                >
                  <option value="">All Stores</option>
                  {storeLocations.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Price Range (Rs.)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, min: e.target.value })
                    }
                    className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange({ ...priceRange, max: e.target.value })
                    }
                    className="w-1/2 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none"
                  />
                </div>
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => setShowFilters(false)}
                className="md:hidden w-full py-2 bg-[#0B4E3C] text-white rounded-lg mt-4"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {filteredProducts.length}
                  </span>{" "}
                  {filteredProducts.length === 1 ? "product" : "products"}
                </p>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0B4E3C] focus:border-[#0B4E3C] outline-none bg-white"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B4E3C]/10 text-[#0B4E3C] rounded-full text-sm">
                    Search: {searchTerm}
                    <button onClick={() => setSearchTerm("")}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedCategory && selectedCategory !== "All Categories" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B4E3C]/10 text-[#0B4E3C] rounded-full text-sm">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory("")}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedStore && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B4E3C]/10 text-[#0B4E3C] rounded-full text-sm">
                    Store:{" "}
                    {
                      storeLocations.find(
                        (s) => s.id === parseInt(selectedStore),
                      )?.name
                    }
                    <button onClick={() => setSelectedStore("")}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {(priceRange.min || priceRange.max) && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0B4E3C]/10 text-[#0B4E3C] rounded-full text-sm">
                    Price: Rs.{priceRange.min || "0"} - Rs.
                    {priceRange.max || "∞"}
                    <button onClick={() => setPriceRange({ min: "", max: "" })}>
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Check back later for new products"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-[#0B4E3C] text-white rounded-lg hover:bg-[#093F31] transition"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group"
                  >
                    {/* Product Image */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                        />
                      ) : (
                        <Package className="w-16 h-16 text-gray-300" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <span className="text-xs font-medium text-[#0B4E3C] bg-[#0B4E3C]/10 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                      <h3 className="font-semibold text-gray-800 mt-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {product.description || "No description available"}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <span className="text-xl font-bold text-[#0B4E3C]">
                            Rs. {product.price}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.stock > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.stock > 0
                            ? `In Stock (${product.stock})`
                            : "Out of Stock"}
                        </span>
                      </div>

                      {/* Store Name */}
                      <p className="text-xs text-gray-400 mt-2">
                        From: {product.storeLocation?.name || "Unknown Store"}
                      </p>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition ${
                          addedToCart === product.id
                            ? "bg-green-500 text-white"
                            : product.stock > 0
                              ? "bg-[#0B4E3C] text-white hover:bg-[#093F31]"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={
                          product.stock === 0 || addingToCart === product.id
                        }
                      >
                        {addingToCart === product.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : addedToCart === product.id ? (
                          <>
                            <Check className="w-4 h-4" /> Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Products;
