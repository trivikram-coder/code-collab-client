import React, { useState } from "react";
import socket from "../socket/socket";

const Test = () => {
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [mode, setMode] = useState("");

  const createRoom = (e) => {
    e.preventDefault(); // 🔥 FIX
    socket.emit("create-room", {
      roomId,
      roomName,
      userName,
    });
  };

  const joinRoom = (e) => {
    e.preventDefault(); // 🔥 FIX
    socket.emit("join-room", {
      roomId,
      userName,
    });
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          className={`btn ${mode === "create" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setMode("create")}
        >
          Create Room
        </button>
        <button
          className={`btn ${mode === "join" ? "btn-success" : "btn-outline-success"}`}
          onClick={() => setMode("join")}
        >
          Join Room
        </button>
      </div>

      {mode === "create" && (
        <div className="card p-4 shadow mx-auto" style={{ maxWidth: "400px" }}>
          <h5 className="text-center mb-3">Create Room</h5>
          <form onSubmit={createRoom}>
            <input
              className="form-control mb-3"
              type="text"
              placeholder="Enter Room ID"
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              type="text"
              placeholder="Enter Room Name"
              onChange={(e) => setRoomName(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              type="text"
              placeholder="Enter Username"
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <button className="btn btn-primary w-100" type="submit">
              Create Room
            </button>
          </form>
        </div>
      )}

      {mode === "join" && (
        <div className="card p-4 shadow mx-auto" style={{ maxWidth: "400px" }}>
          <h5 className="text-center mb-3">Join Room</h5>
          <form onSubmit={joinRoom}>
            <input
              className="form-control mb-3"
              type="text"
              placeholder="Enter Room ID"
              onChange={(e) => setRoomId(e.target.value)}
              required
            />
            <input
              className="form-control mb-3"
              type="text"
              placeholder="Enter Username"
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <button className="btn btn-success w-100" type="submit">
              Join Room
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Test;
