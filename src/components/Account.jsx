import React, { useState, useEffect } from "react";
import api from "./api/api";
import { toast } from "react-toastify";

const Account = () => {
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user")) || null;

  const [user, setUser] = useState(storedUser);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(!storedUser);
  const [saving, setSaving] = useState(false);

  // Fetch fresh user from backend
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      const res = await api.put(
        `/auth/users/me/${user.id}`,
        user,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if(res.status===200){
        toast.success(`${res.data.message}`)
          setUser(res.data.updatedUser);
    
          // sync localStorage
          localStorage.setItem(
            "user",
            JSON.stringify(res.data.updatedUser)
        );
        localStorage.setItem("token",res.data.token)
        setEditing(false);
        setTimeout(()=>{
            window.location.reload()
        },2000)
    }
    

    } catch (err) {
        toast.error(err)
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!user) return <div className="text-center mt-5">User not found</div>;

  return (
    <div className="container-fluid bg-light min-vh-100 p-5">
      <div className="row justify-content-center">
        <div className="col-lg-7">

          {/* HEADER */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-body d-flex align-items-center gap-4">

              <div
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  background: "#0d6efd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "32px",
                }}
              >
                <i className="bi bi-person-fill"></i>
              </div>

              <div className="flex-grow-1">
                <h4 className="mb-1">{user.userName}</h4>
                <p className="text-muted mb-0">{user.email}</p>
              </div>

              <button
                className={`btn ${editing ? "btn-success" : "btn-outline-primary"}`}
                onClick={() => (editing ? saveChanges() : setEditing(true))}
                disabled={saving}
              >
                {editing ? (saving ? "Saving..." : "Save") : "Edit"}
              </button>

            </div>
          </div>

          {/* DETAILS */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-semibold">
              Account Details
            </div>

            <div className="card-body">

              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  className="form-control"
                  name="userName"
                  value={user.userName}
                  disabled={!editing}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  name="email"
                  value={user.email}
                  disabled={!editing}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Mobile</label>
                <input
                  className="form-control"
                  name="mobileNumber"
                  value={user.mobileNumber}
                  disabled={!editing}
                  onChange={handleChange}
                />
              </div>

              {!editing && (
                <small className="text-muted">
                  Click Edit to update your details
                </small>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Account;
