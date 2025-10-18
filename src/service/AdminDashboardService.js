import axios from "axios";
import { URL } from "../service/api";

export async function GetAdminDashboardStats() {
  try {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${URL}/Orders/admin/dashboard?type=all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalRevenue: 0,
      totalProductsPurchased: 0,
      deliveredOrdersCount: 0,
    };
  }
}
