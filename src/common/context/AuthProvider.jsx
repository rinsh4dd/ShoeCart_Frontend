// common/context/AuthProvider.jsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { URL } from "../../service/api";
import { CartService } from "../../service/CartService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartLength, setCartLength] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Fetch cart length when user changes
  useEffect(() => {
    const fetchCartLength = async () => {
      if (user?.token) {
        try {
          const cartItems = await CartService.getCart(user.token);
          setCartLength(cartItems.length);
        } catch (err) {
          console.log("Failed to load cart:", err);
          setCartLength(0);
        }
      } else {
        setCartLength(0);
      }
    };

    fetchCartLength();
  }, [user]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = (userData, accessToken, refreshToken) => {
    const userWithToken = { ...userData, token: accessToken };
    setUser(userWithToken);
    localStorage.setItem("user", JSON.stringify(userWithToken));

    Cookies.set("refreshToken", refreshToken, {
      expires: 7,
      secure: true,
      sameSite: "Strict",
    });
  };

  const refreshAccessToken = async () => {
    try {
      const res = await axios.post(`${URL}/Auth/refresh-token`, {}, { withCredentials: true });
      const newAccessToken = res.data.accessToken;

      if (newAccessToken) {
        const updatedUser = { ...user, token: newAccessToken };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return newAccessToken;
      }
    } catch (err) {
      console.error("Refresh token failed:", err);
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    setCartLength(0);
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("token")
    Cookies.remove("refreshToken");
    navigate("/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        setCartLength,
        cartLength,
        refreshAccessToken,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}