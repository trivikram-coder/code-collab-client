import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));

const user = {
  name: storedUser?.userName,
  email: storedUser?.email,
};

const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem('token')
  navigate("/");
};


  const recentRooms = [
    { id: "react101", lastUsed: "2 hrs ago" },
    { id: "node-live", lastUsed: "Yesterday" },
    { id: "collab-x", lastUsed: "3 days ago" },
  ];

  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState(""); // create | join
  const [roomId, setRoomId] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState(user.name);

  const openModal = (type) => {
    setMode(type);

    if (type === "create") {
      const id = crypto.randomUUID();
      setUniqueId(id);
      setRoomId(id);
      setRoomName("");
    } else {
      setRoomId("");
      setUniqueId("");
      setRoomName("");
    }

    setShowModal(true);
  };

  const joinRoom = () => {
    if (!userName) return;

    if (mode === "create" && !roomName.trim()) return;
    if (mode === "join" && !roomId.trim()) return;

    const finalRoomId = mode === "create" ? uniqueId : roomId;
    if (mode === "create") {
  localStorage.setItem(`room:${uniqueId}`, roomName);
}
    navigate(`/editor/${finalRoomId}`, {
      state: {
        userName,
        roomName: mode === "create" ?roomName:null,
      },
    });

    setShowModal(false);
    setRoomId("");
    setRoomName("");
  };

  const joinRecentRoom = (id) => {
    navigate(`/editor/${id}`, {
      state: { userName },
    });
  };

  return (
    <>
    {!storedUser?(
      <div
    className="d-flex justify-content-center align-items-center"
    style={{ minHeight: "100vh", background: "#f8f9fa" }}
  >
    <div
      className="card shadow-sm border-0 p-4 text-center"
      style={{ maxWidth: "420px", width: "100%" }}
    >
      <h4 className="mb-2 text-danger">Authentication Required</h4>

      <p className="text-muted mb-4">
        You must be logged in to access the dashboard.
      </p>

      <button
        className="btn btn-primary w-100"
        onClick={() => navigate("/")}
      >
        Go to Login
      </button>
    </div>
  </div>
    ):(
      <div className="container-fluid">
      <div className="row vh-100">

        {/* SIDEBAR */}
        <div className="col-2 bg-dark text-white p-3">
          <h4 className="fw-bold mb-4">⚡ CodeCollab</h4>
          <ul className="nav flex-column gap-2">
            <li className="nav-item fw-semibold">Dashboard</li>
            <li className="nav-item text-muted">Rooms</li>
            <li className="nav-item text-muted">Profile</li>
            <li className="nav-item text-danger mt-4" onClick={logout}>Logout</li>
          </ul>
        </div>

        {/* MAIN */}
        <div className="col-10 bg-light p-4">

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">Welcome back, {user.name} 👋</h4>
              <small className="text-muted">{user.email}</small>
            </div>
            <span className="badge bg-success px-3 py-2">🟢 Online</span>
          </div>

          {/* ACTION CARDS */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div
                className="card shadow-sm h-100 cursor-pointer"
                role="button"
                onClick={() => openModal("create")}
              >
                <div className="card-body">
                  <h5>➕ Create Room</h5>
                  <p className="text-muted mb-0">
                    Start a new collaborative coding room
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="card shadow-sm h-100 cursor-pointer"
                role="button"
                onClick={() => openModal("join")}
              >
                <div className="card-body">
                  <h5>🔗 Join Room</h5>
                  <p className="text-muted mb-0">
                    Enter an existing room using Room ID
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT ROOMS */}
          <div className="card shadow-sm">
            <div className="card-header fw-bold">Recent Rooms</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Room ID</th>
                    <th>Last Active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRooms.map((room, i) => (
                    <tr key={i}>
                      <td>{room.id}</td>
                      <td className="text-muted">{room.lastUsed}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => joinRecentRoom(room.id)}
                        >
                          Join
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {mode === "create" ? "Create Room" : "Join Room"}
                  </h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body">

                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                  </div>

                  {mode === "create" && (
                    <div className="mb-3">
                      <label className="form-label">Room Name</label>
                      <input
                        className="form-control"
                        placeholder="Eg: React Pair Programming"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Room ID</label>
                    <input
                      className="form-control"
                      value={roomId}
                      disabled={mode === "create"}
                      placeholder="Enter room id"
                      onChange={(e) => setRoomId(e.target.value)}
                    />
                  </div>

                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={joinRoom}
                  >
                    {mode === "create" ? "Create" : "Join"}
                  </button>
                </div>

              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
    )
  
  }
    
    </>
  );
};

export default Dashboard;
