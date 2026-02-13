import React, { useState, useEffect } from "react";
import EditorComp from "./EditorComp";
import ChatComp from "./ChatComp";
import "../styles/EditorMain.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import socket from "../socket/socket";
import { toast } from "react-toastify";

const EditorMain = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { state } = useLocation();

  const [userName, setUserName] = useState(state?.userName || "");
  const [roomName, setRoomName] = useState(state?.roomName || "");

  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);

  const activeFile = files.find((f) => f.id === activeFileId);
  const currentUser = users.find((u) => u.userName === userName);
  const currentRole = currentUser?.role;

  /* ============================= */
  /* 🔥 HELPERS                   */
  /* ============================= */

  const detectLanguage = (filename) => {
    const ext = filename.split(".").pop()?.toLowerCase();

    const map = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      html: "html",
      css: "css",
      json: "json",
    };

    return map[ext] || "plaintext";
  };

  const setActive = (id) => {
    setActiveFileId(id);
    localStorage.setItem(`activeFile_${roomId}`, id);
  };

  /* ============================= */
  /* 🔥 FILE ACTIONS              */
  /* ============================= */

  const createFile = () => {
    if (!currentRole || currentRole === "viewer") {
      toast.warning("You are not allowed to add files");
      return;
    }

    const name = prompt("Enter file name (example: app.js)");
    if (!name) return;

    const newFile = {
      id: crypto.randomUUID(),
      name,
      language: detectLanguage(name),
      content: "",
      createdBy: userName,
      version:0
    };

    socket.emit("file-create", { roomId, userName, file: newFile });
  };

  const deleteFile = (id) => {
    if (!currentRole || currentRole === "viewer") {
      toast.warning("You are not allowed to delete files");
      return;
    }
    const existsFile=files.find(file=>file.id===id);
    if(existsFile.createdBy!==userName){
      toast.warning("You are not allowed to delete this file")
      return;
    }
    socket.emit("file-delete", {
      roomId,
      fileId: id,
      userName,
    });
  };
  useEffect(()=>{
    socket.off("joined-user");
    const handleJoinedUserAlert=(data)=>{
      toast.info(data.message)
    }
    socket.on("joined-user",handleJoinedUserAlert)
    return ()=>{
      socket.off("joined-user",handleJoinedUserAlert)
    }
  },[])
  /* ============================= */
  /* 🔥 SOCKET: JOIN ROOM         */
  /* ============================= */

  useEffect(() => {
    if (!roomId || !userName) return;

    const joinRoom = () => {
      socket.emit("join-room", { roomId, roomName, userName });
    };

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    socket.on("room-details", (data) => {
      setRoomName(data.roomName);
      setUserName(data.userName);
    });

    socket.on("room-users", (data) => {
      setUsers(data);
    });

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room-details");
      socket.off("room-users");
    };
  }, [roomId, userName]);

  /* ============================= */
  /* 🔥 SOCKET: FILE EVENTS       */
  /* ============================= */

  useEffect(() => {
    socket.on("file-created", (filesFromServer) => {
      setFiles(filesFromServer);

      if (!activeFileId && filesFromServer.length > 0) {
        setActive(filesFromServer[0].id);
      }
    });

    socket.on("file-content-updated", ({ fileId, content }) => {
      
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, content } : file
        )
      );
    });

    socket.on("file-deleted", (updatedFiles) => {
      setFiles(updatedFiles);

      if (!updatedFiles.find((f) => f.id === activeFileId)) {
        setActive(updatedFiles[0]?.id || null);
      }
    });

    return () => {
      socket.off("file-created");
      socket.off("file-content-updated");
      socket.off("file-deleted");
    };
  }, [activeFileId]);

  /* ============================= */
  /* 🔥 LOAD ACTIVE FILE          */
  /* ============================= */

  useEffect(() => {
    const saved = localStorage.getItem(`activeFile_${roomId}`);
    if (saved) setActiveFileId(saved);
  }, [roomId]);

  /* ============================= */
  /* 🔥 RENDER                    */
  /* ============================= */

  if (!userName || !roomId) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <div className="card p-4 text-center">
          <p className="text-danger">Please enter a valid room</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/dashboard")}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid editor-main-wrapper">
      <div className="row vh-100">
        {/* FILE SIDEBAR */}
        <div className="col-2 p-0 file-sidebar">
          <div className="file-header">
            <span>FILES</span>
            <button className="add-file-btn" onClick={createFile}>
              ＋
            </button>
          </div>

          <div className="file-list">
            {files.map((file) => (
              <div
                key={file.id}
                className={`file-item ${
                  file.id === activeFileId ? "active" : ""
                }`}
                onClick={() => setActive(file.id)}
              >
                <div className="file-name">
                  {file.name}{" "}
                  <span className="file-user">— {file.createdBy}</span>
                </div>

                <Trash
                  size={16}
                  className="delete-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* EDITOR */}
        <div className="col-10 p-0 editor-section">
          {activeFile ? (
            <EditorComp
              fileId={activeFile.id}
              roomId={roomId}
              roomName={roomName}
              userName={userName}
              code={activeFile.content}
              language={activeFile.language}
              users={users}
            />
          ) : (
            <div className="no-file">
              Create or select a file to start coding
            </div>
          )}
        </div>
      </div>

      {/* CHAT BUTTON */}
      <button
        className="chat-float-btn"
        onClick={() => {
          setShowChat(true);
          setUnreadCount(0);
        }}
      >
        💬
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* CHAT MODAL */}
      {showChat && (
        <>
          <div className="modal fade show d-block chat-modal">
            <div className="modal-dialog modal-dialog-end modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Room Chat ({users.length} online)</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowChat(false)}
                  ></button>
                </div>

                <div className="modal-body p-0">
                  <ChatComp
                    roomId={roomId}
                    roomName={roomName}
                    userName={userName}
                    chatUsers={users}
                    onNewMessage={() =>
                      setUnreadCount((prev) => prev + 1)
                    }
                  />
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

export default EditorMain;
