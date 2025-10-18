// common/context/WishlistContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { WishlistService } from "../../service/WishlistService";
import { AuthContext } from "./AuthProvider";

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load wishlist when user changes
  useEffect(() => {
    if (user?.id) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await WishlistService.getWishlist(user.id);
      setWishlistItems(data || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast.warning("Please log in first!");
      return;
    }

    // Optimistic UI update
    const alreadyInWishlist = wishlistItems.some(
      (item) => item.productId === productId
    );
    setWishlistItems(
      (prev) =>
        alreadyInWishlist
          ? prev.filter((item) => item.productId !== productId) // remove
          : [...prev, { productId }] // temporarily add, can adjust if you have full product info
    );

    try {
      await WishlistService.toggleWishlist(productId);
      toast.success(
        alreadyInWishlist ? "Removed from wishlist!" : "Added to wishlist!"
      );
    } catch (error) {
      // Rollback if API fails
      setWishlistItems((prev) =>
        alreadyInWishlist
          ? [...prev, { productId }]
          : prev.filter((item) => item.productId !== productId)
      );
      toast.error("Failed to update wishlist");
      console.error(error);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === parseInt(productId));
  };

  const clearWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Clear by sending an empty wishlist array to backend
      const promises = wishlistItems.map((item) =>
        WishlistService.toggleWishlist(user.id, item.id)
      );
      await Promise.all(promises);
      setWishlistItems([]);
      toast.success("Wishlist cleared!");
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast.error("Failed to clear wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        loading,
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
