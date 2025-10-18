// src/service/userService.js
import axios from "axios";
import { URL } from "./api";

export async function GetAllUsers(token) {
  try {
    const res = await axios.get(`${URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data.data || res.data; // Support both data wrappers
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    throw error;
  }
}

export async function UpdateUserBlockStatus(userId, isBlocked, token) {
  try {
    const res = await axios.put(
      `${URL}/users/block-unblock/${userId}`, 
      { isBlocked },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    console.error(`❌ Error updating user ${userId} block status:`, error);
    throw error;
  }
}

// ✅ Delete user
export async function DeleteUser(userId, token) {
  try {
    const res = await axios.delete(`${URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error(`❌ Error deleting user ${userId}:`, error);
    throw error;
  }
}
