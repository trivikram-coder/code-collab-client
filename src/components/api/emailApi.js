import axios from "axios";

// Vite / CRA compatible
const EMAIL_BASE_URL =
  import.meta.env.VITE_EMAIL_API_URL

const emailApi = axios.create({
  baseURL: EMAIL_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ❌ No auth token here (OTP service doesn’t need it)
emailApi.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default emailApi;
