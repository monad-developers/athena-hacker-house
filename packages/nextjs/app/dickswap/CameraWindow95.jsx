"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraWindow95({ onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSequence, setShowSequence] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const messages = [
    "rendering video",
    "verifying your size", 
    "confirming results"
  ];

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setIsLoading(false);
        
        // Start the sequence after camera loads
        setTimeout(() => {
          setShowSequence(true);
        }, 1000);
        
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Camera access denied or not available");
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle the 5-second sequence
  useEffect(() => {
    if (!showSequence) return;
    
    const intervals = [];
    
    // Change message every ~1.5 seconds
    intervals.push(setTimeout(() => setCurrentMessage(1), 1500));
    intervals.push(setTimeout(() => setCurrentMessage(2), 3000));
    
    // Close after 5 seconds and show notification
    intervals.push(setTimeout(() => {
      handleClose();
      // Show notification after a brief delay
      setTimeout(() => {
        onClose("showNotification");
      }, 200);
    }, 5000));
    
    return () => intervals.forEach(clearTimeout);
  }, [showSequence]);

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "15%",
        left: "35%",
        width: 280,
        height: 520,
        background: "#f5d5e5",
        border: "2px solid #000",
        boxShadow: "3px 3px 0 #000000a0",
        zIndex: 15,
        fontFamily: "Tahoma, Verdana, sans-serif",
      }}
    >
      {/* Title Bar */}
      <div style={{
        height: 28,
        background: "linear-gradient(90deg, #8a2be2, #ff1493)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6px",
        borderBottom: "2px solid #000",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 16,
            height: 16,
            background: "#ffffff",
            boxShadow: "inset 1px 1px 0 #000, inset -1px -1px 0 #000",
          }} />
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.2,
          }}>
            DickCam
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          style={{
            width: 22,
            height: 18,
            background: "#ff4f4f",
            color: "#fff",
            border: "2px outset #ffffff",
            padding: 0,
            lineHeight: "16px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          X
        </button>
      </div>

      {/* Content */}
      <div style={{
        padding: 6,
        height: "calc(100% - 28px)",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{
          padding: 12,
          height: "100%",
          background: "#ffffff",
          border: "2px inset #a0a0a0",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
          }}>
            {isLoading && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                fontSize: 12,
                color: "#000",
              }}>
                Initializing camera...
              </div>
            )}

            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                fontSize: 12,
                color: "#ff0000",
                textAlign: "center",
                padding: 20,
              }}>
                {error}
              </div>
            )}

            {!isLoading && !error && (
              <>
                <div style={{
                  border: "2px inset #a0a0a0",
                  background: "#000",
                  padding: 4,
                  marginBottom: 12,
                  width: 248,
                  height: 450,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      maxWidth: 240,
                      maxHeight: 420,
                      display: "block",
                      border: "1px solid #000",
                      objectFit: "cover",
                    }}
                  />
                </div>
                
                {/* Sequence Messages */}
                {showSequence && (
                  <div style={{
                    marginTop: 8,
                    padding: 8,
                    background: "#dcdcdc",
                    border: "2px inset #a0a0a0",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    fontFamily: "MS Sans Serif, sans-serif"
                  }}>
                    {/* Retro Blue Loader */}
                    <div style={{
                      width: 16,
                      height: 16,
                      background: "linear-gradient(45deg, #0080ff, #004080)",
                      border: "1px inset #ffffff",
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation: "retroSpin 1s linear infinite",
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        background: "#ffffff",
                        borderRadius: "50%",
                        animation: "retroPulse 0.8s ease-in-out infinite alternate"
                      }} />
                    </div>
                    
                    <span style={{ color: "#000080", fontWeight: "normal" }}>
                      {messages[currentMessage]}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes retroSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes retroPulse {
          0% { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
