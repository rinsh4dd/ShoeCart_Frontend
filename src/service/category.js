import { URL } from "./api";

export const GetCategoryById = async (id) => {
  try {
    const res = await fetch(`${URL}/category/${id}`);
    if (!res.ok) throw new Error("Category not found");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching category:", err);
    return null;
  }
};

export const GetAllCategories= async (id) => {
  try {
    const res = await fetch(`${URL}/category`);
    if (!res.ok) throw new Error("Category not found");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error fetching category:", err);
    return null;
  }
};
