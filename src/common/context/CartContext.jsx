// common/context/CartContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { URL } from '../../service/api';
import { AuthContext } from './AuthProvider';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, setCartLength } = useContext(AuthContext)

  // Load cart items when user changes
  useEffect(() => {
    if (user) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setCartLength(0);
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = user?.token;
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${URL}/cart`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract items from the nested data structure
        const items = result.data?.items || [];
        setCartItems(items);
        setCartLength(items.length);
      } else if (response.status === 401) {
        toast.error('Please login to view your cart');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const addToCart = async (productId, size, quantity) => {
    if (!user) {
      toast.warning('Please log in first!');
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch(`${URL}/cart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          productId: parseInt(productId),
          size,
          quantity: parseInt(quantity),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract items from the nested data structure
        const items = result.data?.items || [];
        setCartItems(items);
        setCartLength(items.length);
        toast.success('Item added to cart!');
        return true;
      } else if (response.status === 401) {
        toast.error('Please login to add items to cart');
        return false;
      } else {
        throw new Error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    if (!user) return false;

    setLoading(true);
    try {
      const response = await fetch(`${URL}/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract items from the nested data structure
        const items = result.data?.items || [];
        setCartItems(items);
        setCartLength(items.length);
        toast.success('Item removed from cart!');
        return true;
      } else {
        throw new Error('Failed to remove item from cart');
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartQuantity = async (cartItemId, newQuantity) => {
    if (!user) return false;

    setLoading(true);
    try {
      const response = await fetch(`${URL}/cart/${cartItemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quantity: parseInt(newQuantity),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract items from the nested data structure
        const items = result.data?.items || [];
        setCartItems(items);
        setCartLength(items.length);
        toast.success('Quantity updated!');
        return true;
      } else {
        throw new Error('Failed to update cart quantity');
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      toast.error('Failed to update cart quantity');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return false;

    setLoading(true);
    try {
      const response = await fetch(`${URL}/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        // Extract items from the nested data structure
        const items = result.data?.items || [];
        setCartItems(items);
        setCartLength(items.length);
        toast.success('Cart cleared!');
        return true;
      } else {
        throw new Error('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // FIXED: This should now work correctly with your API response structure
  const isItemInCart = (productId, size) => {
    return cartItems.some(item => 
      item.productId === parseInt(productId) && item.size === size
    );
  };

  const getCartItemId = (productId, size) => {
    const item = cartItems.find(item => 
      item.productId === parseInt(productId) && item.size === size
    );
    return item?.id;
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isItemInCart,
    getCartItemId,
    getCartTotal,
    getTotalQuantity,
    fetchCartItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};