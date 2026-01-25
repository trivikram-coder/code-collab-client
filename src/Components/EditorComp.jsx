import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import socket from "../socket/socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/Editor.css";
import UsersList from "./UsersList";

const EditorComp = ({ fileId,code, language, onCodeChange }) => {
  const navigate=useNavigate()
  const codeTemplates = {
    javascript: "console.log('Hello World');",
    typescript:
      "//Sorry currently facing some issues with Ts.\n//Please prefer other languages\nlet x: number = 10;\nconsole.log(x);",
    java:
      "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}",
    python: "print('Hello World')",
    cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  cout << \"Hello World\";\n  return 0;\n}",
    c: "#include <stdio.h>\n\nint main(){\n  printf(\"Hello World\");\n  return 0;\n}",
    html: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Hello</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>",
    css: "body {\n  font-family: Arial;\n}\n",
    json: "{\n  \"message\": \"Hello World\"\n}",
  };

  const { roomId } = useParams();
  const { state } = useLocation();
  const userName = state?.userName;
  const roomName=localStorage.getItem(`room:${roomId}`) || ""

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const[users,setUsers]=useState([])
  const [localLang, setLocalLang] = useState(language || "javascript");
  const [localCode, setLocalCode] = useState(
    code || codeTemplates[language] || codeTemplates["javascript"]
  );
  useEffect(() => {
  if (!roomId || !userName) return;

  socket.emit("join-room", { roomId,roomName, userName });

  const handleRoomUsers = (data) => {
    setUsers(data);
  };

  socket.on("room-users", handleRoomUsers);

  return () => {
    socket.off("room-users", handleRoomUsers);
  };
}, [roomId, userName]);
  // Sync with parent when file changes
  useEffect(() => {
    setLocalLang(language || "javascript");
    setLocalCode(code || codeTemplates[language] || codeTemplates["javascript"]);
  }, [code, language]);
const leaveRoom = () => {
    socket.emit("leave-room", { roomId, userName });
    navigate("/");
  };
  // Code change
  const handleChange = (value) => {
    if (value === undefined) return;

    setLocalCode(value);
    onCodeChange(value);

    // ⚠️ REMOVE THIS SOCKET EMIT TO KEEP IT INDEPENDENT
    // socket.emit("code-change", {
    //   roomId,
    //   userName,
    //   code: value,
    //   language: localLang,
    // });
  };

  // Run code
  const handleRun = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://code-collab-server.vkstore.site/run",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: localLang,
            code: localCode,
            input,
          }),
        }
      );

      const data = await response.json();
      setStatus(data.status);
      setOutput(data.output);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
          <button className="leave-btn" onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="editor-toolbar">
        <span className="language-badge">{localLang.toUpperCase()}</span>

        {!loading ? (
          <button className="run-btn" onClick={handleRun}>
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
            language={localLang}
            value={localCode}
            onChange={handleChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              autoClosingBrackets: "always",
              autoIndent: "full",
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
            }}
          />
        </div>

        {/* Output panel */}
        <div className="output-wrapper">
          <div className="output-header">Input (STDIN)</div>
          <textarea
            className="input-box"
            placeholder="Enter input here (stdin)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="output-header">
            Output
            {status && (
              <span
                className={
                  status === "success" ? "output-success" : "output-error"
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
    <UsersList users={users} userName={userName}/>
  </div>
      </div>
      
    </div>
  );
};

export default EditorComp;
