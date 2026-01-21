import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!userName.trim() || !roomId.trim()) {
      alert("Enter username and room id");
      return;
    }

    // 🔥 persist user
    localStorage.setItem("userName", userName.trim());

    // navigate safely
    navigate(`/editor/${roomId.trim()}`,{state:{userName}});
  };

  return (
    <div className="container-fluid min-vh-100 bg-light">
      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">CodeSync</span>
        <button
          className="btn btn-outline-light"
          data-bs-toggle="modal"
          data-bs-target="#roomModal"
        >
          ➕ Create / Join
        </button>
      </nav>

      {/* HERO */}
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm p-5 text-center">
              <h2 className="mb-3">Realtime Code Collaboration</h2>
              <p className="text-muted mb-4">
                Join a room and start coding together instantly.
              </p>

              <button
                className="btn btn-primary btn-lg"
                data-bs-toggle="modal"
                data-bs-target="#roomModal"
              >
                Get Started 🚀
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <div
        className="modal fade"
        id="roomModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create / Join Room</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              ></button>
            </div>

            <div className="modal-body d-flex flex-column gap-3">
              <input
                type="text"
                className="form-control"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />

              <input
                type="text"
                className="form-control"
                placeholder="Enter room id"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-success w-100"
                data-bs-dismiss="modal"
                onClick={handleJoin}
              >
                🔗 Create / Join
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center text-muted mt-5 pb-3">
        Built with ❤️ using React & Bootstrap
      </footer>
    </div>
  );
};

export default Dashboard;
