import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [mode, setMode] = useState("login"); 
  // login | register | forgot | otp | reset

  const [otpFor, setOtpFor] = useState(""); // register | forgot
  const navigate = useNavigate();

  const [form, setForm] = useState({
    userName: "",
    mobileNumber: "",
    email: "",
    password: "",
    otp: "",
    newPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /* ================= LOGIN ================= */
  const login = async () => {
    const res = await axios.post("http://localhost:3030/auth/login", {
      email: form.email,
      password: form.password,
    });
    if(res.status===200){

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
    }
  };

  /* ================= REGISTER ================= */
  const sendRegisterOtp = async () => {
    await axios.post("https://email.vkstore.site/otp/send-otp", {
      email: form.email,
      appName: "Code Collab",
      type: "register",
    });

    setOtpFor("register");
    setMode("otp");
  };

  const completeRegister = async () => {
    await axios.post("http://localhost:3030/auth/register", {
      userName: form.userName,
      mobileNumber: form.mobileNumber,
      email: form.email,
      password: form.password,
    });

    setMode("login");
  };

  /* ================= FORGOT ================= */
  const sendForgotOtp = async () => {
    await axios.post("https://email.vkstore.site/otp/send-otp", {
      email: form.email,
      appName: "Code Collab",
      type: "forgot",
    });

    setOtpFor("forgot");
    setMode("otp");
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    await axios.post(
      `https://email.vkstore.site/otp/verify-otp/${form.email}`,
      { otp: form.otp }
    );

    otpFor === "register" ? completeRegister() : setMode("reset");
  };

  /* ================= RESET PASSWORD ================= */
  const resetPassword = async () => {
    await axios.post(
      `http://localhost:3030/auth/users/reset-password/${form.email}`,
      { newPassword: form.newPassword }
    );
    setMode("login");
  };

  return (
    <div
      className="d-flex flex-column justify-content-between"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0d6efd,#6610f2)",
      }}
    >
      <div className="container d-flex justify-content-center align-items-center flex-grow-1">
        <div className="col-md-4">

          {/* BRAND */}
          <div className="text-center text-white mb-4">
            <h1 className="fw-bold">Code Collab</h1>
            <p className="opacity-75">Collaborate. Build. Ship faster.</p>
          </div>

          <div className="card shadow p-4 border-0">

            {/* LOGIN */}
            {mode === "login" && (
              <>
                <h5 className="mb-3">Sign in</h5>
                <input className="form-control mb-2" name="email" placeholder="Email" onChange={handleChange} />
                <input className="form-control mb-3" name="password" type="password" placeholder="Password" onChange={handleChange} />
                <button className="btn btn-primary w-100 mb-2" onClick={login}>Sign In</button>
                <div className="d-flex justify-content-between">
                  <small className="text-primary" role="button" onClick={() => setMode("register")}>Create account</small>
                  <small className="text-danger" role="button" onClick={() => setMode("forgot")}>Forgot?</small>
                </div>
              </>
            )}

            {/* REGISTER */}
            {mode === "register" && (
              <>
                <h5>Create account</h5>
                <input className="form-control mb-2" name="userName" placeholder="Username" onChange={handleChange} />
                <input className="form-control mb-2" name="mobileNumber" placeholder="Mobile" onChange={handleChange} />
                <input className="form-control mb-2" name="email" placeholder="Email" onChange={handleChange} />
                <input className="form-control mb-3" name="password" type="password" placeholder="Password" onChange={handleChange} />
                <button className="btn btn-success w-100" onClick={sendRegisterOtp}>Send OTP</button>
              </>
            )}

            {/* FORGOT */}
            {mode === "forgot" && (
              <>
                <h5>Reset password</h5>
                <input className="form-control mb-3" name="email" placeholder="Email" onChange={handleChange} />
                <button className="btn btn-warning w-100" onClick={sendForgotOtp}>Send OTP</button>
              </>
            )}

            {/* OTP */}
            {mode === "otp" && (
              <>
                <h5>Verify OTP</h5>
                <input className="form-control mb-3" name="otp" placeholder="Enter OTP" onChange={handleChange} />
                <button className="btn btn-info w-100" onClick={verifyOtp}>Verify</button>
              </>
            )}

            {/* RESET */}
            {mode === "reset" && (
              <>
                <h5>New password</h5>
                <input className="form-control mb-3" name="newPassword" type="password" placeholder="New password" onChange={handleChange} />
                <button className="btn btn-success w-100" onClick={resetPassword}>Update</button>
              </>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-white py-3 opacity-75">
        © {new Date().getFullYear()} Code Collab
      </footer>
    </div>
  );
};

export default Auth;
