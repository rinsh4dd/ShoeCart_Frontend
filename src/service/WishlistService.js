import axios from "axios";
import { URL } from "../service/api"; // adjust if needed

const WISHLIST_URL = `${URL}/wishlist`;

export const WishlistService = {
  async getWishlist(userId) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${WISHLIST_URL}?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.data; // array of wishlist items
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      throw error;
    }
  },

  async toggleWishlist(productId) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${WISHLIST_URL}/${productId}`, // productId in URL
        {}, // empty body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data; // backend might not return updated list, we’ll handle that
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      throw error;
    }
  },
};
