import React, { useState, useRef, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { apiUrl } from "./api/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODES = ["chat", "explain", "fix", "analyze"];
const LANGUAGES = ["javascript", "java", "python", "cpp"];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page:    { background: "#0d1117", color: "#e6edf3", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  header:  { borderBottom: "1px solid #21262d", background: "#161b22" },
  chatArea:{ background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)" },

  userBubble: {
    maxWidth: "78%", padding: "12px 16px",
    borderRadius: "18px 18px 4px 18px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff", fontSize: 14, lineHeight: 1.75,
    wordBreak: "break-word", boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
  },
  aiBubble: {
    maxWidth: "78%", padding: "12px 16px",
    borderRadius: "18px 18px 18px 4px",
    background: "#161b22", border: "1px solid #30363d",
    color: "#e6edf3", fontSize: 14, lineHeight: 1.75,
    wordBreak: "break-word", boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },

  codeWrapper: {
    margin: "10px 0", borderRadius: 10,
    overflow: "hidden", border: "1px solid #30363d",
    background: "#010409",
  },
  codeHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 14px", background: "#161b22", borderBottom: "1px solid #30363d",
  },
  codeLabel:  { color: "#8b949e", fontSize: 12, fontFamily: "inherit" },
  copyBtn: {
    background: "#21262d", border: "1px solid #30363d", borderRadius: 6,
    color: "#c9d1d9", fontSize: 12, padding: "2px 10px", cursor: "pointer",
  },
  syntaxStyle: {
    margin: 0, padding: "14px 16px", background: "#010409",
    fontSize: 13, lineHeight: 1.6, borderRadius: 0, overflowX: "auto",
  },
  codeTag: { fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", fontSize: 13 },

  footer:      { borderTop: "1px solid #21262d", background: "#161b22" },
  codeInput:   { background: "#010409", borderRadius: 10, resize: "none", padding: 12, fontSize: 13, boxShadow: "none", color: "#e6edf3", fontFamily: "inherit", border: "1px solid #30363d" },
  messageInput:{ background: "#010409", borderRadius: 10, height: 46, paddingLeft: 14, fontSize: 14, boxShadow: "none", color: "#e6edf3", border: "1px solid #30363d" },
  langSelect:  { width: 130, background: "#010409", borderRadius: 10, height: 46, fontSize: 13, boxShadow: "none", color: "#e6edf3", border: "1px solid #30363d" },
  modeSelect:  { width: 130, background: "#21262d", borderRadius: 10, border: "none", color: "#e6edf3" },
  sendBtn: {
    height: 46, minWidth: 88, borderRadius: 10,
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    border: "none", color: "#fff", fontWeight: 600, fontSize: 14,
    boxShadow: "0 2px 10px rgba(37,99,235,0.4)", cursor: "pointer",
  },
};

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

// Language tags the model is allowed to emit as-is.
// Anything longer is assumed to be a merged language+code token.
const KNOWN_LANGS = new Set([
  "javascript", "js", "typescript", "ts", "python", "py",
  "java", "cpp", "c", "cs", "csharp", "go", "rust", "ruby",
  "php", "swift", "kotlin", "bash", "sh", "html", "css",
  "json", "xml", "sql", "text", "code", "plaintext",
]);

/**
 * Expands C-style one-liner code into multi-line format.
 * "function foo() { if (x) { return 1; } return 0; }"
 *  → proper indented block
 * Only fires when the entire code body is a single line.
 */
const expandOneLiner = (code, lang) => {
  // Only expand C-style languages
  if (!["javascript","js","typescript","ts","java","cpp","c","cs","csharp"].includes(lang)) {
    return code;
  }
  // If there are already real newlines inside the block, leave it alone
  if (code.includes("\n")) return code;

  // Insert newline + indent after { and before }
  return code
    .replace(/\{\s*/g, "{\n  ")
    .replace(/;\s*(?=[^\s}])/g, ";\n  ")
    .replace(/\s*\}/g, "\n}")
    .replace(/\n {2}(\n\})/g, "$1")  // remove trailing spaces before closing brace
    .trim();
};

/**
 * Fixes raw model output before rendering:
 *  1. Normalise line endings and escaped newlines
 *  2. Strip prose markdown markers
 *  3. Split merged language+code tokens:  ```javascriptfunction → ```javascript\nfunction
 *  4. Remove stray ```text fences — model sometimes wraps plain prose in them
 */
const normalise = (text = "") => {
  let out = text
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6} /g, "");

  // ONLY fix merged fence+code when newline is truly missing
  out = out.replace(
    /```([a-zA-Z+#.-]+)([^\n`])/g,
    (_, lang, firstChar) => {
      const lower = lang.toLowerCase();

      // exact valid language → preserve
      if (KNOWN_LANGS.has(lower)) {
        return "```" + lang + "\n" + firstChar;
      }

      // detect merged language+code
      for (let len = Math.min(lang.length - 1, 12); len >= 1; len--) {
        const prefix = lang.slice(0, len).toLowerCase();

        if (KNOWN_LANGS.has(prefix)) {
          return (
            "```" +
            lang.slice(0, len) +
            "\n" +
            lang.slice(len) +
            firstChar
          );
        }
      }

      return "```code\n" + lang + firstChar;
    }
  );

  // unwrap text fences
  out = out.replace(
    /```(?:text|plaintext)\n([\s\S]*?)```/g,
    "$1"
  );

  return out.trim();
};

