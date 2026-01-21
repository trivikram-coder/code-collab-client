import React, { useEffect, useRef, useState } from "react";
import "../styles/Chat.css";

import socket from "../socket/socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const ChatComp = ({roomId,userName,chatOpen,chatUsers,onNewMessage}) => {
  const navigate = useNavigate();
  // const {roomId}=useParams()
  // const{state}=useLocation()
  // const userName=state?.userName
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  // const[chatUsers,setChatUsers]=useState([])
  // const [users, setUsers] = useState([]);

  const chatEndRef = useRef(null);

  // -------------------------
  // JOIN ROOM
  // -------------------------
  useEffect(() => {
    if (!roomId || !userName) return;

    socket.emit("join-room", { roomId, userName });

    return () => {
      socket.emit("leave-room", { roomId, userName });
    };
  }, [roomId, userName]);

  // -------------------------
  // SOCKET LISTENERS
  // -------------------------
  useEffect(() => {
    socket.on("room-users", (data) => {
      
      setUsersFromParent(data)
      setChatUsers(data)
     
    });

    socket.on("receive-message", (data) => {
 
      setChats(data.chats || []);
    });

    socket.on("new-message", (msg) => {
      setChats((prev) => [...prev, msg]);
      if(!chatOpen&&msg.userName!==userName){
       onNewMessage?.()
      }
    });

    return () => {
      socket.off("room-users");
      socket.off("receive-message");
      socket.off("new-message");
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
    if(!userName)return;
    socket.emit("send-message", {
      roomId,
      userName,
      message,
    });

    setMessage("");
  };

  // -------------------------
  // LEAVE ROOM
  // -------------------------
  const leaveRoomHandler = () => {
    socket.emit("leave-room", { roomId, userName });
    navigate("/");
  };

  return (
    <div className="chat-container">
      {/* HEADER */}
      <div className="chat-header">
        <h3>Room: {roomId}</h3>
        <div className="chat-header-right">
          <span className="show-user">{userName}</span>
          <span className="online-status">● Online</span>
          <button className="leave-btn" onClick={leaveRoomHandler}>
            Leave
          </button>
        </div>
      </div>

      {/* USERS LIST */}
      <div className="users-list">
        <h4>Collaborators</h4>
        {chatUsers.map((u, index) => (
          <div key={index} className="user-item">
            {u}
          </div>
        ))}
      </div>

      {/* CHAT MESSAGES */}
      <div className="chat-messages">
        {chats.map((chat, index) => (
          <div
            key={index}
            className={`message ${
              chat.userName === userName ? "sent" : "received"
            }`}
          >
            <span className="user">
              {chat.userName === userName ? "You" : chat.userName}
            </span>
            <p>{chat.message}</p>
          </div>
        ))}
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
