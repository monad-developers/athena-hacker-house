/**
 * QR Scanner hook for Token Crunchies
 * Manages QR code scanning with backend validation and token rewards
 */

import { useState, useCallback } from 'react'
import { apiClient, QRScanResult } from '@/lib/api-client'

export interface QRScanState {
  isScanning: boolean
  isProcessing: boolean
  result: QRScanResult | null
  error: string | null
  lastScannedCode: string | null
}

export function useQRScanner() {
  const [state, setState] = useState<QRScanState>({
    isScanning: false,
    isProcessing: false,
    result: null,
    error: null,
    lastScannedCode: null
  })

  // Start scanning session
  const startScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isScanning: true,
      isProcessing: false,
      result: null,
      error: null
    }))
  }, [])

  // Stop scanning session
  const stopScanning = useCallback(() => {
    setState(prev => ({
      ...prev,
      isScanning: false,
      isProcessing: false
    }))
  }, [])

  // Process scanned QR code
  const processQRCode = useCallback(async (qrCode: string): Promise<{
    success: boolean
    result?: QRScanResult
    error?: string
  }> => {
    if (!qrCode || state.isProcessing) {
      return { success: false, error: 'Invalid QR code or already processing' }
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      lastScannedCode: qrCode
    }))

    try {
      const response = await apiClient.scanQR(qrCode)

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          result: response.data!,
          error: null
        }))

        return {
          success: true,
          result: response.data
        }
      } else {
        const errorMessage = response.error || 'QR scan failed'
        setState(prev => ({
          ...prev,
          isProcessing: false,
          result: null,
          error: errorMessage
        }))

        return {
          success: false,
          error: errorMessage
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'QR scan failed'
      setState(prev => ({
        ...prev,
        isProcessing: false,
        result: null,
        error: errorMessage
      }))

      return {
        success: false,
        error: errorMessage
      }
    }
  }, [state.isProcessing])

  // Clear scan result
  const clearResult = useCallback(() => {
    setState(prev => ({
      ...prev,
      result: null,
      error: null
    }))
  }, [])

  // Reset scanner state
  const reset = useCallback(() => {
    setState({
      isScanning: false,
      isProcessing: false,
      result: null,
      error: null,
      lastScannedCode: null
    })
  }, [])

  return {
    ...state,
    startScanning,
    stopScanning,
    processQRCode,
    clearResult,
    reset,
    // Computed values
    canScan: !state.isProcessing,
    hasResult: !!state.result,
    hasError: !!state.error
  }
}
