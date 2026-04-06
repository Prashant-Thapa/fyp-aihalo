import api from "./axios";

// Get all products
export const getAllProducts = async (storeLocationId = null, category = null) => {
  const params = {};
  if (storeLocationId) params.storeLocationId = storeLocationId;
  if (category) params.category = category;
  
  const response = await api.get("/products", { params });
  return response.data;
};

// Get product by ID
export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Create product (admin only) - with FormData for file upload
export const createProduct = async (productData, imageFile) => {
  const formData = new FormData();
  
  // Append product fields
  formData.append("name", productData.name);
  formData.append("price", productData.price);
  formData.append("category", productData.category);
  formData.append("storeLocationId", productData.storeLocationId);
  
  if (productData.description) {
    formData.append("description", productData.description);
  }
  if (productData.stock !== undefined) {
    formData.append("stock", productData.stock);
  }
  
  // Append image file if provided
  if (imageFile) {
    formData.append("image", imageFile);
  }
  
  const response = await api.post("/products", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Get my products (admin only)
export const getMyProducts = async () => {
  const response = await api.get("/products/admin/my-products");
  return response.data;
};

// Update product (admin only) - with FormData for file upload
export const updateProduct = async (id, productData, imageFile) => {
  const formData = new FormData();
  
  // Append product fields
  if (productData.name) formData.append("name", productData.name);
  if (productData.price) formData.append("price", productData.price);
  if (productData.category) formData.append("category", productData.category);
  if (productData.description !== undefined) formData.append("description", productData.description);
  if (productData.stock !== undefined) formData.append("stock", productData.stock);
  if (productData.isActive !== undefined) formData.append("isActive", productData.isActive);
  
  // Append image file if provided
  if (imageFile) {
    formData.append("image", imageFile);
  }
  
  const response = await api.put(`/products/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Delete product (admin only)
export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
