import axios from "axios";
import { URL } from "./api";

export const getAllOrders = async (token) => {
  try {
    const res = await axios.get(`${URL}/Orders/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // returns the array of orders
  } catch (err) {
    console.error("Error fetching all orders:", err);
    throw err;
  }
};