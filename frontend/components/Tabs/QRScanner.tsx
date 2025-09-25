"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, X, CheckCircle, Coins } from "lucide-react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { formatTokens, getRarityEmoji } from "@/lib/api-client";
import { extractQRMetadata } from "@/lib/qr-generator";
import QrScanner from "qr-scanner";

interface QRScannerProps {
  onQRScanned: (qrCode: string) => void;
  expectedQR: number;
  onClose: () => void;
}

type ScanState = "scanning" | "verifying" | "success" | "error";

export function QRScanner({
  onQRScanned,
  expectedQR,
  onClose,
}: QRScannerProps) {
  // QR Scanner refs and states - simplified like sample
  const scanner = useRef<QrScanner | null>(null);
  const videoEl = useRef<HTMLVideoElement>(null);
  const qrBoxEl = useRef<HTMLDivElement>(null);
  const [qrOn, setQrOn] = useState<boolean>(false);

  // Debouncing for duplicate scans
  const lastScannedCodeRef = useRef<string>("");
  const lastScanTimeRef = useRef<number>(0);

  // UI states
  const [error, setError] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [extractedMetadata, setExtractedMetadata] = useState<{
    code: string;
  } | null>(null);

  const {
    isProcessing,
    result: scanResult,
    error: scanError,
    processQRCode,
    clearResult,
  } = useQRScanner();

  // Success handler - simplified like sample
  const onScanSuccess = useCallback(
    async (result: QrScanner.ScanResult) => {
      const qrCode = result.data;
      const now = Date.now();

      // Prevent duplicate scans: same QR code within 2 seconds
      if (
        !qrCode ||
        isProcessing ||
        (lastScannedCodeRef.current === qrCode &&
          now - lastScanTimeRef.current < 2000)
      ) {
        return;
      }

      // Update scan tracking
      lastScannedCodeRef.current = qrCode;
      lastScanTimeRef.current = now;

      // ✅ Handle success.
      // Step 1: Extract and validate QR metadata locally first
      const metadata = extractQRMetadata(qrCode.trim());
      if (!metadata) {
        setScanState("error");
        setError(
          "Invalid QR code format. Please scan a Token Crunchies QR code."
        );

        setTimeout(() => {
          setScanState("scanning");
          setError("");
        }, 3000);
        return;
      }

      setExtractedMetadata(metadata);

      // Step 2: Show verifying state
      setScanState("verifying");
      setError("");

      try {
        // Process QR code with backend (send the original QR string)
        const processResult = await processQRCode(qrCode.trim());

        if (processResult.success && processResult.result) {
          // Step 3: Show success state
          setScanState("success");

          // Step 4: Auto-navigate back after showing success
          setTimeout(() => {
            onQRScanned(qrCode.trim());
            onClose();
            clearResult();
          }, 4000);
        } else {
          // Show error state
          setScanState("error");
          setError(processResult.error || scanError || "QR scan failed");

          setTimeout(() => {
            setScanState("scanning");
            setError("");
            setExtractedMetadata(null);
          }, 3000);
        }
      } catch (error) {
        setScanState("error");
        setError(error instanceof Error ? error.message : "QR scan failed");

        setTimeout(() => {
          setScanState("scanning");
          setError("");
          setExtractedMetadata(null);
        }, 3000);
      }
    },
    [isProcessing, processQRCode, clearResult, onClose, onQRScanned, scanError]
  );

  // Fail handler - simplified like sample
  const onScanFail = useCallback((err: string | Error) => {
    // 🖨 Print the "err" to browser console.
    console.log(err);
  }, []);

  // Initialize scanner - simplified like sample
  useEffect(() => {
    const initializeScanner = async () => {
      if (videoEl?.current && !scanner.current) {
        try {
          // Check if camera is available first
          const hasCamera = await QrScanner.hasCamera();
          if (!hasCamera) {
            setError("No camera found on this device");
            setQrOn(false);
            return;
          }

          // 👉 Instantiate the QR Scanner
          scanner.current = new QrScanner(videoEl?.current, onScanSuccess, {
            onDecodeError: onScanFail,
            // 📷 This is the camera facing mode. In mobile devices, "environment" means back camera and "user" means front camera.
            preferredCamera: "environment",
            // 🖼 This will help us position our "QrFrame.svg" so that user can only scan when qr code is put in between our QrFrame.svg.
            highlightScanRegion: true,
            // 🔥 This will produce a yellow (default color) outline around the qr code that we scan, showing a proof that our qr-scanner is scanning that qr code.
            highlightCodeOutline: true,
            // 📦 A custom div which will pair with "highlightScanRegion" option above 👆. This gives us full control over our scan region.
            overlay: qrBoxEl?.current || undefined,
          });

          // 🚀 Start QR Scanner
          await scanner?.current?.start();
          setQrOn(true);
          setError(""); // Clear any previous errors
        } catch (err: unknown) {
          console.error("❌ QR Scanner failed to start:", err);
          setQrOn(false);

          // Better error messages based on error type
          if (err instanceof Error) {
            if (err.name === "NotAllowedError") {
              setError(
                "Camera access denied. Please allow camera permissions and refresh the page."
              );
            } else if (err.name === "NotFoundError") {
              setError("No camera found on this device.");
            } else if (err.name === "NotSupportedError") {
              setError("Camera not supported on this device.");
            } else {
              setError(`Camera error: ${err.message}`);
            }
          } else {
            setError(`Camera error: ${String(err)}`);
          }
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initializeScanner, 100);

    // 🧹 Clean up on unmount.
    // 🚨 This removes the QR Scanner from rendering and using camera when it is closed or removed from the UI.
    return () => {
      clearTimeout(timer);
      if (scanner?.current) {
        scanner?.current?.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScanSuccess, onScanFail]);

  if (scanState === "verifying") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-black mb-2">Verifying QR...</h3>

          {extractedMetadata && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="text-sm text-gray-600 mb-2">
                <strong>QR Code:</strong> {extractedMetadata.code}
              </div>
              <div className="text-sm text-gray-500">
                Validating with server...
              </div>
            </div>
          )}

          <p className="text-gray-600">
            Please approve the transaction in your wallet
          </p>
        </div>
      </div>
    );
  }

  // Success State
  if (scanState === "success" && scanResult?.success && scanResult.scan) {
    const { scan, phaseAdvancement, userStats } = scanResult;

    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center px-8 max-w-md">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-4xl font-bold text-black mb-4">Success!</h2>

          {/* QR Code Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">
                {getRarityEmoji(scan.qrCode.rarity)}
              </span>
              <h3 className="text-xl font-semibold text-black">
                {scan.qrCode.name}
              </h3>
            </div>
            {scan.qrCode.description && (
              <p className="text-sm text-gray-600 mb-3">
                {scan.qrCode.description}
              </p>
            )}
            <div className="text-3xl font-bold text-green-600 mb-1">
              +{formatTokens(scan.tokensEarned)}
            </div>
            <div className="text-lg text-gray-600">tokens earned!</div>
          </div>

          {/* Phase Advancement */}
          {phaseAdvancement?.advanced && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-bold text-purple-800 mb-1">Level Up!</h4>
              <p className="text-sm text-purple-600">
                {phaseAdvancement.message}
              </p>
            </div>
          )}

          {/* Transaction Status */}
          {scan.transactionHash ? (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>Tokens transferred to your wallet!</span>
            </div>
          ) : (
            <div className="text-sm text-yellow-600 mb-4">
              Token transfer in progress...
            </div>
          )}

          {/* Updated Stats */}
          {userStats && (
            <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4" />
                <span>{formatTokens(userStats.totalTokens)} total</span>
              </div>
              <div>
                <span>{userStats.qrCodesScanned} QRs found</span>
              </div>
            </div>
          )}

          <p className="text-gray-500">Returning to dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (scanState === "error") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-black mb-2">Error</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Scanning State (Default)
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="bg-white rounded-full p-2 shadow-lg"
        >
          <X className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {/* QR Scanner Video */}
        <video ref={videoEl} className="w-full h-full object-cover"></video>

        {/* QR Box overlay */}
        <div
          ref={qrBoxEl}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <div className="w-64 h-64 border-4 border-white rounded-lg relative">
              {/* Corner guides */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white"></div>
            </div>
            <p className="text-white text-center mt-4 text-lg">
              Looking for QR #{expectedQR}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black bg-opacity-75 p-6">
        <div className="text-center mb-4">
          <p className="text-white text-sm mb-2">
            Point your camera at QR code #{expectedQR}
          </p>
          <p className="text-gray-400 text-xs">Looking for random QR codes</p>
        </div>

        {error && (
          <div className="bg-red-500 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="text-white text-sm">{error}</span>
          </div>
        )}

        <p className="text-gray-400 text-xs text-center mt-4">
          {qrOn
            ? "Camera is active - point at QR code to scan"
            : "Initializing camera..."}
        </p>
      </div>
    </div>
  );
}
