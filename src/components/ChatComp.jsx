import React, { useEffect, useRef, useState } from "react";
import "../styles/Chat.css";
import socket from "../socket/socket";
import { useNavigate } from "react-router-dom";

const ChatComp = ({
  roomId,
  userName,
  roomName,
  chatOpen,
  chatUsers,
  onNewMessage,
}) => {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const chatEndRef = useRef(null);

  // -------------------------
  // JOIN ROOM
  // -------------------------
  useEffect(() => {
    if (!roomId || !userName) return;

    socket.emit("join-room", { roomId, roomName, userName });

    return () => {
      socket.emit("leave-room", { roomId, userName });
    };
  }, [roomId, userName, roomName]);

  // -------------------------
  // SOCKET LISTENERS
  // -------------------------
  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setChats(data.chats || []);
    };

    const handleNewMessage = (msg) => {
      setChats((prev) => [...prev, msg]);

      const sender = msg.userName || msg.user;

      if (!chatOpen && sender !== userName) {
        onNewMessage?.();
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("new-message", handleNewMessage);
    };
  }, [chatOpen, userName, onNewMessage]);

  // -------------------------
  // AUTO SCROLL
  // -------------------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // -------------------------
  // SEND MESSAGE
  // -------------------------
  const sendMessage = () => {
    if (!message.trim()) return;
    if (!userName) return;

    socket.emit("send-message", {
      roomId,
      userName,
      message,
    });

    setMessage("");
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <h3>Room: {roomName}</h3>
        <div className="chat-header-right">
          <span className="show-user">{userName}</span>
          <span className="online-status">● Online</span>
        </div>
      </div>

      {/* USERS LIST */}
      <div className="users-list">
        <h4>Collaborators</h4>
        {chatUsers?.map((u) => (
          <div key={u._id || u.userName} className="user-item">
            {u.role === "admin" && "👑 "}
            {u.userName}
          </div>
        ))}
      </div>

      {/* CHAT MESSAGES */}
      <div className="chat-messages">
        {chats.map((chat, index) => {
          const sender = chat.userName || chat.user;
          const isCurrentUser = sender === userName;

          return (
            <div
              key={index}
              className={`message ${isCurrentUser ? "sent" : "received"}`}
            >
              <span className="user">
                {isCurrentUser ? "You" : sender}
              </span>
              <p>{chat.message}</p>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComp;
