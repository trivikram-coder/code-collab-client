import React, { useState, useEffect, useRef } from "react";
import EditorComp from "./EditorComp";
import ChatComp from "./ChatComp";
import "../styles/EditorMain.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import socket from "../socket/socket";


/*
  FILE STRUCTURE:
  {
    id,
    name,
    language,
    content,
    createdBy
  }
*/

const EditorMain = () => {
  const navigate=useNavigate()
  const { roomId } = useParams();
  const { state } = useLocation();
  const userName = state?.userName;
  const roomName=state?.roomName ||localStorage.getItem(`room:${roomId}`)

  console.log(roomId,userName)
  /* ---------------- FILE STATE ---------------- */
  const [files, setFiles] = useState([]); // ALWAYS array
  const [activeFileId, setActiveFileId] = useState(null);

  /* 🔥 REMOTE UPDATE FLAG */
  const isRemoteUpdate = useRef(false);

  /* ---------------- CHAT STATE ---------------- */
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [users, setUsers] = useState([]);

  /* ---------------- HELPERS ---------------- */
  const activeFile = Array.isArray(files)
    ? files.find((f) => f.id === activeFileId)
    : null;

  const detectLanguage = (filename) => {
    if (!filename) return "plaintext";

    const cleanName = filename.trim().replace(/\s*\(\d+\)$/, "");
    const parts = cleanName.split(".");
    if (parts.length < 2) return "plaintext";

    const ext = parts.pop().toLowerCase();

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

  // ---------------- DUPLICATE FILE CHECK ----------------
  const getUniqueFileName = (name) => {
    const allNames = files.map((f) => f.name);

    if (!allNames.includes(name)) return name;

    let count = 1;
    let newName = `${name} (${count})`;

    while (allNames.includes(newName)) {
      count++;
      newName = `${name} (${count})`;
    }

    return newName;
  };
const setActive = (id) => {
  setActiveFileId(id);
  localStorage.setItem(`activeFile_${roomId}`, id);
};
  /* ---------------- FILE ACTIONS ---------------- */
  
  const createFile = () => {
    const name = prompt("Enter file name (example: app.py)");
    if (!name) return;

    const uniqueName = getUniqueFileName(name);

    const newFile = {
      id: crypto.randomUUID(),
      name: uniqueName,
      language: detectLanguage(uniqueName),
      content: "",
      createdBy: userName,
    };
  
    socket.emit("file-create", {
      roomId,
      file: newFile,
    });

    // 🔥 SET ACTIVE FILE IMMEDIATELY
    setActive(newFile.id)
  };

  const updateFileContent = (value) => {
    // 🔥 IGNORE REMOTE UPDATES
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (!activeFileId) return;

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFileId ? { ...file, content: value } : file
      )
    );

    socket.emit("file-content-update", {
      roomId,
      fileId: activeFileId,
      content: value,
    });
  };

  const deleteFile = (id) => {
    const file = files.find((f) => f.id === id);

    if (!file || file.createdBy !== userName) {
      socket.emit("file-delete", {
        roomId,
        fileId: id,
        userName,
      });
      return;
    }

    socket.emit("file-delete", {
      roomId,
      fileId: id,
      userName,
    });

    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((f) => f.id !== id);

      if (id === activeFileId) {
        setActive(updatedFiles[0]?.id || null);
      }

      return updatedFiles;
    });
  };

  /* ---------------- CHAT ACTIONS ---------------- */
  const openChat = () => {
    setShowChat(true);
    setUnreadCount(0);
  };
  
useEffect(() => {
  const saved = localStorage.getItem(`activeFile_${roomId}`);
  if (saved) {
    setActiveFileId(saved);
  }
}, [roomId]);

useEffect(() => {
  if (!roomId || !userName) return;

  const joinRoom = () => {
    socket.emit("join-room", { roomId,roomName, userName });
  };

  // Join on first load
  joinRoom();

  // Rejoin on reconnect
  socket.on("connect", () => {
    joinRoom();
  });

  return () => {
    socket.off("connect");
  };
}, [roomId, userName]);

 useEffect(() => {
  const handleRoomUsers = (data) => {
    console.log(data)
    setUsers(data);
  };

  socket.on("room-users", handleRoomUsers);

  return () => {
    socket.off("room-users", handleRoomUsers);
  };
}, []);

  /* ---------------- SOCKET LISTENERS ---------------- */
useEffect(() => {
  socket.on("file-created", (filesFromServer) => {
    setFiles(filesFromServer);

    // If active file is not present, set latest file as active
    const exists = filesFromServer.some(f => f.id === activeFileId);

    if (!exists) {
      const latestFile = filesFromServer[filesFromServer.length - 1];
      if (latestFile) setActive(latestFile.id);
    }
  });

  return () => {
    socket.off("file-created");
  };
}, [activeFileId, roomId]);




  useEffect(() => {
    socket.on("delete-error", ({ msg }) => {
      alert(msg);
    });

    return () => {
      socket.off("delete-error");
    };
  }, []);

  useEffect(() => {
    const handleContentUpdate = ({ fileId, content }) => {
      isRemoteUpdate.current = true;

      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId && file.content !== content
            ? { ...file, content }
            : file
        )
      );
    };

    socket.on("file-content-updated", handleContentUpdate);

    return () => {
      socket.off("file-content-updated", handleContentUpdate);
    };
  }, []);
  
  /* ---------------- ACTIVE FILE SAFETY ---------------- */
  useEffect(() => {
  if (!files.length) return;

  const exists = files.some((f) => f.id === activeFileId);

  if (!exists) {
    setActive(files[0].id);
  }
}, [files, activeFileId]);


  /* ---------------- RENDER ---------------- */
  return (
    <>
    {
      (!userName || !roomId)?(
       <div className="d-flex justify-content-center align-items-center vh-100">
  <div className="card shadow p-4 text-center" style={{ maxWidth: "400px" }}>
    <p className="fs-5 mb-4 text-danger">
      Please enter a valid room
    </p>
    <button
      className="btn btn-primary w-100"
      onClick={() => navigate("/dashboard")}
    >
      Join Room
    </button>
  </div>
</div>

      ):(
 <div className="container-fluid editor-main-wrapper">
      <div className="row vh-100">
        {/* FILE EXPLORER */}
        <div className="col-2 p-0 file-sidebar">
          <div className="file-header">
            <span>FILES</span>
            <button className="add-file-btn" onClick={createFile}>
              ＋
            </button>
          </div>

          {/* 🔥 SCROLLABLE FILE LIST */}
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
  {file.name} <span className="file-user">— {file.createdBy}</span>
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
            key={activeFileId}
            fileId={activeFileId}
              code={activeFile.content}
              language={activeFile.language}
              onCodeChange={updateFileContent}
              users={users}
            />
          ) : (
            <div className="no-file">
              Create or select a file to start coding
            </div>
          )}
        </div>
      </div>

      {/* FLOATING CHAT BUTTON */}
      <button className="chat-float-btn" onClick={openChat}>
        💬
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* CHAT MODAL UI */}
      {showChat && (
        <>
          <div className="modal fade show d-block chat-modal">
            <div className="modal-dialog modal-dialog-end modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Room Chat ({users.length} online)
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => setShowChat(false)}
                  ></button>
                </div>
                {console.log(users)}
                <div className="modal-body p-0">
                  <ChatComp
                    roomId={roomId}
                    roomName={roomName}
                    userName={userName}
                    chatOpen={showChat}
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
      )
    }
   
    </>
  );
};

export default EditorMain;
