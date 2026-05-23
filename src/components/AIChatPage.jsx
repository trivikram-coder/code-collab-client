import React, { useState, useRef, useEffect, memo } from "react";
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
  page: {
    background: "#0d1117",
    color: "#e6edf3",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },

  header: {
    borderBottom: "1px solid #21262d",
    background: "#161b22",
  },

  chatArea: {
    background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)",
  },

  userBubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: "18px 18px 4px 18px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.75,
    wordBreak: "break-word",
    boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
  },

  aiBubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 4px",
    background: "#161b22",
    border: "1px solid #30363d",
    color: "#e6edf3",
    fontSize: 14,
    lineHeight: 1.75,
    wordBreak: "break-word",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },

  codeWrapper: {
    margin: "10px 0",
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #30363d",
    background: "#010409",
  },

  codeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 14px",
    background: "#161b22",
    borderBottom: "1px solid #30363d",
  },

  codeLabel: {
    color: "#8b949e",
    fontSize: 12,
    fontFamily: "inherit",
  },

  copyBtn: {
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: 6,
    color: "#c9d1d9",
    fontSize: 12,
    padding: "2px 10px",
    cursor: "pointer",
  },

  syntaxStyle: {
    margin: 0,
    padding: "14px 16px",
    background: "#010409",
    fontSize: 13,
    lineHeight: 1.6,
    borderRadius: 0,
    overflowX: "auto",
  },

  codeTag: {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: 13,
  },

  footer: {
    borderTop: "1px solid #21262d",
    background: "#161b22",
  },

  codeInput: {
    background: "#010409",
    borderRadius: 10,
    resize: "none",
    padding: 12,
    fontSize: 13,
    boxShadow: "none",
    color: "#e6edf3",
    fontFamily: "inherit",
    border: "1px solid #30363d",
    "::placeholder": {
    color: "#ffffff",
    opacity: 1,
  },
  },

  messageInput: {
    background: "#010409",
    borderRadius: 10,
    height: 46,
    paddingLeft: 14,
    fontSize: 14,
    boxShadow: "none",
    color: "#e6edf3",
    border: "1px solid #30363d",
    "::placeholder": {
    color: "#ffffff",
    opacity: 1,
  },
  },

  langSelect: {
    width: 130,
    background: "#010409",
    borderRadius: 10,
    height: 46,
    fontSize: 13,
    boxShadow: "none",
    color: "#e6edf3",
    border: "1px solid #30363d",
  },

  modeSelect: {
    width: 130,
    background: "#21262d",
    borderRadius: 10,
    border: "none",
    color: "#e6edf3",
  },

  sendBtn: {
    height: 46,
    minWidth: 88,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    border: "none",
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 2px 10px rgba(37,99,235,0.4)",
    cursor: "pointer",
  },
};

// ---------------------------------------------------------------------------
// Language map — AI label → valid Prism language string
// ---------------------------------------------------------------------------

const LANG_MAP = {
  javascript: "javascript",
  java:       "java",
  python:     "python",
  cpp:        "cpp",
};

// ---------------------------------------------------------------------------
// Known languages — full names only, NO short aliases like js / ts / py
// Short aliases cause split bugs e.g. python → py + thon
// ---------------------------------------------------------------------------

const KNOWN_LANGS = new Set([
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "csharp",
  "cs",
  "c",
  "go",
  "rust",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "bash",
  "sh",
  "html",
  "css",
  "json",
  "xml",
  "sql",
  "text",
  "code",
  "plaintext",
]);

// Language name words or bad-split fragments that leak as first line
// of a code block — stripped by the final normalise pass
const LANG_WORDS = new Set([
  "java",
  "python",
  "thon",
  "javascript",
  "typescript",
  "script",
  "cpp",
  "csharp",
  "kotlin",
  "swift",
  "ruby",
  "bash",
  "html",
  "css",
  "json",
  "sql",
  "code",
  "text",
  "pp",
  "on",
]);

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/**
 * Expands C-style one-liner code into multi-line format.
 * Only fires when the entire code body is a single line.
 */
