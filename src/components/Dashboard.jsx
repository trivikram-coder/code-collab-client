import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const user = { name: storedUser?.userName || "Guest", email: storedUser?.email || "guest@email.com" };

  /* ---------------- Logout Modal ---------------- */
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    toast.info("Logged out successfully!");
    navigate("/");
  };

  /* ---------------- Recent Rooms ---------------- */
  const [recentRooms, setRecentRooms] = useState([]);
  useEffect(() => {
    const rooms = Object.keys(localStorage)
      .filter((key) => key.startsWith("room:"))
      .map((key) => ({ id: key.replace("room:", ""), name: localStorage.getItem(key) }));
    setRecentRooms(rooms);
  }, []);

  /* ---------------- Room Modal ---------------- */
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("");
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
    if (!userName.trim()) return;
    if (mode === "create" && !roomName.trim()) return;
    if (mode === "join" && !roomId.trim()) return;

    const finalRoomId = mode === "create" ? uniqueId : roomId;
    if (mode === "create") localStorage.setItem(`room:${uniqueId}`, roomName);

    toast.success(`${mode === "create" ? "Room created" : "Joined room"}!`);
    navigate(`/editor/${finalRoomId}`, { state: { userName, roomName: mode === "create" ? roomName : null } });
    setShowModal(false);
  };

  const joinRecentRoom = (id) => {
    toast.info("Joining recent room...");
    navigate(`/editor/${id}`, { state: { userName } });
  };

  return (
    <div className="container-fluid" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="row vh-100">


        {/* MAIN */}
        <div className="col-10 bg-light p-4 overflow-auto rounded-start">
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0" style={{ fontWeight: 600 ,color:"black"}}>Welcome back, {user.name} 👋</h4>
              <small className="text-muted">{user.email}</small>
            </div>
            <span className="badge bg-success px-3 py-2" style={{ fontSize: "0.9rem" }}>🟢 Online</span>
          </div>

          {/* ACTION CARDS */}
          <div className="row mb-4 g-4">
            {["create", "join"].map((m, i) => (
              <div className="col-md-6" key={i}>
                <div
                  className="card shadow-sm h-100 border-0 rounded-4"
                  role="button"
                  onClick={() => openModal(m)}
                  style={{ cursor: "pointer", transition: "0.3s", backgroundColor: "#ffffff" }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0px)"}
                >
                  <div className="card-body">
                    <h5>{m === "create" ? "➕ Create Room" : "🔗 Join Room"}</h5>
                    <p className="text-muted mb-0">{m === "create" ? "Start a new collaborative coding room" : "Enter an existing room using Room ID"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RECENT ROOMS */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header fw-bold bg-white rounded-top-4">Recent Rooms</div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Room Name</th>
                    <th>Room ID</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRooms.length === 0 ? (
                    <tr><td colSpan="3" className="text-center text-muted p-3">No recent rooms yet</td></tr>
                  ) : (
                    recentRooms.map((room, i) => (
                      <tr key={i}>
                        <td>{room.name}</td>
                        <td className="text-muted">{room.id}</td>
                        <td><button className="btn btn-sm btn-primary" onClick={() => joinRecentRoom(room.id)}>Join</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
      {/* Room Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-sm rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title">{mode === "create" ? "Create Room" : "Join Room"}</h5>
                  <button className="btn-close" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input className="form-control rounded-3" value={userName} onChange={(e) => setUserName(e.target.value)} />
                  </div>
                  {mode === "create" && (
                    <div className="mb-3">
                      <label className="form-label">Room Name</label>
                      <input className="form-control rounded-3" placeholder="Eg: React Pair Programming" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Room ID</label>
                    <input className="form-control rounded-3" value={roomId} disabled={mode === "create"} onChange={(e) => setRoomId(e.target.value)} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary rounded-3" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary rounded-3" onClick={joinRoom}>{mode === "create" ? "Create" : "Join"}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-sm rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title text-danger">Confirm Logout</h5>
                  <button className="btn-close" onClick={() => setShowLogoutModal(false)} />
                </div>
                <div className="modal-body">Are you sure you want to logout?</div>
                <div className="modal-footer">
                  <button className="btn btn-secondary rounded-3" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                  <button className="btn btn-danger rounded-3" onClick={logout}>Logout</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
