import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import socket from "../socket/socket";
import { useLocation, useParams } from "react-router-dom";
import "../styles/Editor.css";

const EditorComp = () => {
  const languages = ["javascript", "typescript", "java", "python"];

  const codeTemplates = {
    javascript: "console.log('Hello World');",
    typescript:
      "//Sorry currently facing some issues with Ts.\n//Please prefer other languages\nlet x: number = 10;\nconsole.log(x);",
    java:
      "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"Hello World\");\n  }\n}",
    python: "print('Hello World')",
  };

  const { roomId } = useParams();
  const { state } = useLocation();
  const userName = state?.userName;

  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(codeTemplates.javascript);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  // ✅ NEW: STDIN INPUT STATE
  const [input, setInput] = useState("");

  // -------------------------
  // JOIN ROOM
  // -------------------------
  useEffect(() => {
    if (!roomId || !userName) return;
    socket.emit("join-room", { roomId, userName });
  }, [roomId, userName]);

  // -------------------------
  // RECEIVE CODE FROM SOCKET
  // -------------------------
  useEffect(() => {
    socket.on("code-sent", ({ code, language }) => {
      setLanguage(language);
      setCode(code);
    });

    return () => {
      socket.off("code-sent");
    };
  }, []);

  // -------------------------
  // CODE CHANGE (USER TYPING)
  // -------------------------
  const handleChange = (value) => {
    if (value === undefined) return;

    setCode(value);

    socket.emit("code-change", {
      roomId,
      userName,
      code: value,
      language,
    });
  };

  // -------------------------
  // LANGUAGE CHANGE
  // -------------------------
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const template = codeTemplates[lang];

    setLanguage(lang);
    setCode(template);

    socket.emit("code-change", {
      roomId,
      userName,
      code: template,
      language: lang,
    });
  };

  // -------------------------
  // RUN CODE (WITH INPUT)
  // -------------------------
  const handleRun = async () => {
    try {
      setLoading(true);

      const response = await fetch("https://code-runner.vkstore.site/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          input, // ✅ SEND INPUT
        }),
      });

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
          <span className="room">Room: {roomId}</span>
        </div>
        <div className="right">
          <span className="status-online">🟢 Online</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="editor-toolbar">
        <select
          className="language-select"
          value={language}
          onChange={handleLanguageChange}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

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
        {/* EDITOR */}
        <div className="editor-wrapper">
          <Editor
            height="100%"
            theme="vs-dark"
            language={language}
            value={code}
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

        {/* RIGHT PANEL */}
        <div className="output-wrapper">
          {/* INPUT */}
          <div className="output-header">Input (STDIN)</div>
          <textarea
            className="input-box"
            placeholder="Enter input here (stdin)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          {/* OUTPUT */}
          <div className="output-header">
            Output
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
      </div>
    </div>
  );
};

export default EditorComp;
