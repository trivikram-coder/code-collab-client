import React, { useState, useMemo } from "react";
import "../styles/UsersList.css";
import socket from "../socket/socket";

const UsersList = ({ users = [], userName, roomId }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  // ----------------------------------
  // CURRENT USER
  // ----------------------------------
  const currentUser = useMemo(() => {
    return users.find((u) => u.userName === userName);
  }, [users, userName]);

  const isCurrentUserAdmin = currentUser?.role === "admin";

  // ----------------------------------
  // FIND ADMIN USER
  // ----------------------------------
  const adminUser = useMemo(() => {
    return users.find((u) => u.role === "admin");
  }, [users]);

  // ----------------------------------
  // CHANGE ROLE
  // ----------------------------------
  const assignRole = (targetUserName, role) => {
    if (!isCurrentUserAdmin) return;
    console.log("Users in room",targetUserName,role,adminUser)
    socket.emit("change-role", {
      admin:adminUser.userName,
      roomId,
      userName:targetUserName,
      role,
    });

    setOpenDropdown(null);
  };

  if (!users || users.length === 0) {
    return (
      <div className="users-empty text-muted">
        No users online
      </div>
    );
  }

  return (
    <div className="users-list-wrapper">
      <h6 className="users-title">👥 Online Users</h6>

      {/* 🔥 ADMIN DISPLAY */}
      {adminUser && (
        <div className="admin-display mb-2">
          👑 <strong>Admin:</strong> {adminUser.userName}
        </div>
      )}

      <ul className="users-list list-unstyled">
        {users.map((user) => {
          const isAdmin = user.role === "admin";
          const isCurrentUser = user.userName === userName;

          return (
            <li
              key={user._id}
              className={`users-item d-flex justify-content-between align-items-center ${
                isCurrentUser ? "active-user" : ""
              }`}
            >
              <div>
                <span className="user-dot">🟢</span>
                <span className="user-name ms-2">
                  {isAdmin && "👑 "}
                  {user.userName}
                  {isCurrentUser && " (You)"}
                  {" - "}
                  <small>{user.role}</small>
                </span>
              </div>

              {/* Only Admin Can Change Roles */}
              {isCurrentUserAdmin && !isAdmin && (
                <div className="dropdown">
                  <button
                    className="btn btn-sm btn-outline-light dropdown-toggle"
                    type="button"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === user._id ? null : user._id
                      )
                    }
                  >
                    Role
                  </button>

                  {openDropdown === user._id && (
                    <ul
                      className="dropdown-menu show"
                      style={{ position: "absolute" }}
                    >
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() =>
                            assignRole(user.userName, "editor")
                          }
                        >
                          ✏️ Editor
                        </button>
                      </li>

                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() =>
                            assignRole(user.userName, "viewer")
                          }
                        >
                          👁️ Viewer
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UsersList;