/**
 * Splits a normalised message into alternating text and code segments.
 */
const parseSegments = (text) => {
  const segments = [];
  // Matches: ```lang\n<code body>```
  const FENCE = /```([\w+#.-]*)\n([\s\S]*?)```/g;
  let cursor = 0;
  let match;

  while ((match = FENCE.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: "text", content: text.slice(cursor, match.index) });
    }
    const lang    = match[1] || "code";
    const rawCode = match[2].trimEnd();
    segments.push({
      type: "code",
      language: lang,
      content: expandOneLiner(rawCode, lang.toLowerCase()),
    });
    cursor = FENCE.lastIndex;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CodeBlock = ({ language, content }) => (
  <div style={styles.codeWrapper}>
    <div style={styles.codeHeader}>
      <span style={styles.codeLabel}>{language}</span>
      <button style={styles.copyBtn} onClick={() => navigator.clipboard.writeText(content)}>
        Copy
      </button>
    </div>
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      wrapLongLines={false}
      customStyle={styles.syntaxStyle}
      codeTagProps={{ style: styles.codeTag }}
    >
      {content}
    </SyntaxHighlighter>
  </div>
);

const MessageBubble = ({ role, text }) => {
  const segments = parseSegments(normalise(text));
  return (
    <div className={`d-flex mb-3 ${role === "user" ? "justify-content-end" : "justify-content-start"}`}>
      <div style={role === "user" ? styles.userBubble : styles.aiBubble}>
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <CodeBlock key={i} language={seg.language} content={seg.content} />
          ) : (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>{seg.content}</span>
          )
        )}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center" style={{ color: "#484f58" }}>
    <div style={{ fontSize: 56 }}>✦</div>
    <h5 className="mt-3 fw-semibold" style={{ color: "#8b949e" }}>Ask anything about your code</h5>
    <p style={{ maxWidth: 300, fontSize: 13, color: "#484f58" }}>
      Chat, explain, fix, or analyze — all in one place.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AIChatPage = () => {
  const [message,  setMessage]  = useState("");
  const [code,     setCode]     = useState("");
  const [language, setLanguage] = useState("javascript");
  const [mode,     setMode]     = useState("chat");
  const [chat,     setChat]     = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Conversation history sent to the backend — kept in a ref so
  // streaming closures always see the latest value without stale captures.
  const historyRef = useRef([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const updateLastAiBubble = (text) => {
    setChat((prev) => {
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], text };
      return next;
    });
  };

  const commitToHistory = (userContent, assistantContent) => {
    historyRef.current = [
      ...historyRef.current,
      { role: "user",      content: userContent },
      { role: "assistant", content: assistantContent },
    ];
  };

  const streamResponse = async (endpoint, payload) => {
    const res = await fetch(`${apiUrl}/ai/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        chatHistory: historyRef.current,
        stream: true,
      }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop();

      for (const chunk of chunks) {
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const token = line.slice("data: ".length);
          if (token === "[DONE]") return accumulated;
          accumulated += token;
          updateLastAiBubble(accumulated);   // normalise happens inside MessageBubble
        }
      }
    }

    return accumulated;
  };

  const handleSend = async () => {
    if (!message.trim() && !code.trim()) return;

    const userText = message || code;
    const payload  = { message, code, language };

    setMessage("");
    setCode("");
    setLoading(true);

    setChat((prev) => [
      ...prev,
      { role: "user", text: userText },
      { role: "ai",   text: "" },
    ]);

    try {
      const aiReply = await streamResponse(mode, payload);
      if (aiReply) commitToHistory(userText, aiReply);
    } catch {
      setChat((prev) => [...prev, { role: "ai", text: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="d-flex flex-column h-100" style={styles.page}>

      {/* ── Header ── */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3" style={styles.header}>
        <div>
          <h6 className="m-0 fw-bold" style={{ color: "#e6edf3", letterSpacing: "0.3px" }}>✦ AI Assistant</h6>
          <small style={{ color: "#484f58" }}>Your coding copilot</small>
        </div>
        <select
          className="form-select"
          style={styles.modeSelect}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-grow-1 overflow-auto px-3 py-4" style={styles.chatArea}>
        {chat.length === 0 && <EmptyState />}

        {chat.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} />
        ))}

        {loading && (
          <div style={{ color: "#484f58", fontSize: 13, paddingLeft: 4 }}>
            ✦ thinking…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-3" style={styles.footer}>
        <textarea
          className="form-control mb-2"
          placeholder="Paste code here…"
          rows={4}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={styles.codeInput}
        />
        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control"
            placeholder="Ask anything…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.messageInput}
          />
          <select
            className="form-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={styles.langSelect}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang}>{lang}</option>
            ))}
          </select>
          <button onClick={handleSend} disabled={loading} style={styles.sendBtn}>
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIChatPage;