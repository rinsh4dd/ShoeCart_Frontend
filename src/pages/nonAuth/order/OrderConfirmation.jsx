import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../common/context/AuthProvider";
import { URL } from "../../../service/api";
import ShoeCartLoader from "../../../common/ui/Loader";

function OrderConfirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!state?.orderId || !user) {
      navigate("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        const token = user.token;
        // Fetch order from your actual API endpoint
        const response = await axios.get(`${URL}/Orders/user/${user.id}/order/${state.orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data) {
          setOrder(response.data);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        // Fallback: try to get from user orders if API structure is different
        try {
          const { data: userData } = await axios.get(`${URL}/users/${user.id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          const foundOrder = userData.orders?.find(o => o.id === state.orderId);
          if (foundOrder) {
            setOrder(foundOrder);
          } else {
            navigate("/");
          }
        } catch (fallbackError) {
          console.error("Fallback order fetch failed:", fallbackError);
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [state, user, navigate]);

  if (loading) {
    return <ShoeCartLoader/>;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-800 mt-4">Order not found</h2>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Format order data based on your backend structure
  const orderDate = order.createdOn || order.createdAt || new Date().toISOString();
  const orderStatus = order.orderStatus || 'Processing';
  const paymentStatus = order.paymentStatus || 'Pending';
  const totalAmount = order.totalAmount || 0;
  const items = order.items || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Order Confirmed!</h1>
          <p className="text-lg text-gray-600 mt-2">Thank you for your purchase</p>
          <p className="text-sm text-gray-500 mt-2">Order #{order.id}</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {new Date(orderDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Payment Method: {order.paymentMethod || 'Cash on Delivery'}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {orderStatus}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ml-2 ${
                  paymentStatus === 'Completed' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Payment: {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div key={index} className="p-6 sm:p-8 flex flex-col sm:flex-row">
                <div className="flex-shrink-0">
                  <img
                    src={item.imageData || item.imageUrl || item.image_url || '/placeholder-shoe.jpg'}
                    alt={item.name || item.productName}
                    className="w-20 h-20 rounded-md object-cover border border-gray-200"
                    onError={(e) => {
                      e.target.src = '/placeholder-shoe.jpg';
                    }}
                  />
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-base font-medium text-gray-900">{item.name || item.productName}</h3>
                    <p className="text-base font-medium text-gray-900 ml-4">₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Size: {item.size || 'Standard'}</p>
                  <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity || 1}</p>
                  <p className="mt-1 text-sm text-gray-500">Price: ₹{(item.price || 0).toFixed(2)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Address */}
          <div className="p-6 sm:p-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
            <div className="text-sm text-gray-600">
              <p>{order.billingStreet}</p>
              <p>{order.billingCity}, {order.billingState} {order.billingZip}</p>
              <p>{order.billingCountry}</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-gray-50">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Total Amount</p>
              <p>₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                We've sent your order confirmation and receipt to {user?.email || 'your email'}.
              </p>
              {order.paymentMethod === 'CashOnDelivery' && (
                <p className="text-sm text-yellow-600 mt-2">
                  Please keep cash ready for delivery. You'll pay when your order arrives.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View All Orders
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;