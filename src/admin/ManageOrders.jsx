import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaBoxOpen,
  FaShippingFast,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaSearch,
  FaFilter,
  FaDownload,
  FaClock,
  FaTruck,
} from "react-icons/fa";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { URL } from "../service/api";
import ShoeCartLoader from "../common/ui/Loader";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productSalesData, setProductSalesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set());

  // Fetch all orders from admin endpoint
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${URL}/Orders/admin/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = res.data || [];

        // Collect product sales
        const productSales = {};
        data.forEach((order) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item) => {
              const productId = item.productId || item.id;
              if (!productSales[productId]) {
                productSales[productId] = {
                  name: item.productName || "Unknown Product",
                  image: item.imageData || "",
                  sales: 0,
                  revenue: 0,
                };
              }
              productSales[productId].sales += item.quantity || 1;
              productSales[productId].revenue +=
                (item.price || 0) * (item.quantity || 1);
            });
          }
        });

        setOrders(data);
        setFilteredOrders(data);
        setProductSalesData(Object.values(productSales));
      } catch (err) {
        console.error("Error fetching orders:", err);
        const errorMsg = err.response?.data?.message || "Failed to load orders. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders based on search, status, and date
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id?.toString().includes(searchTerm) ||
          order.billingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter(
        (order) => order.orderStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Date filter
    if (dateFilter !== "All") {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdOn);
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "Today":
            return diffDays <= 1;
          case "Week":
            return diffDays <= 7;
          case "Month":
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, dateFilter, orders]);

  // Calculate order statistics from filtered orders
  const orderStats = filteredOrders.reduce(
    (stats, order) => {
      stats.totalOrders++;
      
      const status = order.orderStatus?.toLowerCase() || "pending";
      
      if (status === "delivered") {
        stats.totalRevenue += order.totalAmount || 0;
      }

      switch (status) {
        case "delivered":
          stats.delivered++;
          break;
        case "shipped":
          stats.shipped++;
          break;
        case "cancelled":
          stats.cancelled++;
          break;
        case "pending":
        default:
          stats.pending++;
      }

      return stats;
    },
    {
      totalOrders: 0,
      totalRevenue: 0,
      pending: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }
  );

  const handleStatusChange = async (orderId, newStatus) => {
    // Add to updating set
    setUpdatingOrders(prev => new Set(prev).add(orderId));

    try {
      // Call the correct API endpoint
      const response = await axios.post(
        `${URL}/Orders/admin/update-status/${orderId}`,
        { newStatus: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Check for successful response
      if (response.data && response.data.statusCode === 200) {
        // Update local state with the returned data
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, orderStatus: newStatus } : o
          )
        );
        
        toast.success(response.data.message || `Order #${orderId} status updated to ${newStatus}`);
      } else {
        throw new Error(response.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to update status";
      toast.error(errorMsg);
    } finally {
      // Remove from updating set
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const donutData = {
    labels: ["Pending", "Shipped", "Delivered", "Cancelled"],
    datasets: [
      {
        data: [
          orderStats.pending,
          orderStats.shipped,
          orderStats.delivered,
          orderStats.cancelled,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(16, 185, 129, 0.9)",
          "rgba(239, 68, 68, 0.9)",
        ],
        borderColor: ["#fff", "#fff", "#fff", "#fff"],
        borderWidth: 3,
        hoverOffset: 20,
      },
    ],
  };

  const sortedProducts = [...productSalesData]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
    
  const barData = {
    labels: sortedProducts.map((p) => p.name),
    datasets: [
      {
        label: "Units Sold",
        data: sortedProducts.map((p) => p.sales),
        backgroundColor: "rgba(220, 38, 38, 0.8)",
        borderColor: "rgba(220, 38, 38, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: "Revenue ($)",
        data: sortedProducts.map((p) => p.revenue),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "shipped":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const headers = ["Order ID", "Customer", "Date", "Amount", "Payment Status", "Order Status"];
    const csvData = filteredOrders.map(order => [
      order.id,
      order.billingName || "N/A",
      new Date(order.createdOn).toLocaleDateString(),
      order.totalAmount,
      order.paymentStatus,
      order.orderStatus
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Orders exported successfully");
  };

  const statusData = [
    {
      label: "Pending",
      value: orderStats.pending,
      icon: <FaClock />,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      label: "Shipped",
      value: orderStats.shipped,
      icon: <FaTruck />,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Delivered",
      value: orderStats.delivered,
      icon: <FaCheckCircle />,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      label: "Cancelled",
      value: orderStats.cancelled,
      icon: <FaTimesCircle />,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
  ];

  if (loading) return <ShoeCartLoader />;
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-red-200 rounded-2xl shadow-2xl px-8 py-6 max-w-md"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <FaTimesCircle className="text-3xl text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error Loading Orders</h3>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
            Order Management
          </h1>
          <p className="text-gray-600">Manage and track all your orders in one place</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800">{orderStats.totalOrders}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
                <FaBoxOpen className="text-2xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800">
                  ${orderStats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <FaDollarSign className="text-2xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Shipped Orders</p>
                <p className="text-3xl font-bold text-gray-800">{orderStats.shipped}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <FaShippingFast className="text-2xl" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 hover:border-red-300 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Delivered</p>
                <p className="text-3xl font-bold text-gray-800">{orderStats.delivered}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                <FaCheckCircle className="text-2xl" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer font-medium"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-3 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all cursor-pointer font-medium"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Week">This Week</option>
                <option value="Month">This Month</option>
              </select>

              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                <FaDownload />
                Export
              </button>
            </div>
          </div>
        </motion.div>

        {/* Charts and Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Doughnut Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100"
          >
            <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-red-600">📊</span>
              Order Status Distribution
            </h3>
            <div className="h-64 flex items-center justify-center relative">
              {orderStats.totalOrders > 0 ? (
                <>
                  <Doughnut
                    data={donutData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "70%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 11, weight: "600" },
                          },
                        },
                        tooltip: {
                          backgroundColor: "rgba(0, 0, 0, 0.9)",
                          padding: 12,
                          cornerRadius: 8,
                          callbacks: {
                            label: (context) => {
                              const label = context.label || "";
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value} (${percentage}%)`;
                            },
                          },
                        },
                      },
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center" style={{ marginBottom: "60px" }}>
                      <p className="text-3xl font-bold text-gray-800">
                        {orderStats.totalOrders}
                      </p>
                      <p className="text-xs text-gray-500">Total Orders</p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No data available</p>
              )}
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-6 rounded-2xl shadow-xl border-2 border-red-100 lg:col-span-2"
          >
            <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span className="text-red-600">📈</span>
              Top Selling Products
            </h3>
            <div className="h-64">
              {sortedProducts.length > 0 ? (
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { 
                        beginAtZero: true, 
                        grid: { color: "rgba(220, 38, 38, 0.1)" }
                      },
                      x: { grid: { display: false } },
                    },
                    plugins: {
                      legend: { 
                        position: "top",
                        labels: { font: { weight: "600" } }
                      },
                      tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.9)",
                        padding: 12,
                        cornerRadius: 8,
                      },
                    },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-400">No product data available</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Status Breakdown Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-red-600">📋</span>
            Order Status Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusData.map((status, index) => (
              <motion.div
                key={status.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`${status.bgColor} rounded-2xl p-6 border-2 border-white shadow-xl cursor-pointer transition-all hover:shadow-2xl`}
                onClick={() => {
                  setStatusFilter(status.label);
                  setSelectedStatus(status.label);
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-4 rounded-xl bg-gradient-to-br ${status.color} text-white shadow-lg`}
                  >
                    {status.icon}
                  </div>
                  <motion.div
                    className="text-4xl font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 + 0.2, type: "spring" }}
                  >
                    <span className={status.textColor}>{status.value}</span>
                  </motion.div>
                </div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {status.label} Orders
                </p>
                <div className="w-full bg-white rounded-full h-2 mt-3">
                  <motion.div
                    className={`h-2 rounded-full bg-gradient-to-r ${status.color}`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        orderStats.totalOrders > 0
                          ? (status.value / orderStats.totalOrders) * 100
                          : 0
                      }%`,
                    }}
                    transition={{ delay: 0.8 + index * 0.1 + 0.4, duration: 0.8 }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  {orderStats.totalOrders > 0
                    ? ((status.value / orderStats.totalOrders) * 100).toFixed(1)
                    : 0}
                  % of total
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-xl border-2 border-red-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-red-50 to-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order, idx) => (
                      <motion.tr
                        key={order.id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-gradient-to-r hover:from-red-50 hover:to-white transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          #{order.id || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {order.id || "Guest"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.createdOn
                            ? new Date(order.createdOn).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.items && order.items.length > 0 ? (
                              order.items.map((item, i) => (
                                <span
                                  key={i}
                                  className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-medium"
                                >
                                  {item.productName || "Product"} x{item.quantity || 1}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400">No items</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border-2 ${
                              order.orderStatus === "Delivered"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {order.orderStatus === "Delivered" ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <select
                              disabled={["Delivered", "Cancelled"].includes(order.orderStatus) || updatingOrders.has(order.id)}
                              className={`text-sm font-semibold rounded-xl border-2 px-3 py-2 cursor-pointer transition-all ${getStatusBadgeClass(
                                order.orderStatus
                              )} ${
                                ["Delivered", "Cancelled"].includes(order.orderStatus)
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:shadow-md"
                              } ${updatingOrders.has(order.id) ? "opacity-50 cursor-wait" : ""}`}
                              value={order.orderStatus || "Pending"}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            {updatingOrders.has(order.id) && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-red-600"></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FaBoxOpen className="text-6xl text-gray-300 mb-4" />
                          <p className="text-gray-500 text-lg font-medium">No orders found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your filters or search criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Status Selection Modal */}
        <AnimatePresence>
          {selectedStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedStatus(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-red-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  {statusData.find((s) => s.label === selectedStatus)?.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
                  {selectedStatus} Orders
                </h3>
                <p className="text-gray-600 mb-6 text-center">
                  You have{" "}
                  <span className="font-bold text-red-600">
                    {statusData.find((s) => s.label === selectedStatus)?.value || 0}
                  </span>{" "}
                  {selectedStatus.toLowerCase()} orders currently.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedStatus(null)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl transition-all font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStatus(null);
                      setStatusFilter(selectedStatus);
                    }}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl transition-all font-semibold shadow-lg"
                  >
                    View Orders
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ManageOrders;