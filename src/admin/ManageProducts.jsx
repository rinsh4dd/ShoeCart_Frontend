import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEdit,
  FaPlus,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaImage,
  FaCheck,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { URL } from "../service/api";
import ShoeCartLoader from "../common/ui/Loader";
import { GetAllProducts } from "../service/product";
import { GetAllCategories } from "../service/category";
import { CreateProduct, UpdateProduct } from "../service/product";

function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const productsPerPage = 10;

  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    price: "",
    categoryId: "",
    specialOffer: "",
    availableSizes: [],
    currentStock: "",
    images: [],
    mainImageIndex: 0,
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    brand: "",
    description: "",
    price: "",
    categoryId: "",
    specialOffer: "",
    availableSizes: [],
    currentStock: "",
    existingImages: [],
    newImages: [],
    mainImageIndex: 0,
    inStock: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);

  const sizeOptions = ["6", "7", "8", "9", "10", "11", "12", "13"];

  // Toast notification function
  const showToastMessage = (message, duration = 3000) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await GetAllCategories();
        setCategory(data?.data || []);
      } catch (e) {
        console.error("Error fetching categories:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await GetAllProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products. Please try again.");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleToggleStock = async (productId, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      await axios.patch(`${URL}/products/${productId}`, {
        inStock: updatedStatus,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, inStock: updatedStatus } : p
        )
      );
      showToastMessage(
        `Product ${
          updatedStatus ? "marked as in stock" : "marked as out of stock"
        }`
      );
    } catch (err) {
      showToastMessage("Failed to update stock status", 3000);
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.patch(
        `${URL}/products/status/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, isActive: !p.isActive } : p
        )
      );

      showToastMessage(
        response.data?.message ||
          `Product ${!currentStatus ? "Activated" : "Deactivated"} Successfully`
      );
    } catch (err) {
      console.error(err);
      showToastMessage("Failed to update product status. Please try again.");
    }
  };

  const handleEditClick = async (product) => {
    setEditingProduct(product);
    setEditFormData({
      id: product.id,
      name: product.name || "",
      brand: product.brand || "",
      description: product.description || "",
      price: product.price || "",
      categoryId: product.categoryId || "",
      specialOffer: product.specialOffer || "",
      availableSizes: product.availableSizes || [],
      currentStock: product.currentStock || "",
      existingImages: product.imageBase64 || [],
      newImages: [],
      mainImageIndex: 0,
      inStock: product.inStock !== undefined ? product.inStock : true,
    });
    setEditImagePreviews([]);
    setShowEditModal(true);
  };

  // Add Product Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size],
    }));
    if (formErrors.availableSizes) {
      setFormErrors((prev) => ({ ...prev, availableSizes: "" }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      showToastMessage("Maximum 5 images allowed");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    if (formErrors.images) {
      setFormErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      mainImageIndex:
        prev.mainImageIndex === index
          ? 0
          : prev.mainImageIndex > index
          ? prev.mainImageIndex - 1
          : prev.mainImageIndex,
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Edit Product Handlers
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEditSizeToggle = (size) => {
    setEditFormData((prev) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s) => s !== size)
        : [...prev.availableSizes, size],
    }));
    if (editFormErrors.availableSizes) {
      setEditFormErrors((prev) => ({ ...prev, availableSizes: "" }));
    }
  };

  const handleEditImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages =
      editFormData.existingImages.length +
      editFormData.newImages.length +
      files.length;

    if (totalImages > 5) {
      showToastMessage("Maximum 5 images allowed");
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      newImages: [...prev.newImages, ...files],
    }));

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    if (editFormErrors.images) {
      setEditFormErrors((prev) => ({ ...prev, images: "" }));
    }
  };

  const handleRemoveExistingImage = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveNewImage = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      newImages: prev.newImages.filter((_, i) => i !== index),
    }));
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Product name is required";
    if (!formData.brand.trim()) errors.brand = "Brand is required";
    if (!formData.description.trim())
      errors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      errors.price = "Price must be greater than 0";
    if (!formData.categoryId) errors.categoryId = "Category is required";
    if (formData.availableSizes.length === 0)
      errors.availableSizes = "At least one size is required";
    if (!formData.currentStock || parseInt(formData.currentStock) < 0)
      errors.currentStock = "Stock cannot be negative";
    if (formData.images.length === 0)
      errors.images = "At least one image is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
    const totalImages =
      editFormData.existingImages.length + editFormData.newImages.length;

    if (!editFormData.name.trim()) errors.name = "Product name is required";
    if (!editFormData.brand.trim()) errors.brand = "Brand is required";
    if (!editFormData.description.trim())
      errors.description = "Description is required";
    if (!editFormData.price || parseFloat(editFormData.price) <= 0)
      errors.price = "Price must be greater than 0";
    if (!editFormData.categoryId) errors.categoryId = "Category is required";
    if (editFormData.availableSizes.length === 0)
      errors.availableSizes = "At least one size is required";
    if (!editFormData.currentStock || parseInt(editFormData.currentStock) < 0)
      errors.currentStock = "Stock cannot be negative";
    if (totalImages === 0) errors.images = "At least one image is required";

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const productFormData = new FormData();
      productFormData.append("Name", formData.name);
      productFormData.append("Brand", formData.brand);
      productFormData.append("Description", formData.description);
      productFormData.append("Price", formData.price);
      productFormData.append("CategoryId", formData.categoryId);
      productFormData.append("SpecialOffer", formData.specialOffer || "");
      productFormData.append("CurrentStock", formData.currentStock);
      productFormData.append("MainImageIndex", formData.mainImageIndex);

      formData.availableSizes.forEach((size) => {
        productFormData.append("AvailableSizes", size);
      });

      formData.images.forEach((image) => {
        productFormData.append("Images", image);
      });

      await CreateProduct(productFormData);

      showToastMessage("Product added successfully!");
      setShowAddModal(false);
      resetForm();

      const data = await GetAllProducts();
      setProducts(data);
    } catch (err) {
      showToastMessage(err.message || "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!validateEditForm()) return;

    setSubmitting(true);

    try {
      const updateData = new FormData();
      updateData.append("Id", editFormData.id);
      updateData.append("Name", editFormData.name);
      updateData.append("Brand", editFormData.brand);
      updateData.append("Description", editFormData.description);
      updateData.append("Price", editFormData.price);
      updateData.append("CategoryId", editFormData.categoryId);
      updateData.append("SpecialOffer", editFormData.specialOffer || "");
      updateData.append("CurrentStock", editFormData.currentStock);
      updateData.append("InStock", editFormData.inStock);
      updateData.append("MainImageIndex", editFormData.mainImageIndex);

      editFormData.availableSizes.forEach((size) => {
        updateData.append("AvailableSizes", size);
      });

      editFormData.newImages.forEach((image) => {
        updateData.append("NewImages", image);
      });

      await UpdateProduct(updateData);

      showToastMessage("Product updated successfully!");
      setShowEditModal(false);
      resetEditForm();

      const data = await GetAllProducts();
      setProducts(data);
    } catch (err) {
      showToastMessage(err.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      description: "",
      price: "",
      categoryId: "",
      specialOffer: "",
      availableSizes: [],
      currentStock: "",
      images: [],
      mainImageIndex: 0,
    });
    setImagePreviews([]);
    setFormErrors({});
  };

  const resetEditForm = () => {
    setEditFormData({
      id: "",
      name: "",
      brand: "",
      description: "",
      price: "",
      categoryId: "",
      specialOffer: "",
      availableSizes: [],
      currentStock: "",
      existingImages: [],
      newImages: [],
      mainImageIndex: 0,
      inStock: true,
    });
    setEditImagePreviews([]);
    setEditFormErrors({});
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (num) => setCurrentPage(num);

  if (loading) {
    return <ShoeCartLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 p-6 rounded-lg text-center">
          <h3 className="text-red-800 font-bold mb-4">{error}</h3>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] animate-slide-in">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-2xl px-6 py-4 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-gray-800 font-medium">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header with Glass Effect */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Manage Products
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:from-gray-800 hover:to-gray-700 font-medium py-3 px-6 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl backdrop-blur-xl"
          >
            <FaPlus />
            Add Product
          </button>
        </div>

        {/* Search with Glass Effect */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-xl mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name, brand, or category"
              className="w-full pl-12 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table with Glass Effect */}
        <div className="overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/30 text-sm">
              <thead className="bg-white/30 backdrop-blur-xl">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Brand
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {currentProducts.length > 0 ? (
                  currentProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-white/30 transition-all duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/60 backdrop-blur-sm border border-white/40 shadow-md">
                            <img
                              className="h-full w-full object-cover"
                              src={
                                product.imageBase64[0] ||
                                "https://via.placeholder.com/150"
                              }
                              alt={product.name}
                              onError={(e) =>
                                (e.target.src =
                                  "https://via.placeholder.com/150")
                              }
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {product.name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              #{product.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {product.brand || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {category.find((cat) => cat.id === product.categoryId)
                          ?.name || "-"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        ${product.price || "0"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleToggleStock(product.id, product.inStock)
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm border transition-all duration-300 ${
                            product.inStock
                              ? "bg-green-100/60 text-green-700 border-green-200/50 hover:bg-green-200/60"
                              : "bg-red-100/60 text-red-700 border-red-200/50 hover:bg-red-200/60"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleStatusToggle(product.id, product.isActive)
                          }
                          className="group flex items-center gap-2 transition-all duration-300"
                        >
                          {product.isActive ? (
                            <>
                              <FaToggleOn className="text-3xl text-green-500 group-hover:text-green-600 transition-colors" />
                              <span className="text-sm font-semibold text-green-700 group-hover:text-green-800">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="text-3xl text-gray-400 group-hover:text-gray-500 transition-colors" />
                              <span className="text-sm font-semibold text-gray-600 group-hover:text-gray-700">
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/80 hover:bg-blue-600/80 text-white font-medium rounded-xl transition-all duration-300 backdrop-blur-sm"
                        >
                          <FaEdit />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center px-6 py-8 text-gray-600"
                    >
                      {searchTerm
                        ? "No matching products found."
                        : "No products available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination with Glass Effect */}
        {filteredProducts.length > productsPerPage && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/60 backdrop-blur-2xl pt-0 py-4 shadow-2xl border-t border-white/40">
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-3 rounded-xl hover:bg-white/60 disabled:opacity-30 transition-all backdrop-blur-sm"
              >
                <FaChevronLeft />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all backdrop-blur-sm ${
                    currentPage === i + 1
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "hover:bg-white/60 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl hover:bg-white/60 disabled:opacity-30 transition-all backdrop-blur-sm"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/30">
            <div className="sticky top-0 bg-white/50 backdrop-blur-2xl border-b border-white/30 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Add New Product
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/50 rounded-xl transition-all"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto max-h-[calc(90vh-140px)]"
            >
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="Enter product name"
                    />
                    {formErrors.name && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="Enter brand name"
                    />
                    {formErrors.brand && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {formErrors.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Enter product description"
                  />
                  {formErrors.description && (
                    <p className="text-red-600 text-xs mt-1 font-medium">
                      {formErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                    {formErrors.price && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {formErrors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select category</option>
                      {category.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {formErrors.categoryId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="0"
                    />
                    {formErrors.currentStock && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {formErrors.currentStock}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Offer (Optional)
                  </label>
                  <input
                    type="text"
                    name="specialOffer"
                    value={formData.specialOffer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                    placeholder="e.g., 20% OFF"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Sizes *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleSizeToggle(size)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all backdrop-blur-sm ${
                          formData.availableSizes.includes(size)
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                            : "bg-white/50 text-gray-700 border border-white/40 hover:bg-white/70"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {formErrors.availableSizes && (
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      {formErrors.availableSizes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images * (Max 5)
                  </label>
                  <div className="border-2 border-dashed border-white/40 rounded-xl p-6 bg-white/30 hover:bg-white/50 transition-all backdrop-blur-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <FaImage className="text-4xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium">
                        Click to upload images
                      </span>
                    </label>
                  </div>
                  {formErrors.images && (
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      {formErrors.images}
                    </p>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative group rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm p-2 border border-white/40"
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                          {formData.mainImageIndex === index && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-lg">
                              <FaCheck className="text-xs" />
                              Main
                            </div>
                          )}
                          {formData.mainImageIndex !== index && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  mainImageIndex: index,
                                }))
                              }
                              className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg font-medium"
                            >
                              Set Main
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/50 backdrop-blur-2xl border-t border-white/30 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-xl hover:bg-white/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/30">
            <div className="sticky top-0 bg-white/50 backdrop-blur-2xl border-b border-white/30 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Edit Product
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                }}
                className="p-2 hover:bg-white/50 rounded-xl transition-all"
              >
                <FaTimes className="text-gray-600" />
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="overflow-y-auto max-h-[calc(90vh-140px)]"
            >
              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="Enter product name"
                    />
                    {editFormErrors.name && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {editFormErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Brand *
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={editFormData.brand}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="Enter brand name"
                    />
                    {editFormErrors.brand && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {editFormErrors.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Enter product description"
                  />
                  {editFormErrors.description && (
                    <p className="text-red-600 text-xs mt-1 font-medium">
                      {editFormErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                    {editFormErrors.price && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {editFormErrors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="categoryId"
                      value={editFormData.categoryId}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select category</option>
                      {category.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {editFormErrors.categoryId && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {editFormErrors.categoryId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={editFormData.currentStock}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                      placeholder="0"
                    />
                    {editFormErrors.currentStock && (
                      <p className="text-red-600 text-xs mt-1 font-medium">
                        {editFormErrors.currentStock}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Special Offer (Optional)
                  </label>
                  <input
                    type="text"
                    name="specialOffer"
                    value={editFormData.specialOffer}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition-all"
                    placeholder="e.g., 20% OFF"
                  />
                </div>

                <div className="flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                  <input
                    type="checkbox"
                    id="inStock"
                    name="inStock"
                    checked={editFormData.inStock}
                    onChange={handleEditInputChange}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-400"
                  />
                  <label
                    htmlFor="inStock"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Currently in stock
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Available Sizes *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleEditSizeToggle(size)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-all backdrop-blur-sm ${
                          editFormData.availableSizes.includes(size)
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                            : "bg-white/50 text-gray-700 border border-white/40 hover:bg-white/70"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {editFormErrors.availableSizes && (
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      {editFormErrors.availableSizes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images * (Max 5 total)
                  </label>

                  {editFormData.existingImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        Existing Images:
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {editFormData.existingImages.map((img, index) => (
                          <div
                            key={`existing-${index}`}
                            className="relative group rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm p-2 border border-white/40"
                          >
                            <img
                              src={img}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-2 border-dashed border-white/40 rounded-xl p-6 bg-white/30 hover:bg-white/50 transition-all backdrop-blur-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditImageUpload}
                      className="hidden"
                      id="edit-image-upload"
                    />
                    <label
                      htmlFor="edit-image-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <FaImage className="text-4xl text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600 font-medium">
                        Click to add new images
                      </span>
                    </label>
                  </div>
                  {editFormErrors.images && (
                    <p className="text-red-600 text-xs mt-2 font-medium">
                      {editFormErrors.images}
                    </p>
                  )}

                  {editImagePreviews.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-600 font-medium mb-2">
                        New Images:
                      </p>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {editImagePreviews.map((preview, index) => (
                          <div
                            key={`new-${index}`}
                            className="relative group rounded-xl overflow-hidden bg-white/50 backdrop-blur-sm p-2 border border-white/40"
                          >
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/50 backdrop-blur-2xl border-t border-white/30 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetEditForm();
                  }}
                  className="px-6 py-2.5 bg-white/60 backdrop-blur-sm text-gray-700 font-semibold rounded-xl hover:bg-white/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit />
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default ManageProducts;
