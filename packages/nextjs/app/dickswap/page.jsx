"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

export default function Page() {
  const wallpaperUrl = "https://ih1.redbubble.net/image.2287184997.2100/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg";
  const [winState, setWinState] = useState("open"); // open | minimized | closed
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, mounted }) => {
        const connected = mounted && account;

        useEffect(() => {
          if (connected) {
            console.log("Connected wallet address:", account.address);
          }
        }, [connected, account]);

        return (
          <div style={desktopStyle(wallpaperUrl)} onClick={() => setStartMenuOpen(false)}>
            <div style={iconAreaStyle}>
              <DesktopIcon label="My Computer" />
              <DesktopIcon label="Recycle Bin" />
              <DesktopIcon label="Network" />
              <div onClick={() => setWinState("open")} style={{ cursor: "pointer" }}>
                <DesktopIcon label="Dickswap" />
              </div>
              <div onClick={openConnectModal} style={{ cursor: "pointer" }}>
                <DesktopIcon label="Connect Wallet" />
              </div>
            </div>

            {winState === "open" && (
              <Window95
                title="Dickswap"
                initialPosition={{ top: "20%", left: "25%" }}
                width={520}
                height={320}
                onMinimize={() => setWinState("minimized")}
                onClose={() => setWinState("closed")}
              >
                <div style={{ background: "#ffffff", border: "2px inset #a0a0a0", padding: 12, height: "100%" }}>
                  <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                    <Button95>Swap</Button95>
                    <Button95 disabled>Pool</Button95>
                    <Button95 disabled>Stake</Button95>
                  </div>
                  <div style={{ fontFamily: "Tahoma, Verdana, sans-serif", fontSize: 13, lineHeight: 1.4 }}>
                    <p style={{ margin: 0 }}>
                      Welcome to <b>Dickswap</b>. This is a placeholder app window with a classic Windows vibe.
                    </p>
                    <ul style={{ paddingLeft: 18, marginTop: 10, marginBottom: 0 }}>
                      <li>Retro chrome, beveled borders, and pixel-ish fonts.</li>
                      <li>A taskbar below shows the active window.</li>
                      <li>Icons on the desktop complete the old-school look.</li>
                    </ul>
                  </div>
                </div>
              </Window95>
            )}

            {startMenuOpen && <StartMenu95 onMenuItemClick={() => setStartMenuOpen(false)} />}
            <Taskbar95
              activeTitle="Dickswap"
              showButton={winState !== "closed"}
              active={winState === "open"}
              onTaskClick={() => setWinState(winState === "open" ? "minimized" : "open")}
              onStartClick={e => {
                e.stopPropagation();
                setStartMenuOpen(prev => !prev);
              }}
            />
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

function desktopStyle(url) {
  return {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    backgroundImage: `url(${url})`,
    backgroundSize: "contain",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "black",
    overflow: "hidden",
  };
}

const iconAreaStyle = {
  position: "absolute",
  top: 16,
  left: 16,
  display: "grid",
  gridTemplateColumns: "repeat(2, 90px)",
  gap: 16,
  zIndex: 2,
};

function DesktopIcon({ label }) {
  return (
    <div style={{ width: 90, textAlign: "center", color: "#ffffff", textShadow: "1px 1px 2px #000000" }}>
      <div
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 6px auto",
          background: "#ff69b4",
          border: "2px outset #ffffff",
          boxShadow: "inset -2px -2px 0 #00000055, inset 2px 2px 0 #ffffffaa",
        }}
      />
      <div style={{ fontFamily: "Tahoma, Verdana, sans-serif", fontSize: 12 }}>{label}</div>
    </div>
  );
}

function Window95({ title, children, initialPosition, width = 420, height = 260, onMinimize, onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: initialPosition?.top ?? "30%",
        left: initialPosition?.left ?? "30%",
        width,
        height,
        background: "#f5d5e5",
        border: "2px solid #000",
        boxShadow: "3px 3px 0 #000000a0",
        zIndex: 5,
      }}
    >
      <div style={titleBarStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={titleBarIconStyle} />
          <span style={titleTextStyle}>{title}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <TitleBarButton label="_" onClick={onMinimize} />
          <TitleBarButton label="□" />
          <TitleBarButton label="X" danger onClick={onClose} />
        </div>
      </div>
      <div style={{ padding: 6, height: `calc(100% - 28px)` }}>{children}</div>
    </div>
  );
}

