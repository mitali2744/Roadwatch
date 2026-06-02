import axios from "axios";

// Use env var in production, fallback to Render backend URL
const API_URL = import.meta.env.VITE_API_URL || "https://roadwatch-api-heur.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rw_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("rw_token");
    }
    return Promise.reject(err.response?.data || err);
  }
);
