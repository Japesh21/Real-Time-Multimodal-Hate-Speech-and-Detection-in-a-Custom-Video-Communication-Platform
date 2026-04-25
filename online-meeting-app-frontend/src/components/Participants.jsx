// src/components/Participants.jsx
// ✅ Shows mic 🎤/🔇 and camera 📷/🚫 icons for each participant

export default function Participants({ participants = [] }) {
  if (!participants || participants.length === 0) {
    return (
      <div className="participants-list">
        <p style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>
          No participants yet
        </p>
      </div>
    );
  }

  return (
    <div className="participants-list">
      
      {participants.map((p) => (
        <div key={p.id} className="participant-row">

          {/* AVATAR */}
          <div className="p-avatar">
            {p.initials || (p.name ? p.name[0].toUpperCase() : "?")}
          </div>

          {/* NAME + STATUS */}
          <div className="p-info">
            <div className="p-name">
              {p.name}
              {p.host && (
                <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 6 }}>
                  (You)
                </span>
              )}
            </div>
            <div className="p-status">
              {p.speaking ? "● Speaking" : !p.micOn ? "Muted" : "Listening"}
            </div>
          </div>

          {/* RIGHT SIDE — Host badge + Mic + Camera icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            
            {/* Host badge */}
            {p.host && (
              <div className="host-badge">Host</div>
            )}
            
            {/* Microphone icon */}
            <span
              title={p.micOn ? "Mic on" : "Muted"}
              style={{ 
                fontSize: 14, 
                opacity: p.micOn ? 0.9 : 0.3,
                transition: "opacity 0.2s ease"
              }}
            >
              {p.micOn ? "🎤" : "🔇"}
            </span>
            
            {/* Camera icon */}
            <span
              title={p.camOn ? "Camera on" : "Camera off"}
              style={{ 
                fontSize: 14, 
                opacity: p.camOn ? 0.9 : 0.3,
                transition: "opacity 0.2s ease"
              }}
            >
              {p.camOn ? "📷" : "🚫"}
            </span>
            
          </div>

        </div>
      ))}
    </div>
  );
}