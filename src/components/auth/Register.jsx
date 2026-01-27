import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/api";

const Login = ({ form, onChange, setMode }) => {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const login = async () => {
    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      alert(
        error.response?.data?.message || "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5 className="mb-3">Login</h5>

      <input
        className="form-control mb-3"
        name="email"
        placeholder="Email"
        onChange={onChange}
        required
      />

      <div className="input-group mb-3">
        <input
          className="form-control"
          name="password"
          type={showPass ? "text" : "password"}
          placeholder="Password"
          onChange={onChange}
          required
        />
        <span
          className="input-group-text"
          role="button"
          onClick={() => setShowPass(!showPass)}
        >
          <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
        </span>
      </div>

      <button
        className="btn btn-primary w-100 mb-2"
        disabled={loading}
        onClick={login}
      >
        {loading ? "Logging in..." : "Login"}
      </button>

      <div className="d-flex justify-content-between">
        <small role="button" onClick={() => setMode("register")}>
          Create account
        </small>
        <small role="button" onClick={() => setMode("forgot")}>
          Forgot?
        </small>
      </div>
    </>
  );
};

export default Login;
