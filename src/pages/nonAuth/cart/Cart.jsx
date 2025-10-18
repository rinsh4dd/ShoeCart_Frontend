import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../common/context/AuthProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CartService}from "../../../service/CartService"
import ShoeCartLoader from "../../../common/ui/Loader";

function Cart() {
  const [cart, setCart] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading, setCartLength } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && !user?.token) {
      navigate("/login", { state: { from: "/cart" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchCartData = async () => {
      if (!loading && user?.token) {
        setIsLoading(true);
        try {
          const cartItems = await CartService.getCart(user.token);
          setCart(cartItems);
          setCartLength(cartItems.length);
        } catch (error) {
          console.error("Error fetching cart:", error);
          if (error.response?.status === 401) {
            toast.error("Please login again");
            navigate("/login");
          } else {
            toast.error("Failed to load cart");
          }
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCartData();
  }, [loading, user, setCartLength, navigate]);

  const handleRemove = async (cartItemId) => {
    setIsUpdating(true);
    try {
      const updatedCart = await CartService.removeFromCart(user.token, cartItemId);
      setCart(updatedCart);
      setCartLength(updatedCart.length);
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        navigate("/login");
      } else {
        toast.error("Failed to remove item");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    
    setIsUpdating(true);
    try {
      const updatedCart = await CartService.updateCartQuantity(user.token, cartItemId, newQuantity);
      setCart(updatedCart);
      setCartLength(updatedCart.length);
    } catch (error) {
      console.error("Error updating quantity:", error);
      if (error.response?.status === 401) {
        toast.error("Please login again");
        navigate("/login");
      } else {
        toast.error("Failed to update quantity");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getItemCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  const handleCheckout = () => {
    navigate("/payment");
  };

  if (isLoading) {
    return <ShoeCartLoader />;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-indigo-500 opacity-30 animate-pulse"></div>
          <div className="relative w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Your <span className="text-red-500">Cart</span> is Empty
        </h1>
        <p className="text-gray-500 text-center max-w-md">
          Looks like you haven't added anything to your cart yet. Start exploring our latest shoe collections and find your perfect pair!
        </p>

        <button 
          onClick={() => navigate("/")}
          className="mt-8 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-700 transition duration-200 shadow-md font-medium"
        >
          Continue Shopping
        </button>

        <div className="mt-6 flex space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-gray-500 mt-2">{getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-200">
                {cart.map((item) => (
                  <div key={item.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                    <div className="flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-24 h-24 rounded-md object-cover border border-gray-200"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-lg font-medium text-gray-900 ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Size: {item.size}</p>
                      <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                      
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            −
                          </button>
                          <span className="px-3 py-1 text-center w-12 border-x border-gray-300">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => handleRemove(item.id)}
                          disabled={isUpdating}
                          className="ml-4 text-sm font-medium text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">Free</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-medium text-gray-900">${getTotal().toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isUpdating}
                className="w-full bg-red-500 border border-transparent rounded-md py-3 px-4 flex items-center justify-center text-base font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white mx-2" viewBox="0 0 24 24"></svg>
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </button>

              <div className="mt-6 text-center text-sm text-gray-500">
                <p>
                  or{" "}
                  <button
                    onClick={() => navigate("/")}
                    className="text-red-500 font-medium hover:text-indigo-500"
                  >
                    Continue Shopping →
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;