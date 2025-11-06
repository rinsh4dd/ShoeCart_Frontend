import React, { useEffect, useState } from "react";
import ProductListCard from "../../../common/components/card/ProductListCard";
import { FilterProducts } from "../../../service/product"; // 👈 backend API call
import ShoeCartLoader from "../../../common/ui/Loader";

function Products() {
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [limit, setLimit] = useState(20);
  const [activeCat, setActiveCat] = useState("All");
  const [showMenu, setShowMenu] = useState(false);

  // ✅ Category list with IDs
  const categories = [
    { id: "All", name: "All" },
    { id: 9, name: "Men" },
    { id: 10, name: "Women" },
    { id: 11, name: "Kids" },
    { id: 12, name: "Running" },
    { id: 13, name: "Football" },
    { id: 14, name: "Casual" },
  ];

  // ✅ Fetch filtered data from backend
  useEffect(() => {
    const fetchFiltered = async () => {
      try {
        setLoading(true);

        const params = {
          name: search || "",
          categoryId: activeCat !== "All" ? activeCat : "",
          brand: "",
          page: 1,
          pageSize: limit,
          descending: sort === "desc",
        };

        const data = await FilterProducts(params);
        setFilteredItems(data);
      } catch (err) {
        console.error("Error fetching filtered products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiltered();
  }, [search, sort, limit, activeCat]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* 🔍 Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full sm:w-1/2 border border-gray-300 rounded-full py-2 px-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 🏷️ Categories & Filter Menu */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`py-2 px-4 whitespace-nowrap rounded-full border text-sm font-medium capitalize transition ${
                activeCat === cat.id
                  ? "bg-black text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ⚙️ Filter Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="py-2 px-4 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800"
          >
            Filter
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 z-20 bg-white shadow-xl rounded-lg p-4 w-52 text-sm">
              <div className="mb-2">
                <p className="text-xs font-bold text-gray-500 mb-1">
                  Sort by Price
                </p>
                <button
                  onClick={() => {
                    setSort("asc");
                    setShowMenu(false);
                  }}
                  className="w-full text-left py-1 hover:bg-gray-100 rounded"
                >
                  Low to High
                </button>
                <button
                  onClick={() => {
                    setSort("desc");
                    setShowMenu(false);
                  }}
                  className="w-full text-left py-1 hover:bg-gray-100 rounded"
                >
                  High to Low
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1">Limit</p>
                {[5, 10, 20, 50].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLimit(l);
                      setShowMenu(false);
                    }}
                    className="w-full text-left py-1 hover:bg-gray-100 rounded"
                  >
                    Show {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🧾 Product Grid */}
      <div className="min-h-[400px]">
        {loading ? (
          <ShoeCartLoader />
        ) : filteredItems.length > 0 ? (
          <div className="grid gap-6 justify-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((p) => (
              <ProductListCard
                key={p.id}
                id={p.id}
                image={p.imageUrls?.[0] || "/images/fallback-product.png"} // safe access
                name={p.name}
                special_offer={p.specialOffer}
                price={p.price}
                category={p.categoryName}
                brand={p.brand}
                in_stock={p.inStock}
                currentStock={p.currentStock}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
