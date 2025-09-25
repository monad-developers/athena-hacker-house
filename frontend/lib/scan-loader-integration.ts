// Integration guide for existing loader with enhanced QR scan API

export interface ScanResponse {
  success: boolean
  status: 'completed' | 'failed'
  message: string
  description: string
  timing?: {
    scanValidated: boolean
    transferCompleted: boolean
    totalDuration: number
  }
  scan?: {
    id: string
    tokensEarned: string
    transactionHash?: string
    qrCode: {
      name: string
      rarity: string
      sequenceOrder: number
    }
  }
  progress?: {
    currentSequence: number
    nextQrNeeded: number
    unlockedNewHint: boolean
  }
}

// Example integration with your existing loader
export class QRScanLoader {
  private loadingStates = [
    "🔍 Validating QR code...",
    "🚀 Preparing token transfer...", 
    "⏳ Confirming on blockchain...",
    "✨ Finalizing transaction..."
  ]

  async scanQRCode(qrData: string, onProgress?: (message: string) => void) {
    let currentState = 0
    
    // Show progressive loading messages
    const progressInterval = setInterval(() => {
      if (onProgress && currentState < this.loadingStates.length) {
        onProgress(this.loadingStates[currentState])
        currentState++
      }
    }, 800)

    try {
      // Make the API call
      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrData })
      })

      const result: ScanResponse = await response.json()

      clearInterval(progressInterval)

      if (result.success) {
        // Success! Show completion message
        onProgress?.(result.message)
        
        // Handle success - update UI, show tokens earned, unlock hints
        return {
          success: true,
          tokensEarned: result.scan?.tokensEarned,
          transactionHash: result.scan?.transactionHash,
          progress: result.progress,
          message: result.description
        }
      } else {
        // Handle error - show retry message
        onProgress?.(result.message)
        
        return {
          success: false,
          error: result.message,
          canRetry: response.status === 400, // 400 means can retry
          shouldContactSupport: response.status === 503 // 503 means system issue
        }
      }

    } catch {
      clearInterval(progressInterval)
      onProgress?.("❌ Network error - please try again")
      
      return {
        success: false,
        error: "Network connection failed",
        canRetry: true
      }
    }
  }
}

// Usage example:
/*
const loader = new QRScanLoader()

const result = await loader.scanQRCode(scannedData, (message) => {
  // Update your existing loader UI with this message
  setLoaderMessage(message)
})

if (result.success) {
  // Hide loader, show success animation
  // Update user stats, unlock hints
} else {
  // Hide loader, show error message with retry option
}
*/