const titleBarStyle = {
  height: 28,
  background: "linear-gradient(90deg, #8a2be2, #ff1493)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 6px",
  borderBottom: "2px solid #000",
};

const titleBarIconStyle = {
  width: 16,
  height: 16,
  background: "#ffffff",
  boxShadow: "inset 1px 1px 0 #000, inset -1px -1px 0 #000",
};

const titleTextStyle = {
  fontFamily: "Tahoma, Verdana, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
};

function TitleBarButton({ label, danger, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 22,
        height: 18,
        background: danger ? "#ff4f4f" : "#f5d5e5",
        color: danger ? "#fff" : "#000",
        border: "2px outset #ffffff",
        padding: 0,
        lineHeight: "16px",
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Button95({ children, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        background: disabled ? "#e0e0e0" : "#f5d5e5",
        color: "#000",
        border: "2px outset #ffffff",
        padding: "6px 10px",
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "default",
      }}
    >
      {children}
    </button>
  );
}

function Taskbar95({ activeTitle, showButton = true, active = false, onTaskClick, onStartClick }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = (hours % 12 || 12).toString();
      setTime(`${formattedHours}:${minutes} ${ampm}`);
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: 36,
        background: "#f5d5e5",
        borderTop: "2px solid #000",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 6px",
        zIndex: 10,
      }}
    >
      <button
        type="button"
        onClick={onStartClick}
        style={{
          background: "#f5d5e5",
          border: "2px outset #ffffff",
          padding: "4px 10px",
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 12,
          fontWeight: "bold",
          cursor: "pointer",
          color: "#000",
        }}
      >
        Start
      </button>
      <div style={{ display: "flex", gap: 6 }}>
        {showButton && <TaskButton95 title={activeTitle} active={active} onClick={onTaskClick} />}
      </div>
      <div
        style={{
          marginLeft: "auto",
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 12,
          border: "2px inset #a0a0a0",
          padding: "2px 6px",
          background: "#ffffff",
          color: "#000",
        }}
      >
        {time}
      </div>
    </div>
  );
}

function TaskButton95({ title, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 160,
        textAlign: "left",
        background: active ? "#e0e0e0" : "#f5d5e5",
        border: active ? "2px inset #a0a0a0" : "2px outset #ffffff",
        padding: "6px 10px",
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
        cursor: "pointer",
        color: "#000",
      }}
    >
      {title}
    </button>
  );
}

function StartMenu95({ onMenuItemClick }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed",
        left: 4,
        bottom: 40,
        width: 220,
        background: "#f5d5e5",
        border: "2px outset #ffffff",
        boxShadow: "3px 3px 0 #000000a0",
        zIndex: 20,
        display: "flex",
      }}
    >
      <div
        style={{
          width: 30,
          background: "linear-gradient(to bottom, #8a2be2, #ff1493)",
          color: "#fff",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          textAlign: "center",
          padding: "8px 0",
          fontFamily: "Tahoma, Verdana, sans-serif",
          fontSize: 18,
          fontWeight: "bold",
        }}
      >
        DickSwap
      </div>
      <div style={{ flex: 1, padding: "4px 0" }}>
        <Menu95Item label="Programs" />
        <Menu95Item label="Documents" />
        <Menu95Item label="Settings" />
        <hr style={{ margin: "4px 0", borderColor: "#a0a0a0", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />
        <Menu95Item label="Find" />
        <Menu95Item label="Help" />
        <Menu95Item label="Run..." />
        <hr style={{ margin: "4px 0", borderColor: "#a0a0a0", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />
        <Menu95Item label="Shut Down..." onClick={onMenuItemClick} />
      </div>
    </div>
  );
}

function Menu95Item({ label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "6px 12px 6px 24px",
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
        cursor: "pointer",
        color: "#000",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#ff1493")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {label}
    </div>
  );
}
