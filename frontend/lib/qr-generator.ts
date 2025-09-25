import QRCode from 'qrcode'
import { GamePhase, QRRarity } from './generated/prisma'

export interface QRMetadata {
  code: string
  name: string
  description?: string
  phase: GamePhase
  sequenceOrder: number // Only used internally, NOT in QR data
  rarity: QRRarity
  tokenReward: string
  hint?: {
    title: string
    content: string
  }
  // Additional metadata for verification
  timestamp: number
  version: string
}

// Ultra-secure QR metadata for generation (random ID only)
export interface SecureQRMetadata {
  code: string
}

export interface QRGenerationOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * Creates a QR code data string with ultra-minimal metadata
 * Uses anonymous format with only random ID - no branding or identifiable information
 * NOTE: Only random code included to prevent any metadata extraction
 */
export function createQRData(metadata: SecureQRMetadata): string {
  // Ultra-minimal anonymous format - only random ID
  return metadata.code
}

/**
 * Extracts metadata from a QR code data string
 * NEW FORMAT: [random_code] - completely anonymous
 * NOTE: Only random code - all other data must be fetched from database
 */
export function extractQRMetadata(qrData: string): { code: string } | null {
  try {
    // QR data is just the random code - no parsing needed
    const code = qrData.trim()
    
    // Basic validation - should be alphanumeric random string
    if (!code || code.length < 6 || !/^[A-Z0-9_]+$/.test(code)) {
      return null
    }

    return { code }
  } catch (error) {
    console.error('Failed to extract QR metadata:', error)
    return null
  }
}

/**
 * Generates a QR code image as data URL
 */
export async function generateQRCode(
  metadata: SecureQRMetadata,
  options: QRGenerationOptions = {}
): Promise<string> {
  const qrData = createQRData(metadata)
  
  const qrOptions = {
    width: options.width || 1024,
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H' as const
  }
  
  try {
    const dataUrl = await QRCode.toDataURL(qrData, qrOptions)
    return dataUrl
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error}`)
  }
}

/**
 * Generates a QR code as SVG string
 */
export async function generateQRCodeSVG(
  metadata: SecureQRMetadata,
  options: QRGenerationOptions = {}
): Promise<string> {
  const qrData = createQRData(metadata)
  
  const qrOptions = {
    width: options.width || 1024,
    margin: options.margin || 1,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H' as const
  }
  
  try {
    const svg = await QRCode.toString(qrData, { type: 'svg', ...qrOptions })
    return svg
  } catch (error) {
    throw new Error(`Failed to generate QR code SVG: ${error}`)
  }
}

/**
 * Validates QR metadata against expected values
 */
export function validateQRMetadata(
  scannedMetadata: QRMetadata,
  expectedCode: string
): { isValid: boolean; error?: string } {
  // Check if the scanned QR matches the expected code
  if (scannedMetadata.code !== expectedCode) {
    return {
      isValid: false,
      error: `Wrong QR code. Expected ${expectedCode}, got ${scannedMetadata.code}`
    }
  }
  
  // Check if QR is not too old (prevent replay attacks)
  const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
  if (Date.now() - scannedMetadata.timestamp > maxAge) {
    return {
      isValid: false,
      error: 'QR code has expired'
    }
  }
  
  // Check version compatibility
  if (scannedMetadata.version !== '1.0') {
    return {
      isValid: false,
      error: 'Unsupported QR code version'
    }
  }
  
  return { isValid: true }
}

/**
 * Creates a display-friendly QR code with metadata overlay
 */
export async function generateDisplayQRCode(
  metadata: SecureQRMetadata,
  options: QRGenerationOptions = {}
): Promise<{ qrCodeDataUrl: string; metadata: SecureQRMetadata }> {
  const qrCodeDataUrl = await generateQRCode(metadata, options)
  
  return {
    qrCodeDataUrl,
    metadata: metadata
  }
}
