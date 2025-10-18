// src/components/pages/wishlist/Wishlist.jsx
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CiHeart, CiTrash } from "react-icons/ci";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ShoeCartLoader from "../../../common/ui/Loader";
import { AuthContext } from "../../../common/context/AuthProvider";
import { useWishlist } from "../../../common/context/WishlistContext";

function Wishlist() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const { wishlistItems, loading, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <p className="text-gray-700 mb-4">Please login to view your wishlist</p>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <ShoeCartLoader />;

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full p-6 bg-white rounded-lg shadow-sm">
          <CiHeart className="h-16 w-16 mx-auto text-gray-400" />
          <h2 className="text-xl font-medium text-gray-800 mt-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mt-2">Save items you love to your wishlist</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Wishlist</h1>
          <p className="text-gray-600 mt-2">
            {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="grid gap-6 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {wishlistItems.map((product) => (
            <div
              key={product.productId}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Product Image + Delete Button */}
              <div className="relative aspect-square">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.productId); // remove from wishlist
                    toast.success("Removed from wishlist");
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/80 rounded-full shadow hover:bg-red-100 hover:text-red-600 transition-colors backdrop-blur-sm"
                  aria-label="Remove from wishlist"
                >
                  <CiTrash className="h-5 w-5" />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4 flex flex-col justify-between h-full">
                <div>
                  <h3
                    className="text-lg font-medium text-gray-900 mb-1 cursor-pointer hover:text-indigo-600 line-clamp-2"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {product.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">{product.brand}</p>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  ${product.price.toFixed(2)}
                </p>
                <button
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="w-full mt-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;
