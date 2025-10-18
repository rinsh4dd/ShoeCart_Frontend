import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  FaUser,
  FaShoppingBag,
  FaRupeeSign,
  FaBox,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { URL } from "../service/api";
import ShoeCartLoader from "../common/ui/Loader";

function UserOrders() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        const token = localStorage.getItem("token");

        const userRes = await axios.get(`${URL}/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(userRes.data.data);

        const orderRes = await axios.get(`${URL}/orders/admin/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(orderRes.data.data);
      } catch (err) {
        console.error("Failed to fetch user or orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [id]);

  if (loading) return <ShoeCartLoader />;

  // 🔸 Calculate order statistics
  const orderStats = {
    total: orders.length,
    delivered: orders.filter((o) => o.orderStatus === "Delivered").length,
    pending: orders.filter((o) => o.orderStatus === "Pending").length,
    totalAmount: orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    ),
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 🧍‍♂️ User Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-50 rounded-full text-blue-600">
            <FaUser className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
            <p className="text-gray-600">{user?.email || "N/A"}</p>
          </div>
        </div>
      </motion.div>

      {/* 📊 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Orders",
            value: orderStats.total,
            icon: <FaShoppingBag />,
          },
          {
            title: "Total Spent",
            value: `₹${orderStats.totalAmount}`,
            icon: <FaRupeeSign />,
          },
          {
            title: "Delivered",
            value: orderStats.delivered,
            icon: <FaCheckCircle />,
          },
          { title: "Pending", value: orderStats.pending, icon: <FaClock /> },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-gray-600">
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 📦 Orders List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <FaBox className="mr-2" /> Order History
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <div className="text-gray-400 mb-4">
              <FaShoppingBag className="text-5xl mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">
              No orders found
            </h3>
            <p className="text-gray-500">
              This user hasn’t placed any orders yet.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdOn).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 flex space-x-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(
                      order.paymentStatus
                    )}`}
                  >
                    {order.paymentMethod === "Cash on Delivery"
                      ? "COD"
                      : order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Items
                  </p>
                  <p className="font-medium">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Total Amount
                  </p>
                  <p className="font-medium flex items-center">
                    <FaRupeeSign className="mr-1" /> {order.totalAmount}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Payment Method
                  </p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Products
                </h4>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden mr-3">
                        {item.imageData && (
                          <img
                            src={`data:${item.imageMimeType};base64,${item.imageData}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Size: {item.size} • Qty: {item.quantity} • ₹
                          {item.price} each
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserOrders;