const expandOneLiner = (code, lang) => {
  const cStyleLangs = [
    "javascript",
    "typescript",
    "java",
    "cpp",
    "c",
    "cs",
    "csharp",
  ];

  if (!cStyleLangs.includes(lang)) {
    return code;
  }

  if (code.includes("\n")) {
    return code;
  }

  return code
    .replace(/\{\s*/g, "{\n  ")
    .replace(/;\s*(?=[^\s}])/g, ";\n  ")
    .replace(/\s*\}/g, "\n}")
    .replace(/\n {2}(\n\})/g, "$1")
    .trim();
};

/**
 * Normalises raw model output before rendering.
 *
 * Key fix: split on code fences FIRST, then only clean prose sections.
 * Code block content is NEVER touched by markdown strippers so that:
 *   - Python # comments are preserved
 *   - *args and **kwargs are preserved
 *   - f-strings and any * or # inside code are preserved
 *
 * Steps:
 *  1. Split text into [prose, codeblock, prose, codeblock, ...] alternating parts
 *  2. Only apply markdown stripping to prose parts (even indexes)
 *  3. Rejoin and fix merged fence+language tokens
 *  4. Unwrap stray text/plaintext fences
 *  5. Strip bare language-name words leaked as first line of a code block
 */
const normalise = (text = "") => {
  // Split into prose and code fence sections — keep fences in the array
  const parts = text
    .replace(/\r/g, "")
    .split(/(```[\s\S]*?```)/g);

  const cleaned = parts.map((part, i) => {
    // Odd indexes are code blocks — leave them completely untouched
    if (i % 2 === 1) {
      return part;
    }

    // Even indexes are prose — safe to strip markdown here
    return part
      .replace(/\\n/g, "\n")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      // ^ + m flag: only strips markdown headers at line start,
      // never # inline comments inside prose or code
      .replace(/^#{1,6} /gm, "");
  });

  let out = cleaned.join("");

  // Fix merged fence+code when newline is truly missing.
  // Loop from LONGEST prefix (min 2) so cpp wins before c is tried.
  out = out.replace(
    /```([a-zA-Z+#.-]+)([^\n`])/g,
    (_, lang, firstChar) => {
      const lower = lang.toLowerCase();

      // Exact valid language — insert missing newline only
      if (KNOWN_LANGS.has(lower)) {
        return "```" + lang + "\n" + firstChar;
      }

      // Longest prefix first (min length 2)
      for (let len = Math.min(lang.length - 1, 12); len >= 2; len--) {
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

      // Single-char fallback — last resort only
      if (KNOWN_LANGS.has(lang.slice(0, 1).toLowerCase())) {
        return (
          "```" +
          lang.slice(0, 1) +
          "\n" +
          lang.slice(1) +
          firstChar
        );
      }

      return "```code\n" + lang + firstChar;
    }
  );

  // Unwrap plain-text fences — model sometimes wraps prose in them
  out = out.replace(
    /```(?:text|plaintext)\n([\s\S]*?)```/g,
    "$1"
  );

  // Strip bare language-name word leaked as first line of a code block.
  // Runs LAST so it catches anything the earlier passes missed.
  out = out.replace(/(```[\w]*\n)(\w+\n)/g, (match, fence, firstLine) => {
    const word = firstLine.trim().toLowerCase();
    return LANG_WORDS.has(word) ? fence : match;
  });

  return out.trim();
};

/**
 * Splits a normalised message into alternating text and code segments.
 */
const parseSegments = (text) => {
  const segments = [];
  const FENCE    = /```([\w+#.-]*)\n([\s\S]*?)```/g;
  let cursor     = 0;
  let match;

  while ((match = FENCE.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({
        type:    "text",
        content: text.slice(cursor, match.index),
      });
    }

    const lang    = match[1] || "code";
    const rawCode = match[2].trimEnd();

    segments.push({
      type:     "code",
      language: lang,
      content:  expandOneLiner(rawCode, lang.toLowerCase()),
    });

    cursor = FENCE.lastIndex;
  }

  if (cursor < text.length) {
    segments.push({
      type:    "text",
      content: text.slice(cursor),
    });
  }

  return segments;
};

// ---------------------------------------------------------------------------
// Sub-components
// memo() stops MessageBubble re-rendering unless its own props change —
// fixes lag during streaming (only the last AI bubble re-renders per token)
// ---------------------------------------------------------------------------

const CodeBlock = ({ language, content, selectedLanguage }) => {
  const displayLabel = selectedLanguage || language;
  const prismLang    = LANG_MAP[displayLabel] || "javascript";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  return (
    <div style={styles.codeWrapper}>
      <div style={styles.codeHeader}>
        <span style={styles.codeLabel}>{displayLabel}</span>
        <button
          style={styles.copyBtn}
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={prismLang}
        style={oneDark}
        wrapLongLines={false}
        customStyle={styles.syntaxStyle}
        codeTagProps={{ style: styles.codeTag }}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

// memo — skips re-render if role + text + selectedLanguage unchanged
const MessageBubble = memo(({ role, text, selectedLanguage }) => {
  const segments = parseSegments(normalise(text));

  return (
    <div
      className={`d-flex mb-3 ${
        role === "user" ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <div style={role === "user" ? styles.userBubble : styles.aiBubble}>
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <CodeBlock
              key={i}
              language={seg.language}
              content={seg.content}
              selectedLanguage={selectedLanguage}
            />
          ) : (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
              {seg.content}
            </span>
          )
        )}
      </div>
    </div>
  );
});

const EmptyState = () => (
  <div
    className="h-100 d-flex flex-column justify-content-center align-items-center text-center"
    style={{ color: "#484f58" }}
  >
    <div style={{ fontSize: 56 }}>✦</div>
    <h5 className="mt-3 fw-semibold" style={{ color: "#8b949e" }}>
      Ask anything about your code
    </h5>
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

  // Conversation history kept in a ref so streaming closures always
  // see the latest value without stale captures
  const historyRef = useRef([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Only updates the last AI bubble — other bubbles stay untouched.
  // Combined with memo() this makes streaming feel word-by-word
  const updateLastAiBubble = (text) => {
    setChat((prev) => {
      const next            = [...prev];
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
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        ...payload,
        chatHistory: historyRef.current,
        stream:      true,
      }),
    });

    const reader    = res.body.getReader();
    const decoder   = new TextDecoder();
    let accumulated = "";
    let buffer      = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const chunks = buffer.split("\n\n");
      buffer       = chunks.pop();

      for (const chunk of chunks) {
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;

          let token = line.slice(6);

          try {
            token = JSON.parse(token);
          } catch {
            // raw string fallback
          }

          if (token === "[DONE]") return accumulated;

          accumulated += token;
          updateLastAiBubble(accumulated);
        }
      }
    }

    return accumulated;
  };

  const handleSend = async () => {
    if (!message.trim() && !code.trim()) return;

    const userText = message.trim() || `[${language} code]`;

    const payload = {
      message:  message.trim(),
      code:     code.trim(),
      language,
    };

    const bubbleText =
      message.trim() +
      (code.trim()
        ? (message.trim() ? "\n\n" : "") +
          "```" + language + "\n" + code.trim() + "\n```"
        : "");

    setMessage("");
    setCode("");
    setLoading(true);

    // Store language on each message so correct label + highlighting
    // is always used regardless of what AI outputs in its fence tag
    setChat((prev) => [
      ...prev,
      { role: "user", text: bubbleText || userText, language },
      { role: "ai",   text: "",                     language },
    ]);

    try {
      const aiReply = await streamResponse(mode, payload);
      if (aiReply) commitToHistory(bubbleText || userText, aiReply);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong." },
      ]);
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
      <div
        className="d-flex justify-content-between align-items-center px-4 py-3"
        style={styles.header}
      >
        <div>
          <h6
            className="m-0 fw-bold"
            style={{ color: "#e6edf3", letterSpacing: "0.3px" }}
          >
            ✦ AI Assistant
          </h6>
          <small style={{ color: "#484f58" }}>Your coding copilot</small>
        </div>
        <select
          className="form-select"
          style={styles.modeSelect}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Chat area ── */}
      <div
        className="flex-grow-1 overflow-auto px-3 py-4"
        style={styles.chatArea}
      >
        {chat.length === 0 && <EmptyState />}

        {chat.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            text={msg.text}
            selectedLanguage={msg.language}
          />
        ))}

        {loading && (
          <div style={{ color: "#484f58", fontSize: 13, paddingLeft: 4 }}>
            ✦ thinking…
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <style>
  {`
    .form-control::placeholder {
      color: #cfcece !important;
      opacity: 1 !important;
    }
  `}
</style>
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
          <button
            onClick={handleSend}
            disabled={loading}
            style={styles.sendBtn}
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIChatPage;