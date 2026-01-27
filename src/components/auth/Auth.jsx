import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

import Login from "./Login";
import Register from "./Register";
import Forgot from "./Forgot";
import Otp from "./Otp";
import Reset from "./Reset";

const Auth = () => {
  const [mode, setMode] = useState("login");
  const [otpFor, setOtpFor] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    userName: "",
    mobileNumber: "",
    email: "",
    password: "",
    otp: "",
    newPassword: "",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  /* ================= AUTH CHECK ================= */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/users/me") // ✅ token auto-attached
      .then((res) => {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        localStorage.clear();
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  /* ================= FORM HANDLER ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ================= LOADER ================= */
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-6 col-lg-4">

            {/* BRAND */}
            <div className="text-center mb-4">
              <h3 className="fw-semibold mb-1">Code Collab</h3>
              <p className="text-muted small mb-0">
                Collaborate. Build. Ship faster.
              </p>
            </div>

            {/* CARD */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">

                {mode === "login" && (
                  <Login
                    form={form}
                    onChange={handleChange}
                    setMode={setMode}
                  />
                )}

                {mode === "register" && (
                  <Register
                    form={form}
                    onChange={handleChange}
                    setMode={setMode}
                    setOtpFor={setOtpFor}
                  />
                )}

                {mode === "forgot" && (
                  <Forgot
                    form={form}
                    onChange={handleChange}
                    setMode={setMode}
                    setOtpFor={setOtpFor}
                  />
                )}

                {mode === "otp" && (
                  <Otp
                    form={form}
                    onChange={handleChange}
                    otpFor={otpFor}
                    setMode={setMode}
                  />
                )}

                {mode === "reset" && (
                  <Reset
                    form={form}
                    onChange={handleChange}
                    setMode={setMode}
                  />
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
