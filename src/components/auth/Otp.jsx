import api from "../api/api";
import emailApi from "../api/emailApi";

const Otp = ({ form, onChange, otpFor, setMode }) => {
  const verify = async () => {
    try {
      const res = await emailApi.post(
        `/otp/verify-otp/${form.email}`,
        { otp: form.otp }
      );

      // forgot flow → store reset token
      if (otpFor === "forgot") {
        localStorage.setItem("resetToken", res.data.resetToken);
        setMode("reset");
        return;
      }

      // register flow
      await api.post("/auth/register", form);
      setMode("login");
    } catch (error) {
      alert(
        error.response?.data?.message || "Invalid OTP"
      );
    }
  };

  return (
    <>
      <h5>Verify OTP</h5>
      <input
        className="form-control mb-3"
        name="otp"
        placeholder="OTP"
        onChange={onChange}
        required
      />
      <button className="btn btn-info w-100" onClick={verify}>
        Verify
      </button>
    </>
  );
};

export default Otp;
