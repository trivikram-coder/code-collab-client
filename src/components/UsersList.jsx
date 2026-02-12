import React, { useState, useMemo } from "react";
import "../styles/UsersList.css";
import socket from "../socket/socket";

const UsersList = ({ users = [], userName, roomId }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const currentUser = useMemo(() => {
    return users.find((u) => u.userName === userName);
  }, [users, userName]);

  const isCurrentUserAdmin = currentUser?.role === "admin";

  const adminUser = useMemo(() => {
    return users.find((u) => u.role === "admin");
  }, [users]);

  const assignRole = (targetUserName, role) => {
    if (!isCurrentUserAdmin) return;

    socket.emit("change-role", {
      admin: adminUser?.userName,
      roomId,
      userName: targetUserName,
      role,
    });

    setOpenDropdown(null);
  };

  if (!users.length) {
    return (
      <div className="users-empty">
        🚫 No users online
      </div>
    );
  }

  return (
    <div className="users-panel">
      
      {/* Header */}
      <div className="users-header">
        <h6>👥 Online Users</h6>
        <span className="users-count">{users.length}</span>
      </div>

      {/* Admin */}
      {adminUser && (
        <div className="admin-box">
          👑 <span>Admin:</span> {adminUser.userName}
        </div>
      )}

      {/* Users List */}
      <ul className="users-list">
        {users.map((user) => {
          const isAdmin = user.role === "admin";
          const isCurrentUser = user.userName === userName;

          return (
            <li
              key={user._id}
              className={`user-card ${isCurrentUser ? "current-user" : ""}`}
            >
              <div className="user-left">
                <span className="online-dot"></span>

                <span className="user-name">
                  {isAdmin && "👑 "}
                  {user.userName}
                  {isCurrentUser && " (You)"}
                </span>

                <span
                  className={`role-badge ${
                    isAdmin
                      ? "role-admin"
                      : user.role === "editor"
                      ? "role-editor"
                      : "role-viewer"
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {isCurrentUserAdmin && !isAdmin && (
                <button
                  className="change-btn"
                  onClick={() =>
                    assignRole(
                      user.userName,
                      user.role === "viewer" ? "editor" : "viewer"
                    )
                  }
                >
                  Change
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UsersList;
