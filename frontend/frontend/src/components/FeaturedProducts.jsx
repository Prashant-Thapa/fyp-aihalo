import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, ArrowRight } from "lucide-react";
import { getAllProducts } from "../api/product.api";
import Container from "./Container";

const API_BASE_URL = "http://localhost:3000";

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getAllProducts();
      // Get first 4 products that are in stock
      const featured = (response.data || [])
        .filter((p) => p.stock > 0)
        .slice(0, 4);
      setProducts(featured);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B4E3C]"></div>
          </div>
        </Container>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section className="py-20 bg-gray-50">
      <Container>
        {/* Heading */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Featured Products
            </h2>
            <p className="text-gray-600 mt-2">
              Discover our most popular items, delivered to your doorstep
            </p>
          </div>
          <Link
            to="/products"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-[#0B4E3C] font-semibold hover:gap-3 transition-all"
          >
            View All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition group"
            >
              {/* Product Image */}
              <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={
                      product.imageUrl.startsWith("http")
                        ? product.imageUrl
                        : `${API_BASE_URL}${product.imageUrl}`
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <Package className="w-16 h-16 text-gray-300" />
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                <span className="text-xs font-medium text-[#0B4E3C] bg-[#0B4E3C]/10 px-2 py-1 rounded-full">
                  {product.category}
                </span>
                <h3 className="font-semibold text-gray-800 mt-3 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {product.description || "Fresh & quality guaranteed"}
                </p>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xl font-bold text-[#0B4E3C]">
                    Rs. {product.price}
                  </span>
                  <button className="p-2 bg-[#0B4E3C] text-white rounded-lg hover:bg-[#093F31] transition">
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedProducts;
