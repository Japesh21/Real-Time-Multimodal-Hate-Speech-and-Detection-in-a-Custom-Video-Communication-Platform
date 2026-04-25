// C:\Users\japes\OneDrive\Desktop\call\online-meeting-app-frontend\src\components\ControlBar.jsx

// Props (WebRTC-ready):
//   micOn:              boolean
//   camOn:              boolean
//   onToggleMic:        () => void
//   onToggleCam:        () => void
//   onShareScreen:      () => void
//   onLeave:            () => void
//   toggleChat:         () => void
//   toggleParticipants: () => void
//   sidebarTab:         'chat' | 'people' | null
//   sidebarOpen:        boolean
//   timer:              string  — formatted "HH:MM:SS"

export default function ControlBar({
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  onShareScreen,
  onLeave,
  toggleChat,
  toggleParticipants,
  sidebarTab,
  sidebarOpen,
  timer,
}) {
  return (
    <div className="control-bar">

      <button className="ctrl-btn" onClick={onToggleMic}>
        <div className={`ctrl-icon ${micOn ? "on" : "off"}`}>
          {micOn ? "🎤" : "🔇"}
        </div>
        <span className="ctrl-label">{micOn ? "Mute" : "Unmute"}</span>
      </button>

      <button className="ctrl-btn" onClick={onToggleCam}>
        <div className={`ctrl-icon ${camOn ? "on" : "off"}`}>
          {camOn ? "📷" : "🚫"}
        </div>
        <span className="ctrl-label">{camOn ? "Cam Off" : "Cam On"}</span>
      </button>

      <button className="screen-share-btn" onClick={onShareScreen}>
        <div className="screen-share-icon">🖥</div>
        <span className="ctrl-label" style={{ color: "rgba(226,232,240,0.4)" }}>Share</span>
      </button>

      <div className="ctrl-divider" />

      <button className="end-btn" onClick={onLeave}>⏹</button>

      <div className="ctrl-divider" />

      <button className="ctrl-btn" onClick={toggleParticipants}>
        <div className={`ctrl-icon ${sidebarOpen && sidebarTab === "people" ? "active-state" : "neutral"}`}>
          👥
        </div>
        <span className="ctrl-label">People</span>
      </button>

      <button className="ctrl-btn" onClick={toggleChat}>
        <div className={`ctrl-icon ${sidebarOpen && sidebarTab === "chat" ? "active-state" : "neutral"}`}>
          💬
        </div>
        <span className="ctrl-label">Chat</span>
      </button>

      {timer && (
        <div className="meeting-timer" style={{ marginLeft: 16 }}>
          ⏱ {timer}
        </div>
      )}

    </div>
  );
}
