import { useState } from "react";
import api from "../api/api";
import { toast } from "react-toastify";

const Reset = ({ form, onChange, setMode }) => {
  const [show, setShow] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    if (form.newPassword !== confirm) {
      toast.info("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.put("/auth/users/reset-password", {
        newPassword: form.newPassword,
      });

      localStorage.removeItem("resetToken");
      toast.success("Password updated successfully")
      setMode("login");
    } catch (error) {
      toast.info(
        error.response?.data?.message || "Password reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h5>New password</h5>

      <div className="input-group mb-2">
        <input
          className="form-control"
          type={show ? "text" : "password"}
          name="newPassword"
          placeholder="New password"
          onChange={onChange}
          required
        />
        <span className="input-group-text" role="button" onClick={() => setShow(!show)}>
          <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
        </span>
      </div>

      <input
        className="form-control mb-3"
        type={show ? "text" : "password"}
        placeholder="Confirm password"
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      <button className="btn btn-success w-100" onClick={reset} disabled={loading}>
        {loading ? "Updating..." : "Update Password"}
      </button>
    </>
  );
};

export default Reset;
