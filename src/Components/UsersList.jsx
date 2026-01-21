import React from "react";
import "../styles/UsersList.css";

const UsersList = ({ users, userName }) => {
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

      <ul className="users-list">
        {users.map((user, index) => (
          <li
            key={index}
            className={`users-item ${user === userName ? "active-user" : ""}`}
          >
            <span className="user-dot">🟢</span>
            <span className="user-name">
              {user === userName ? `${user} (You)` : user}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UsersList;
