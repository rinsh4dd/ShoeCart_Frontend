import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Silk from "../../common/ui/Silk";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { AuthContext } from "../../common/context/AuthProvider";
import { URL } from "../../service/api";

function RegistrationPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const backgroundImages = [
    "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/46f6a122-0450-4b19-8808-5604a2afe847/JORDAN+LUKA+4+PF.png",
    "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/52642011-bfc1-4af4-975b-02f6f2b15ec3/JORDAN+LUKA+4+PF.png",
    "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco,u_126ab356-44d8-4a06-89b4-fcdcc8df0245,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/97299918-87e5-4dc4-b441-b048cb837215/JORDAN+LUKA+4+PF.png",
  ];

  // Image carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Must contain 8+ chars, 1 uppercase, 1 number, 1 special char";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSuccessNotification = () => {
    const alertBox = document.createElement("div");
    alertBox.className = "fixed top-5 right-5 z-50 animate-fade-in";
    alertBox.innerHTML = `
      <div class="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Registration successful! Redirecting to login...</span>
      </div>
    `;
    document.body.appendChild(alertBox);

    setTimeout(() => {
      if (document.body.contains(alertBox)) {
        document.body.removeChild(alertBox);
      }
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = {
        ...formData,
        role: "user",
        isBlock: false,
        cart: [],
        orders: [],
        wishlist: [],
        created_at: new Date().toISOString(),
      };

      await axios.post(`${URL}/Auth/register`, newUser);

      toast.success("Registration successful! Redirecting to login...");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-12">
      {/* Animated Silk background */}
      <div className="absolute inset-0 z-0">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex w-full max-w-6xl bg-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg border border-white/20"
      >
        <div className="flex flex-col md:flex-row w-full">
          {/* Form section */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="text-center mb-8">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-bold text-white mb-2"
              >
                Join ShoeCart
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-200"
              >
                Create your account to start shopping
              </motion.p>
            </div>

            {errors.server && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg text-sm"
              >
                {errors.server}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-200">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border backdrop-blur-sm text-white placeholder-gray-300 ${
                    errors.name ? "border-red-500" : "border-white/30"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-300">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border backdrop-blur-sm text-white placeholder-gray-300 ${
                    errors.email ? "border-red-500" : "border-white/30"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-300">{errors.email}</p>
                )}
              </div>

              <div className="relative">
                <label className="block mb-2 text-sm font-medium text-gray-200">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 pr-12 rounded-lg bg-white/10 border backdrop-blur-sm text-white placeholder-gray-300 ${
                    errors.password ? "border-red-500" : "border-white/30"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-300">{errors.password}</p>
                )}
                <div className="mt-2 text-xs text-gray-300">
                  Password must contain at least 8 characters, 1 uppercase
                  letter, 1 number, and 1 special character.
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                className={`relative w-full py-4 px-6 rounded-2xl font-semibold shadow-2xl backdrop-blur-xl border transition-all duration-300 overflow-hidden ${
                  isSubmitting
                    ? "bg-gray-500/20 border-gray-400/30 cursor-not-allowed text-gray-300"
                    : "bg-gradient-to-b from-white/25 to-white/15 border-white/40 hover:from-white/30 hover:to-white/20 hover:border-white/50 active:from-white/20 active:to-white/10 text-white"
                }`}
              >
                {/* Subtle inner glow */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none ${
                    isSubmitting ? "opacity-0" : "opacity-100"
                  }`}
                />

                {/* Button content */}
                <span className="relative z-10 drop-shadow-sm">
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </span>
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-200">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Image carousel section */}
          <div className="hidden md:block w-1/2 relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute inset-0"
              >
                <img
                  src={backgroundImages[currentImage]}
                  alt="Shoe Display"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40" />
              </motion.div>
            </AnimatePresence>

            {/* Image indicators */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {backgroundImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImage ? "bg-white w-6" : "bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Branding overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-white text-center">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.4,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  className="text-4xl font-bold mb-4 drop-shadow-lg"
                >
                  Step Into Style
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.6,
                    type: "spring",
                    stiffness: 100,
                    damping: 10,
                  }}
                  className="text-xl opacity-90 drop-shadow-lg"
                >
                  Discover the perfect pair for every occasion
                </motion.p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RegistrationPage;
