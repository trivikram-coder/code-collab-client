import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Layout = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const user = { name: storedUser?.userName || "Guest", email: storedUser?.email || "guest@email.com" };

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    toast.success("Logged out successfully!");
    navigate("/");
  };

  return (
    <div className="container-fluid" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="row vh-100">

        {/* SIDEBAR */}
        <div
          className="col-2 d-flex flex-column p-3"
          style={{
            minHeight: "100vh",
            backgroundColor: "#1f1f1f",
            boxShadow: "3px 0 10px rgba(0,0,0,0.5)",
            borderRadius: "0 15px 15px 0",
            color: "#fff",
          }}
        >
          <h3 className="fw-bold mb-4 text-center text-light">⚡ CodeCollab</h3>

          <div className="mb-4 text-center">
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                margin: "0 auto 5px",
                color: "#fff",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: "0.9rem", color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{user.email}</div>
          </div>

          <ul className="nav flex-column gap-3 mt-3">
            <li className="nav-item fw-semibold p-2 rounded">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `p-2 rounded d-block text-decoration-none ${
                    isActive ? "bg-dark text-white" : "text-light"
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item fw-semibold p-2 rounded">
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `p-2 rounded d-block text-decoration-none ${
                    isActive ? "bg-dark text-white" : "text-light"
                  }`
                }
              >
                Profile
              </NavLink>
            </li>
            <li
              className="nav-item fw-semibold mt-auto p-2 rounded text-center text-danger"
              style={{ cursor: "pointer" }}
              onClick={() => setShowLogoutModal(true)}
            >
              Logout
            </li>
          </ul>
        </div>

        {/* MAIN CONTENT (Light) */}
        <div
          className="col-10 bg-light p-4 overflow-auto rounded-start"
          style={{ color: "#000" }}
        >
          <Outlet />
        </div>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-sm rounded-4" style={{ backgroundColor: "#2c2c2c", color: "#fff" }}>
                <div className="modal-header border-0">
                  <h5 className="modal-title text-danger">Confirm Logout</h5>
                  <button className="btn-close btn-close-white" onClick={() => setShowLogoutModal(false)} />
                </div>
                <div className="modal-body">Are you sure you want to logout?</div>
                <div className="modal-footer border-0">
                  <button
                    className="btn btn-secondary rounded-3"
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger rounded-3"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}></div>
        </>
      )}
    </div>
  );
};

export default Layout;
