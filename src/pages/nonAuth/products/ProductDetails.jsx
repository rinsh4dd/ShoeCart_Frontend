import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CiHeart, CiShoppingCart } from "react-icons/ci";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../../common/context/AuthProvider";
import { useCart } from "../../../common/context/CartContext";
import { URL } from "../../../service/api";
import ShoeCartLoader from "../../../common/ui/Loader";
import { GetProductById } from "../../../service/product";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { user } = useContext(AuthContext);
  const { addToCart, isItemInCart, loading } = useCart();
  const [isSameSizeInCart, setIsSameSizeInCart] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    async function fetchProduct() {
      try {
        const data = await GetProductById(id);
        if (!data) throw new Error("Product not found");
        setProduct(data);
        checkWishlistStatus(data.id);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(err.message);
        toast.error("Failed to load product details");
      }
    }

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product && size) {
      setIsSameSizeInCart(isItemInCart(product.id, size));
    }
  }, [product, size, isItemInCart]);

  const checkWishlistStatus = async (productId) => {
    if (!user) return;

    try {
      const response = await fetch(`${URL}/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const userData = await response.json();
      const inWishlist = userData.wishlist?.some(
        (item) => item.id === productId
      );
      setIsInWishlist(inWishlist);
    } catch (err) {
      console.error("Error checking wishlist:", err);
    }
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handleAddToCart = async () => {
    if (!size) {
      toast.warning("Please select a size before adding to cart");
      return;
    }

    if (!product) return;

    const success = await addToCart(product.id, size, quantity);
    if (success) {
      setIsSameSizeInCart(true);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.warning("Please log in to add items to your wishlist!");
      return;
    }

    try {
      const userRes = await fetch(`${URL}/users/${user.id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!userRes.ok) throw new Error("User not found");
      const userData = await userRes.json();
      const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.imageUrl,
        brand: product.brand,
      };
      const alreadyInWishlist = userData.wishlist?.some(
        (item) => item.id === product.id
      );
      let updatedWishlist;
      if (alreadyInWishlist) {
        updatedWishlist = userData.wishlist.filter(
          (item) => item.id !== product.id
        );
        setIsInWishlist(false);
        toast.success("Removed from wishlist!");
      } else {
        updatedWishlist = [...(userData.wishlist || []), wishlistItem];
        setIsInWishlist(true);
        toast.success("Added to wishlist!");
      }
      const patchRes = await fetch(`${URL}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ wishlist: updatedWishlist }),
      });
      if (!patchRes.ok) throw new Error("Failed to update wishlist");
    } catch (err) {
      console.error("Error updating wishlist:", err);
      toast.error("Failed to update wishlist");
    }
  };

  const incrementQuantity = () =>
    setQuantity(quantity == 5 ? quantity : quantity + 1);
  const decrementQuantity = () => quantity > 1 && setQuantity(quantity - 1);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-red-600 font-semibold animate-pulse">
        {error}
      </div>
    );
  }

  if (!product) {
    return <ShoeCartLoader />;
  }

  return (
    <div className="bg-black   min-h-screen py-4 sm:py-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-6xl mx-4 sm:mx-auto bg-white p-4 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-start">
          {/* Product Image Section */}
          <div className="space-y-4">
            {/* Main Product Image */}
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg">
              <img
                src={
                  product.imageUrls?.[selectedImageIndex] ||
                  "/images/fallback-product.png"
                }
                alt={product.name}
                className="w-full h-64 sm:h-[400px] object-cover transition-transform duration-350 group-hover:scale-105"
              />
            </div>

            {/* Image Thumbnails Gallery */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {product.imageUrls && product.imageUrls.length > 1 && (
                    <div className="mt-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        More Images:
                      </label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {product.imageUrls.map((image, index) => (
                          <button
                            key={index}
                            onMouseEnter={() => handleImageClick(index)}
                            className={`relative overflow-hidden rounded-md border-2 transition-all duration-200 ${
                              selectedImageIndex === index
                                ? "border-transparent hover:border-gray-400"
                                : "border-transparent opacity-50 hover:border-gray-400"
                            }`}
                          >
                            <img
                              src={image}
                              alt={`${product.name} view ${index + 1}`}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover"
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 opacity-20"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            <p className="text-xl sm:text-2xl font-semibold text-gray-800">
              ${product.price}
            </p>
            {typeof product.inStock === "boolean" && (
              <span
                className={`inline-block px-3 py-[2px] text-xs font-medium rounded-full ${
                  product.inStock
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            )}

            {!/^none$/i.test(product.specialOffer) && product.inStock && (
              <span className="inline-block bg-red-500 text-white text-xs sm:text-sm font-medium px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-sm">
                {product.specialOffer}
              </span>
            )}

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {product.description || "No description available."}
            </p>

            <div className="text-xs sm:text-sm text-gray-600">
              <strong className="text-gray-800">Category:</strong>{" "}
              {product.categoryName}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">
              <strong className="text-gray-800">Brand:</strong> {product.brand}
            </div>

            {/* Size Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Available Sizes:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes?.map((shoeSize) => (
                  <button
                    key={shoeSize}
                    onClick={() => setSize(shoeSize)}
                    disabled={!product.inStock}
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition
                      ${
                        size === shoeSize
                          ? "bg-gray-300 text-gray-800 "
                          : "bg-transparent"
                      }
                      ${
                        !product.inStock
                          ? "cursor-not-allowed opacity-70"
                          : "hover:bg-gray-300"
                      }
                    `}
                  >
                    {shoeSize}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center space-x-4">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Quantity:
              </label>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={decrementQuantity}
                  disabled={!product.inStock || loading}
                  className="px-3 py-1 sm:px-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 transition disabled:opacity-50"
                >
                  -
                </button>
                <span className="px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base bg-white">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  disabled={!product.inStock || loading}
                  className="px-3 py-1 sm:px-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 transition disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
              {isSameSizeInCart ? (
                <button
                  onClick={() => navigate("/cart")}
                  disabled={!product.inStock}
                  className={`flex items-center gap-2 py-2 px-4 sm:py-3 sm:px-6 rounded-full text-xs sm:text-sm font-semibold transition-shadow shadow-md ${
                    product.inStock
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CiShoppingCart className="text-base sm:text-lg" />
                  Go to Cart
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || !size || loading}
                  className={`flex items-center gap-2 py-2 px-4 sm:py-3 sm:px-6 rounded-full text-xs sm:text-sm font-semibold transition-shadow shadow-md ${
                    product.inStock && size && !loading
                      ? "bg-black hover:bg-gray-800 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <CiShoppingCart className="text-base sm:text-lg" />
                  {loading ? "Adding..." : "Add to Cart"}
                </button>
              )}

              <button
                onClick={handleAddToWishlist}
                disabled={loading}
                className={`flex items-center gap-2 py-2 px-4 sm:py-3 sm:px-6 rounded-full text-xs sm:text-sm font-semibold transition ${
                  isInWishlist
                    ? "bg-red-100 text-red-600 border border-red-300 hover:bg-red-200"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <CiHeart
                  className={`text-base sm:text-lg ${
                    isInWishlist ? "fill-current" : ""
                  }`}
                />
                {isInWishlist ? "In Wishlist" : "Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
