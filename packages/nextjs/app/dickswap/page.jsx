"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import CameraWindow95 from "./CameraWindow95";


import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';

// 2. Add this ABI constant (after the imports, before the Page component)
const BONDING_CURVE_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "ethAmount", "type": "uint256" }],
    "name": "calculateBuyReturn",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }],
    "name": "calculateSellReturn",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }],
    "name": "sell",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = "0xC7B6788316A38aF04e7F1BE09BfFA63575dD8D64";

function TransactionNotification({ hash, onClose }) {
  const explorerUrl = `https://testnet.monadexplorer.com/tx/${hash}`;
  const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 320,
        background: "#f5d5e5",
        border: "2px outset #ffffff",
        boxShadow: "3px 3px 0 #000000a0",
        zIndex: 100,
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
      }}
    >
      {/* Title bar */}
      <div style={{
        height: 24,
        background: "linear-gradient(90deg, #8a2be2, #ff1493)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6px",
        borderBottom: "1px solid #000",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 12,
            height: 12,
            background: "#ffffff",
            border: "1px solid #000"
          }} />
          <span style={{ fontWeight: "bold", fontSize: 11 }}>Transaction Complete</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 16,
            height: 14,
            background: "#ff4f4f",
            color: "#fff",
            border: "1px outset #ffffff",
            fontSize: 10,
            cursor: "pointer",
            padding: 0
          }}
        >
          X
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 8, color: "#000", fontWeight: "bold" }}>
          Swap Successful! 🎉
        </div>

        <div style={{ marginBottom: 8, color: "#000" }}>
          Transaction Hash:
        </div>

        <div style={{
          padding: "4px 6px",
          background: "#ffffff",
          border: "1px inset #a0a0a0",
          fontFamily: "Courier New, monospace",
          fontSize: 10,
          color: "#000",
          marginBottom: 8,
          wordBreak: "break-all"
        }}>
          {shortHash}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <Button95
            style={{ fontSize: 10, padding: "4px 8px" }}
            onClick={() => {
              navigator.clipboard.writeText(hash);
            }}
          >
            Copy Hash
          </Button95>

          <Button95
            style={{ fontSize: 10, padding: "4px 8px", background: "#90EE90" }}
            onClick={() => window.open(explorerUrl, '_blank')}
          >
            View on Explorer
          </Button95>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const wallpaperUrl = "https://ih1.redbubble.net/image.2287184997.2100/bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.jpg";
  const [winState, setWinState] = useState("closed"); // open | minimized | closed
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [monAmount, setMonAmount] = useState("100");
  const [showCamera, setShowCamera] = useState(false);



  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, mounted }) => {
        const connected = mounted && account;

        useEffect(() => {
          if (connected) {
            console.log("Connected wallet address:", account.address);
          }
        }, [connected, account]);

        const { writeContract, data: hash, isPending, error } = useWriteContract();
        const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

        const [txNotification, setTxNotification] = useState(null);
        const [isSwapReversed, setIsSwapReversed] = useState(false); // false = ETH->TOKEN, true = TOKEN->ETH


        const { data: tokenAmount } = useReadContract({
          address: CONTRACT_ADDRESS,
          abi: BONDING_CURVE_ABI,
          functionName: isSwapReversed ? 'calculateSellReturn' : 'calculateBuyReturn',
          args: monAmount && parseFloat(monAmount) > 0 ? [parseEther(monAmount)] : [0n],
          query: {
            enabled: monAmount && parseFloat(monAmount) > 0,
          },
        });

        const { data: userTokenBalance } = useReadContract({
          address: CONTRACT_ADDRESS,
          abi: BONDING_CURVE_ABI,
          functionName: 'balanceOf',
          args: account ? [account.address] : undefined,
          query: {
            enabled: !!account && isSwapReversed,
          },
        });

        useEffect(() => {
          if (isConfirmed && hash) {
            setTxNotification({
              hash: hash,
              timestamp: Date.now()
            });

            // Auto-hide after 10 seconds
            const timer = setTimeout(() => {
              setTxNotification(null);
            }, 10000);

            return () => clearTimeout(timer);
          }
        }, [isConfirmed, hash]);

        const handleSwap = async (connected) => {
          console.log("handleSwap called", { connected, monAmount, sliderValue, isSwapReversed });

          if (!connected) {
            console.log("Wallet not connected");
            return;
          }

          if (!monAmount || parseFloat(monAmount) <= 0) {
            console.log("Invalid amount:", monAmount);
            return;
          }

          try {
            if (isSwapReversed) {
              // Selling tokens for ETH
              console.log("Attempting to sell tokens:", monAmount);
              writeContract({
                address: CONTRACT_ADDRESS,
                abi: BONDING_CURVE_ABI,
                functionName: 'sell',
                args: [parseEther(monAmount)],
              });
            } else {
              // Buying tokens with ETH
              console.log("Attempting to buy tokens with ETH:", monAmount);
              writeContract({
                address: CONTRACT_ADDRESS,
                abi: BONDING_CURVE_ABI,
                functionName: 'buy',
                value: parseEther(monAmount),
              });
            }
          } catch (err) {
            console.error('Transaction failed:', err);
          }
        };

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
                height={380}
                onMinimize={() => setWinState("minimized")}
                onClose={() => setWinState("closed")}
              >
                <div style={{ background: "#ffffff", border: "2px inset #a0a0a0", padding: 12, height: "100%" }}>
                  <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                    <Button95>Swap</Button95>
                    <Button95 disabled>Pool</Button95>
                    <Button95 disabled>Stake</Button95>
                  </div>
                  <SwapInterface95
                    monAmount={monAmount}
                    onMonAmountChange={setMonAmount}
                    tokenAmount={tokenAmount ? formatEther(tokenAmount) : "0.00"}
                    isSwapReversed={isSwapReversed}
                    onSwapReverse={() => {
                      setIsSwapReversed(!isSwapReversed);
                      setMonAmount(""); // Clear amount when switching
                    }}
                    userTokenBalance={userTokenBalance}
                  />                  <Slider95
                    title="choose your size (slippage)"
                    value={sliderValue}
                    onChange={e => setSliderValue(parseInt(e.target.value, 10))}
                    min={0}
                    max={16}
                    unit="in"
                  />
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                    <Button95
                      disabled={
                        !connected ||
                        sliderValue === 0 ||
                        !monAmount ||
                        parseFloat(monAmount) <= 0 ||
                        isPending ||
                        isConfirming ||
                        (isSwapReversed && userTokenBalance && parseFloat(monAmount) > parseFloat(formatEther(userTokenBalance)))
                      }
                      style={{
                        padding: "8px 24px",
                        fontSize: 14,
                        fontWeight: "bold",
                        backgroundColor: (!connected || sliderValue === 0 || !monAmount || parseFloat(monAmount) <= 0 || isPending || isConfirming)
                          ? "#e0e0e0"
                          : "#90EE90"
                      }}
                      onClick={() => {
                        if (sliderValue > 6) {
                          setShowCamera(true);
                        } else {
                          handleSwap(connected);
                        }
                      }}
                    >
                      {!connected
                        ? 'Connect Wallet'
                        : isPending
                          ? 'Confirming...'
                          : isConfirming
                            ? 'Processing...'
                            : 'Swap'
                      }
                    </Button95>
                  </div>
                </div>
              </Window95>
            )}

            {startMenuOpen && <StartMenu95 onMenuItemClick={() => setStartMenuOpen(false)} />}
            {showCamera && <CameraWindow95 onClose={() => setShowCamera(false)} />}
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
            {txNotification && (
              <TransactionNotification
                hash={txNotification.hash}
                onClose={() => setTxNotification(null)}
              />
            )}
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

