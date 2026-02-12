import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import socket from "../socket/socket";
import { useNavigate } from "react-router-dom";
import "../styles/Editor.css";
import UsersList from "./UsersList";
import { toast } from "react-toastify";
import api from "./api/api";

const EditorComp = ({
  fileId,
  roomId,
  roomName,
  userName,
  code,
  language,
  users,
}) => {
  const templates = {
  javascript: `// JavaScript Template

function main() {
  console.log("Hello World");
}

// Call main function
main();
`,

  java: `// Java Template

import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
`,

  python: `# Python Template

def main():
    print("Hello World")

if __name__ == "__main__":
    main()
`,

  typescript: `// TypeScript Template

function main(): void {
  console.log("Hello World");
}

main();
`,

  json: `{
  "name": "example",
  "version": "1.0.0",
  "description": "Sample JSON template",
  "dependencies": {}
}
`
};

  const navigate = useNavigate();

  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const [leaveRoomAlertBox, setLeaveRoomAlertBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");

  const currentUser = users?.find((u) => u.userName === userName);
  const role = currentUser?.role;
  const canEdit = role === "editor" || role === "admin";

  /* ============================= */
  /* 🔥 HANDLE LOCAL TYPING       */
  /* ============================= */
  const handleChange = (value) => {
    if (!value) return;

    // Ignore if change came from remote update
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    socket.emit("file-content-update", {
      roomId,
      userName,
      fileId,
      content: value,
      version:Date.now()
    });
  };

  /* ============================= */
  /* 🔥 HANDLE REMOTE UPDATES     */
  /* ============================= */
  useEffect(() => {
  if (!editorRef.current) return;

  const editor = editorRef.current;
  const model = editor.getModel();

  if (!model) return;   // 🔥 VERY IMPORTANT

  const currentValue = model.getValue();

  if (code !== currentValue) {
    isRemoteUpdate.current = true;

    editor.executeEdits("", [
      {
        range: model.getFullModelRange(),
        text: code || "",
      },
    ]);
  }
}, [code]);


  /* ============================= */
  /* 🔥 HANDLE RUN CODE           */
  /* ============================= */
  const handleRun = async () => {
    try {
      setLoading(true);

      const response = await api.post("/run",
        {
            language,
            code: editorRef.current?.getValue(),
            input,
      
        }
      );
     
      const data =  response.data;
      setStatus(data.status);
      setOutput(data.output);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================= */
  /* 🔥 HANDLE LEAVE ROOM         */
  /* ============================= */
  const leaveRoom = () => {
    toast.info(`${userName} left the room ${roomName}`);
    socket.emit("leave-room", { roomId, userName });
    navigate("/");
  };

  return (
    <div className="editor-page">
      {/* HEADER */}
      <div className="editor-header">
        <div className="left">
          <span className="user">👤 {userName}</span>
          <span className="room">Room: {roomName}</span>
        </div>

        <div className="right">
          <span className="status-online">🟢 Online</span>
          <button
            className="leave-btn"
            onClick={() => setLeaveRoomAlertBox(true)}
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="editor-toolbar">
        <span className="language-badge">
          {language?.toUpperCase()}
        </span>

        {!loading ? (
          <button
            className={`run-btn ${!canEdit ? "disabled-btn" : ""}`}
            onClick={handleRun}
            disabled={!canEdit}
            >
  ▶ Run
</button>
        ) : (
          <span className="run-btn">Running...</span>
        )}
      </div>

      {/* MAIN */}
      <div className="editor-main">
        <div className="editor-wrapper">
          <Editor
            key={fileId}
            height="100%"
            theme="vs-dark"
            language={language}
            
            defaultValue={!code?templates[language]:code}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
            onChange={handleChange}
            options={{
              readOnly: !canEdit,
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
            }}
          />
        </div>

        {/* OUTPUT PANEL */}
        <div className="output-wrapper">
          <div className="output-header">Input (STDIN)</div>

          <textarea
            className="input-box"
            placeholder="Enter input here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="output-header">
            Output{" "}
            {status && (
              <span
                className={
                  status === "success"
                    ? "output-success"
                    : "output-error"
                }
              >
                {status}
              </span>
            )}
          </div>

          <pre className="output-box">
            {output || "Run code to see output"}
          </pre>
        </div>

        <div className="users-panel">
          <UsersList
            users={users}
            userName={userName}
            roomId={roomId}
          />
        </div>
      </div>

      {/* LEAVE MODAL */}
      {leaveRoomAlertBox && (
        <>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div
                className="modal-content border-0 shadow-sm rounded-4"
                style={{
                  backgroundColor: "#2c2c2c",
                  color: "#fff",
                }}
              >
                <div className="modal-header border-0">
                  <h5 className="modal-title">
                    Confirm Leave Room
                  </h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() =>
                      setLeaveRoomAlertBox(false)
                    }
                  ></button>
                </div>

                <div className="modal-body">
                  Are you sure you want to leave the room?
                </div>

                <div className="modal-footer border-0">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setLeaveRoomAlertBox(false)
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={leaveRoom}
                  >
                    Leave
                  </button>
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

export default EditorComp;
