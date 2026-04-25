// C:\Users\japes\OneDrive\Desktop\call\online-meeting-app-frontend\src\components\AlertPanel.jsx

export default function AlertPanel({ alerts = [] }) {
  return (
    <div
      style={{
        background: "rgba(15,15,25,0.95)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: 10,
        padding: "10px 12px",
        marginTop: 8,
        maxHeight: 140,
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: 13 }}>🚨</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "rgba(226,232,240,0.7)",
            fontFamily: "JetBrains Mono, monospace",
            textTransform: "uppercase",
          }}
        >
          AI Alerts
        </span>

        {alerts.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(239,68,68,0.2)",
              color: "#ef4444",
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 20,
              padding: "1px 7px",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {alerts.length}
          </span>
        )}
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <div
          style={{
            fontSize: 11,
            color: "rgba(226,232,240,0.3)",
            fontFamily: "JetBrains Mono, monospace",
            textAlign: "center",
            padding: "10px 0",
          }}
        >
          No alerts detected
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {alerts.map((a, i) => {
            // ✅ Detect alert type using emojis
            const isVideo = a.includes("🎥");
            const isAudio = a.includes("⚠️") || a.includes("⚠");
            const isSystem = a.includes("🤖") || a.includes("🛑");
            const isChat = a.includes("🚨") || a.includes("💬");

            // ✅ Border color logic
            const borderColor = isSystem
              ? "rgba(34,197,94,0.5)"     // Green
              : isVideo
              ? "rgba(99,102,241,0.6)"    // Indigo
              : isAudio
              ? "rgba(251,191,36,0.6)"    // Yellow
              : isChat
              ? "rgba(239,68,68,0.6)"     // Red
              : "rgba(148,163,184,0.4)";  // Default Gray

            // ✅ Background color logic
            const bgColor = isSystem
              ? "rgba(34,197,94,0.08)"
              : isVideo
              ? "rgba(99,102,241,0.10)"
              : isAudio
              ? "rgba(251,191,36,0.08)"
              : isChat
              ? "rgba(239,68,68,0.08)"
              : "rgba(148,163,184,0.06)";

            return (
              <div
                key={i}
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 6,
                  padding: "6px 9px",
                  fontSize: 11,
                  color: "rgba(226,232,240,0.9)",
                  fontFamily: "Syne, sans-serif",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  transition: "all 0.2s ease",
                }}
              >
                {a}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}