function Button95({ children, disabled, style = {}, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? "#e0e0e0" : "#f5d5e5",
        color: "#000",
        border: "2px outset #ffffff",
        padding: "6px 10px",
        fontFamily: "Tahoma, Verdana, sans-serif",
        fontSize: 12,
        cursor: disabled ? "not-allowed" : "default",
        ...style,
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


function SwapInterface95({ monAmount, onMonAmountChange, tokenAmount, isSwapReversed, onSwapReverse, userTokenBalance }) {
  const fromToken = isSwapReversed ? 'TOKEN' : 'ETH';
  const toToken = isSwapReversed ? 'ETH' : 'TOKEN';
  const maxAmount = isSwapReversed && userTokenBalance ? formatEther(userTokenBalance) : null;

  return (
    <div style={{ margin: "20px 0", fontFamily: "Tahoma, Verdana, sans-serif", fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Left box - From token */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 4, color: "#000", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
            <span>{fromToken}</span>
            {maxAmount && (
              <span style={{ fontSize: 10, color: "#666" }}>
                Balance: {parseFloat(maxAmount).toFixed(4)}
              </span>
            )}
          </div>
          <input
            type="text"
            value={monAmount}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                onMonAmountChange(value);
              }
            }}
            style={{
              width: "100%",
              padding: "8px",
              border: "2px inset #a0a0a0",
              background: "#ffffff",
              color: "#000",
              fontFamily: "Tahoma, Verdana, sans-serif",
              fontSize: 12,
              outline: "none",
            }}
            placeholder="0.0"
          />
          {maxAmount && (
            <div style={{ marginTop: 4 }}>
              <button
                onClick={() => onMonAmountChange(maxAmount)}
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  background: "#e0e0e0",
                  border: "1px outset #a0a0a0",
                  cursor: "pointer"
                }}
              >
                MAX
              </button>
            </div>
          )}
        </div>

        {/* Swap button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          marginTop: 16
        }}>
          <button
            onClick={onSwapReverse}
            style={{
              fontSize: 16,
              color: "#8a2be2",
              fontWeight: "bold",
              textShadow: "1px 1px 0 #000",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => e.target.style.background = "#f0f0f0"}
            onMouseLeave={(e) => e.target.style.background = "none"}
          >
            ⇄
          </button>
        </div>

        {/* Right box - To token */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 4, color: "#000", fontWeight: "bold" }}>{toToken}</div>
          <div
            style={{
              width: "100%",
              padding: "8px",
              border: "2px inset #a0a0a0",
              background: "#e0e0e0",
              color: "#666",
              fontFamily: "Tahoma, Verdana, sans-serif",
              fontSize: 12,
              minHeight: "16px",
            }}
          >
            {tokenAmount && parseFloat(tokenAmount) > 0 ? parseFloat(tokenAmount).toFixed(6) : "0.00"}
          </div>
        </div>
      </div>
    </div>
  );

}

