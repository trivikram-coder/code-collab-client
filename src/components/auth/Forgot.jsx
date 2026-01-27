import { useState } from "react";
import api from "../api/api";
import emailApi from "../api/emailApi";

const Forgot = ({ form, onChange, setMode, setOtpFor }) => {
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // 1️⃣ Check if email exists (200 = exists, 404 = not exists)
      await api.get(`/auth/users/check-email/${form.email}`);

      // 2️⃣ Send OTP
      await emailApi.post("/otp/send-otp", {
        email: form.email,
        appName: "Code Collab",
        type: "forget",
      });

      setOtpFor("forgot");
      setMode("otp");
    } catch (error) {
      if (error.response?.status === 404) {
        alert("Email not registered");
        return;
      }

      alert(
        error.response?.data?.message ||
          "Unable to send OTP. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="mb-3">Reset password</h5>

      <form onSubmit={sendOtp}>
        <input
          className="form-control mb-3"
          name="email"
          type="email"
          placeholder="Email address"
          onChange={onChange}
          required
        />

        <button
          className="btn btn-warning w-100"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>

      {/* BACK */}
      <div className="text-center mt-3">
        <span
          className="text-muted small"
          role="button"
          onClick={() => setMode("login")}
        >
          ← Back to login
        </span>
      </div>
    </>
  );
};

export default Forgot;
