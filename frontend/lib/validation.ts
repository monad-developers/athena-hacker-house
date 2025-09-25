import { z } from 'zod'

// Ethereum address validation
export const ethereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')

// User validation schemas
export const createUserSchema = z.object({
  walletAddress: ethereumAddressSchema,
  nickname: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Nickname can only contain letters, numbers, and underscores'),
})

export const updateUserSchema = z.object({
  nickname: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Nickname can only contain letters, numbers, and underscores').optional(),
})

// QR Code validation schemas
export const qrCodeScanSchema = z.object({
  code: z.string().min(1, 'QR code cannot be empty'),
  walletAddress: ethereumAddressSchema,
})

export const createQRCodeSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  phase: z.enum(['PHASE_1', 'PHASE_2', 'PHASE_3']),
  sequenceOrder: z.number().int().min(1),
  rarity: z.enum(['NORMAL', 'RARE', 'LEGENDARY']),
  tokenReward: z.string().regex(/^\d+(\.\d{1,8})?$/, 'Invalid token amount'),
})

// Authentication validation schemas
export const walletConnectSchema = z.object({
  walletAddress: ethereumAddressSchema,
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  nickname: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Invalid nickname').optional(),
})

// Token transfer validation schemas
export const tokenTransferSchema = z.object({
  toAddress: ethereumAddressSchema,
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/, 'Invalid token amount'),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Helper function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Validation failed: ${errors}`)
  }
  
  return result.data
}

// Helper function to validate query parameters
export function validateQueryParams<T>(schema: z.ZodSchema<T>, params: Record<string, string | string[] | undefined>): T {
  // Convert string values to appropriate types
  const processedParams: Record<string, string | number | string[]> = {}
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    
    if (Array.isArray(value)) {
      processedParams[key] = value
    } else {
      // Try to convert to number if it looks like a number
      if (/^\d+$/.test(value)) {
        processedParams[key] = parseInt(value, 10)
      } else if (/^\d+\.\d+$/.test(value)) {
        processedParams[key] = parseFloat(value)
      } else {
        processedParams[key] = value
      }
    }
  }
  
  const result = schema.safeParse(processedParams)
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
    throw new Error(`Query validation failed: ${errors}`)
  }
  
  return result.data
}
