import React, { useState, useEffect, useRef } from "react";
import EditorComp from "./EditorComp";
import ChatComp from "./ChatComp";
import "../styles/EditorMain.css";
import { useLocation, useParams } from "react-router-dom";
import { Trash } from "lucide-react";
import socket from "../socket/socket";

/*
  FILE STRUCTURE:
  {
    id,
    name,
    language,
    content
  }
*/

const EditorMain = () => {
  const { roomId } = useParams();
  const { state } = useLocation();
  const userName = state?.userName;

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

    const cleanName = filename
      .trim()
      .replace(/\s*\(\d+\)$/, "");

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
      createdBy:userName
    };

    socket.emit("file-create", {
      roomId,
      file: newFile,
    });
  };

  const updateFileContent = (value) => {
    // 🔥 IMPORTANT: IGNORE REMOTE UPDATES
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (!activeFileId) return;

    setFiles((prev) =>
      prev.map((file) =>
        file.id === activeFileId
          ? { ...file, content: value }
          : file
      )
    );

    socket.emit("file-content-update", {
      roomId,
      fileId: activeFileId,
      content: value,
    });
  };

  const deleteFile = (id) => {
    
    socket.emit("file-delete",{
      roomId,
      fileId:id,
      userName
    })
    const file=files.filter(file=>file.id===id)
    if(file.createdBy!==userName){
      return;
    }
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((f) => f.id !== id);

      if (id === activeFileId) {
        setActiveFileId(updatedFiles[0]?.id || null);
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
    if (!roomId || !userName) return;
    socket.emit("join-room", { roomId, userName });
  }, [roomId, userName]);

  /* ---------------- SOCKET LISTENERS ---------------- */
  useEffect(() => {
    const handleFileCreated = (filesFromServer) => {
      console.log(filesFromServer);
      if (!Array.isArray(filesFromServer)) {
        console.error("Expected files array, got:", filesFromServer);
        return;
      }
      setFiles(filesFromServer);
    };

    socket.on("file-created", handleFileCreated);

    return () => {
      socket.off("file-created", handleFileCreated);
    };
  }, []);
  useEffect(()=>{
    socket.on("delete-error",({msg})=>{
      alert(msg)
    })
    return ()=>{
      socket.off("delete-error")
    }
  },[])
  useEffect(() => {
    const handleContentUpdate = ({ fileId, content }) => {
      // 🔥 FLAG REMOTE UPDATE
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
    if (!Array.isArray(files) || files.length === 0) {
      setActiveFileId(null);
      return;
    }

    const exists = files.some((f) => f.id === activeFileId);

    if (!exists) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  /* ---------------- RENDER ---------------- */
  return (
    <div className="container-fluid editor-main-wrapper">
      <div className="row vh-100">

        {/* FILE EXPLORER */}
        <div className="col-2 p-0 file-sidebar">
          <div className="file-header">
            <span>FILES</span>
            <button className="add-file-btn" onClick={createFile}>＋</button>
          </div>

          {files.map((file) => (
            <div
              key={file.id}
              className={`file-item ${file.id === activeFileId ? "active" : ""}`}
              onClick={() => setActiveFileId(file.id)}
            >
              <span className="file-name">{file.name}</span>

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

        {/* EDITOR */}
        <div className="col-10 p-0 editor-section">
          {activeFile ? (
            <EditorComp
              code={activeFile.content}
              language={activeFile.language}
              onCodeChange={updateFileContent}
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
                <div className="modal-body p-0">
                  <ChatComp
                    roomId={roomId}
                    userName={userName}
                    chatOpen={showChat}
                    setUsersFromParent={setUsers}
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