function Slider95({ title, value, min, max, unit, onChange }) {
  const clamped = Math.max(min, Math.min(max, value));
  const normalized = (clamped - min) / (max - min || 1); // 0..1
  const thumbSize = Math.round(24 + normalized * 24); // 24px .. 48px
  return (
    <div style={{ fontFamily: "Tahoma, Verdana, sans-serif", fontSize: 12, margin: "20px 0", color: "#000" }}>
      <div style={{ marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          className="slider95"
          style={{
            flexGrow: 1,
            cursor: "pointer",
            "--thumb-size": `${thumbSize + 2}px`,
          }}
        />
        <div
          style={{
            width: 70,
            textAlign: "center",
            padding: "4px",
            border: "2px inset #a0a0a0",
            background: "#ffffff",
          }}
        >
          {value} {unit}
        </div>
      </div>
      <style jsx>{`
        .slider95 {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: linear-gradient(90deg, #8a2be2, #ff1493);
          border: 2px inset #a0a0a0;
          border-radius: 2px;
        }
        .slider95:focus { outline: none; }

        /* WebKit */
        .slider95::-webkit-slider-runnable-track {
          height: 8px;
          background: linear-gradient(90deg, #8a2be2, #ff1493);
        }
        .slider95::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: var(--thumb-size, 28px);
          height: var(--thumb-size, 28px);
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g stroke='%23000' stroke-width='1'><circle cx='14' cy='6' r='5' fill='%23ff1493'/><rect x='12' y='6' width='4' height='10' rx='2' fill='%23ff1493'/><circle cx='10' cy='20' r='4' fill='%23f5d5e5'/><circle cx='18' cy='20' r='4' fill='%23f5d5e5'/></g></svg>");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          border: none;
          margin-top: calc((8px - var(--thumb-size, 28px)) / 2);
          cursor: pointer;
        }

        /* Firefox */
        .slider95::-moz-range-track {
          height: 8px;
          background: linear-gradient(90deg, #8a2be2, #ff1493);
          border: none;
        }
        .slider95::-moz-range-thumb {
          width: var(--thumb-size, 28px);
          height: var(--thumb-size, 28px);
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g stroke='%23000' stroke-width='1'><circle cx='14' cy='6' r='5' fill='%23ff1493'/><rect x='12' y='6' width='4' height='10' rx='2' fill='%23ff1493'/><circle cx='10' cy='20' r='4' fill='%23f5d5e5'/><circle cx='18' cy='20' r='4' fill='%23f5d5e5'/></g></svg>");
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
