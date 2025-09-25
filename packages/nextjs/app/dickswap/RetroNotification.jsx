"use client";

export default function RetroNotification({ show, onClose, title, message, emoji }) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 380,
        background: "#f5d5e5",
        border: "2px outset #ffffff",
        boxShadow: "3px 3px 0 #000000a0",
        zIndex: 200,
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Title bar */}
      <div style={{
        height: 28,
        background: "linear-gradient(90deg, #ff69b4, #ff1493)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px",
        borderBottom: "1px solid #000",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 16,
            height: 16,
            background: "#ffffff",
            border: "1px solid #000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10
          }}>
            !
          </div>
          <span style={{ fontWeight: "bold", fontSize: 12 }}>{title || "System Alert"}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 18,
            height: 16,
            background: "#ff4f4f",
            color: "#fff",
            border: "1px outset #ffffff",
            fontSize: 10,
            cursor: "pointer",
            padding: 0,
            fontFamily: "Tahoma, Verdana, sans-serif",
            fontWeight: "bold"
          }}
        >
          X
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        padding: 20,
        background: "#f5d5e5",
        display: "flex",
        alignItems: "center",
        gap: 16
      }}>
        {/* Icon area */}
        <div style={{
          width: 48,
          height: 48,
          background: "linear-gradient(45deg, #ff69b4, #ff1493)",
          border: "2px inset #ffffff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
          boxShadow: "inset -2px -2px 0 #00000033, inset 2px 2px 0 #ffffffaa"
        }}>
          {emoji || "⚠️"}
        </div>

        {/* Message area */}
        <div style={{ flex: 1 }}>
          <div style={{
            color: "#000",
            fontSize: 13,
            lineHeight: 1.4,
            marginBottom: 16,
            fontWeight: "normal"
          }}>
            {message}
          </div>

          {/* Button area */}
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                background: "#f5d5e5",
                color: "#000",
                border: "2px outset #ffffff",
                padding: "6px 16px",
                fontFamily: "Tahoma, Verdana, sans-serif",
                fontSize: 12,
                cursor: "pointer",
                minWidth: 80,
                boxShadow: "1px 1px 0 #00000055"
              }}
              onMouseDown={(e) => e.target.style.border = "2px inset #a0a0a0"}
              onMouseUp={(e) => e.target.style.border = "2px outset #ffffff"}
              onMouseLeave={(e) => e.target.style.border = "2px outset #ffffff"}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      {/* Retro decorative border pattern */}
      <div style={{
        height: 4,
        background: "repeating-linear-gradient(90deg, #ff69b4 0px, #ff69b4 4px, #ff1493 4px, #ff1493 8px)",
        borderTop: "1px solid #000"
      }} />
    </div>
  );
}
