import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../../../common/context/AuthProvider";
import ShoeCartLoader from "../../../common/ui/Loader";
import { URL } from "../../../service/api";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const currentUser = user || JSON.parse(localStorage.getItem("user"));

        if (!currentUser) {
          navigate("/login", { state: { from: "/orders" } });
          return;
        }

        setLoading(true);
        const token = localStorage.getItem("token");

        const { data } = await axios.get(`${URL}/Orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userOrders = data.data.filter(
          (o) =>
            (o.userId && o.userId === currentUser.id) || (!o.userId && true)
        );

        setOrders(userOrders);
      } catch (err) {
        setError("Failed to load your orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusBadge = (status) => {
    const statusClasses = {
      Processing: "bg-blue-100 text-blue-800 border border-blue-200",
      Shipped: "bg-purple-100 text-purple-800 border border-purple-200",
      Delivered: "bg-green-100 text-green-800 border border-green-200",
      Cancelled: "bg-red-100 text-red-800 border border-red-200",
      Pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          statusClasses[status] || "bg-gray-100 text-gray-800 border border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  if (loading) return <ShoeCartLoader />;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Loading Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center bg-white p-10 rounded-2xl shadow-lg max-w-md border border-gray-100">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Orders Yet</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your collection awaits. Discover exceptional pieces crafted just for you.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            Begin Your Journey
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Orders</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Curated collection of your purchases, each piece telling its own story
          </p>
        </div>

        <div className="space-y-8">
          {orders
            .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))
            .map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1"
              >
                <div className="p-8 flex flex-col lg:flex-row lg:justify-between lg:items-start border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Order #{order.id}
                      </h2>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <p className="text-gray-500 text-lg">
                      {order.createdOn ? formatDate(order.createdOn) : "Date unavailable"}
                    </p>
                  </div>
                  <div className="mt-4 lg:mt-0 lg:text-right">
                    <p className="text-3xl font-bold text-gray-900 mb-2">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-gray-500 text-sm">Total Amount</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items?.slice(0, 2).map((item, index) => (
                    <div key={index} className="p-8 flex items-center hover:bg-gray-50 transition-colors duration-200">
                      <div className="relative">
                        <img
                          src={
                            item.imageUrl ||
                            `data:image/jpeg;base64,${item.imageData}` ||
                            "/placeholder.png"
                          }
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                        />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                          {item.quantity}
                        </div>
                      </div>
                      
                      <div className="ml-6 flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-6 text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Size {item.size}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            </svg>
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">Subtotal</p>
                      </div>
                    </div>
                  ))}

                  {order.items?.length > 2 && (
                    <div className="p-6 text-center bg-gradient-to-r from-gray-50 to-gray-100">
                      <p className="text-gray-600 text-lg font-medium">
                        + {order.items.length - 2} additional exquisite item
                        {order.items.length - 2 !== 1 ? "s" : ""} in this order
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    Explore Order Details
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;