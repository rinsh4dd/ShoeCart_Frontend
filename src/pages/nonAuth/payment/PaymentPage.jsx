import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../common/context/AuthProvider";
import { CartService } from "../../../service/CartService";
import { URL } from "../../../service/api";
import toast from "react-hot-toast";

function PaymentPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState([]);
  const { user, setCartLength } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("razorpay");

  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.shippingAddress) setBillingAddress(user.shippingAddress);

    const fetchCart = async () => {
      try {
        const cartItems = await CartService.getCart(user.token);
        setCart(cartItems);
      } catch (err) {
        console.error("Failed to load cart:", err);
        toast.error("Failed to load your cart");
      }
    };

    fetchCart();
  }, [user, navigate]);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handlePayment = async () => {
    if (!cart.length) return toast.error("Your cart is empty");

    if (
      !billingAddress.street ||
      !billingAddress.city ||
      !billingAddress.state ||
      !billingAddress.zip
    ) {
      return toast.error("Please complete your billing address");
    }

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === "razorpay") {
        // Create order on backend
        const { data: orderData } = await axios.post(
          `${URL}/payment/create-order`,
          {
            amount: cartTotal,
            billingStreet: billingAddress.street,
            billingCity: billingAddress.city,
            billingState: billingAddress.state,
            billingZip: billingAddress.zip,
            billingCountry: billingAddress.country,
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (!orderData.data?.key) {
          throw new Error("Razorpay key not received from backend");
        }

        const options = {
          key: orderData.data.key,
          amount: Math.round(cartTotal * 100),
          currency: orderData.data.currency,
          name: "ShoeCart",
          description: "Order Payment",
          order_id: orderData.data.orderId,
          prefill: { name: user.name, email: user.email },
          theme: { color: "#F75555" },
          handler: async (response) => {
            try {
              const verifyResponse = await axios.post(
                `${URL}/payment/verify`,
                {
                  OrderId: response.razorpay_order_id,
                  PaymentId: response.razorpay_payment_id,
                  Signature: response.razorpay_signature,
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
              );

              if (verifyResponse.data?.data?.clearCart) {
                await CartService.clearCart(user.token);
                setCartLength(0);
              }

              toast.success("Payment successful 🎉");
              navigate("/orders")
            } catch (err) {
              console.error("Payment verification failed:", err);
              toast.error("Payment verification failed. Contact support.");
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        rzp.on("payment.failed", (response) => {
          console.error("Payment failed:", response.error);
          toast.error("Payment failed ❌");
        });
      } else {
        try {
          const { data: codOrderResponse } = await axios.post(
            `${URL}/Orders/checkout`,
            {
              userId: user.id,
              paymentMethod: "CashOnDelivery",
              billingStreet: billingAddress.street,
              billingCity: billingAddress.city,
              billingState: billingAddress.state,
              billingZip: billingAddress.zip,
              billingCountry: billingAddress.country,
            },
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );

          if (codOrderResponse?.data?.id) {
            await CartService.clearCart(user.token);
            setCartLength(0);
            toast.success("Order placed with COD ✅");
            navigate("/order-confirmation", {
              state: { orderId: codOrderResponse.data.id },
            });
          } else {
            toast.error("Failed to place COD order. Try again!");
          }
        } catch (err) {
          console.error("COD order error:", err);
          toast.error("Failed to place COD order. Try again!");
        }
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err.message || "Payment failed. Try again!");
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: "razorpay",
      name: "Razorpay",
      icon: "https://razorpay.com/assets/razorpay-glyph.svg",
      description: "Pay securely with Razorpay",
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: "https://cdn-icons-png.flaticon.com/128/11181/11181299.png",
      description: "Pay when you receive your order",
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            Please login to proceed
          </div>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Secure Payment
          </h1>
          <p className="text-gray-600">
            Complete your purchase with confidence
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Method & Billing Address */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-6 border-2 rounded-xl flex flex-col items-start transition-all duration-200 ${
                      selectedPaymentMethod === method.id
                        ? "border-red-500 bg-red-50 shadow-md transform scale-105"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedPaymentMethod === method.id
                            ? "border-red-500 bg-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedPaymentMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <img
                        src={method.icon}
                        alt={method.name}
                        className="h-8 object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {method.name}
                    </h3>
                    <p className="text-gray-600 text-sm text-left">
                      {method.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-6">
                <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Billing Address
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["street", "city", "state", "zip"].map((field) => (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {field === "zip" ? "ZIP Code" : field}
                    </label>
                    <input
                      placeholder={`Enter your ${field}`}
                      value={billingAddress[field]}
                      onChange={(e) =>
                        setBillingAddress({
                          ...billingAddress,
                          [field]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {billingAddress.country}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8 h-fit">
            <div className="flex items-center mb-6">
              <div className="w-2 h-8 bg-red-600 rounded-full mr-3"></div>
              <h2 className="text-2xl font-bold text-gray-900">
                Order Summary
              </h2>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-22 h-12  rounded-lg flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-red-600">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              {selectedPaymentMethod === "cod" && (
                <p className="text-sm text-gray-600 mt-2 text-center">
                  + Cash handling charges may apply
                </p>
              )}
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing || !cart.length}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isProcessing || !cart.length
                  ? "bg-gray-400 cursor-not-allowed text-gray-700"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : selectedPaymentMethod === "cod" ? (
                `Place Order - $${cartTotal.toFixed(2)}`
              ) : (
                `Pay Now  $${cartTotal.toFixed(2)}`
              )}
            </button>

            {/* Security Badge */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Secure SSL Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
