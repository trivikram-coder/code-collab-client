import axios from "axios";

// Vite / CRA compatible
const BASE_URL =
  import.meta.env.VITE_API_URL
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach auth / reset token automatically
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("resetToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔁 Global auth failure handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if ([401, 403].includes(err.response?.status)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

export default api;
