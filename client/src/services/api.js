import axios from "axios";

const API = axios.create({ baseURL: "/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);
export const getMe = () => API.get("/auth/me");

// Products
export const getProducts = () => API.get("/products");
export const getProduct = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Warehouses
export const getWarehouses = () => API.get("/warehouses");
export const getWarehouse = (id) => API.get(`/warehouses/${id}`);
export const createWarehouse = (data) => API.post("/warehouses", data);
export const updateWarehouse = (id, data) =>
  API.put(`/warehouses/${id}`, data);
export const deleteWarehouse = (id) => API.delete(`/warehouses/${id}`);

// Stock Movements
export const getMovements = () => API.get("/stock-movements");
export const createMovement = (data) => API.post("/stock-movements", data);
