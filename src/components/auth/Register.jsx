import { useState } from "react";
import api from "../api/api";
import emailApi from "../api/emailApi";
import { toast } from "react-toastify";

const Register = ({ form, onChange, setMode, setOtpFor }) => {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // 200 = exists → block
      await api.get(`/auth/users/check-email/${form.email}`);
      toast.info("Email already registered");
    } catch (error) {
      // 404 = not registered → proceed
      if (error.response?.status !== 404) {
        toast.error("Unable to verify email");
        return;
      }

      await emailApi.post("/otp/send-otp", {
        email: form.email,
        appName: "Code Collab",
        type: "register",
      });

      setOtpFor("register");
      setMode("otp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="mb-3">Create account</h5>

      <form onSubmit={sendOtp}>
        <input className="form-control mb-3" name="userName" placeholder="Full name" onChange={onChange} required />
        <input className="form-control mb-3" name="mobileNumber" placeholder="Mobile number" onChange={onChange} required />
        <input className="form-control mb-3" name="email" placeholder="Email address" onChange={onChange} required />

        <div className="input-group mb-3">
          <input
            className="form-control"
            name="password"
            type={showPass ? "text" : "password"}
            placeholder="Password"
            onChange={onChange}
            required
          />
          <span className="input-group-text" role="button" onClick={() => setShowPass(!showPass)}>
            <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
          </span>
        </div>

        <button className="btn btn-primary w-100 mb-3" type="submit" disabled={loading}>
          {loading ? "Sending OTP..." : "Continue"}
        </button>
      </form>

      <div className="text-center">
        <span role="button" className="text-muted small" onClick={() => setMode("login")}>
          ← Back to login
        </span>
      </div>
    </>
  );
};

export default Register;
