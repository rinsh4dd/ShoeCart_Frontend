import axios from "axios";
import { URL } from "./api";

export async function GetAllUsers(token) {
  try {
    const response = await axios.get(`${URL}/Users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}
