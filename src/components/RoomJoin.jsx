import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RoomJoin = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <form
        className="card p-4 shadow"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/editor/${roomId}`, { state: { userName } });
        }}
      >
        <h4 className="mb-3 text-center">Join Room</h4>

        <input
          className="form-control mb-2"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <input
          className="form-control mb-3"
          placeholder="Username"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button className="btn btn-primary w-100">Join</button>
      </form>
    </div>
  );
};

export default RoomJoin;
