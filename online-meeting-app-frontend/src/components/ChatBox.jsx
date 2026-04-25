import { useEffect, useRef, useState } from "react";

export default function ChatBox({ socket, roomId, user = "You", onAlert }) {
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      setMessages((prev) => [
        ...prev,
        { ...data, self: data.sender === user },
      ]);
    };

    // ✅ ai-warning removed — Meeting.jsx handles it to avoid duplicates
    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("chat-message", handleMessage);
    };
  }, [socket, user]);

  // Auto scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMsg = () => {
    if (!msgInput.trim()) return;

    if (socket && roomId) {
      socket.emit("chat-message", {
        roomId: roomId,
        text: msgInput.trim(),
        sender: user,
      });
    }

    setMsgInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.self ? "self" : "other"}`}>
            {!m.self && (
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(226,232,240,0.35)",
                  paddingLeft: 4,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 2,
                  display: "block",
                }}
              >
                {m.sender}
              </span>
            )}
            <div className="bubble-text">{m.text}</div>
            <div className="bubble-meta">{m.time}</div>
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Message everyone..."
        />
        <button className="chat-send-btn" onClick={sendMsg}>
          ↑
        </button>
      </div>
    </div>
  );
}