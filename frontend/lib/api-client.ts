/**
 * API Client for Token Crunchies Backend
 * Handles all API communication with authentication
 */

// Authentication simplified - no longer using message signing

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface LeaderboardEntry {
  userId: string
  nickname: string
  totalTokens: string
  qrCodesScanned: number
  rareQRsScanned: number
  legendaryQRsScanned: number
  lastScanAt: string | null
  updatedAt: string
  rank: number
}

export interface LeaderboardResponse {
  success: boolean
  leaderboard: LeaderboardEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: {
    totalUsers: number
    totalTokensDistributed: string
    totalQRsScanned: number
    topPlayer: {
      nickname: string
      totalTokens: string
      qrCodesScanned: number
    } | null
    phaseDistribution: Record<string, number>
  }
  sortBy: string
}

export interface UserProfile {
  id: string
  walletAddress: string
  nickname: string
  totalTokens: string
  qrCodesScanned: number
  currentPhase: string
  lastScannedAt: string | null
  createdAt: string
  scannedQRs: Array<{
    id: string
    tokensEarned: string
    scannedAt: string
    transactionHash: string | null
    transferStatus: string
    qrCode: {
      name: string
      rarity: string
      phase: string
      sequenceOrder: number
    }
  }>
  leaderboard: {
    rank: number | null
    rareQRsScanned: number
    legendaryQRsScanned: number
  } | null
  phaseProgress: {
    currentPhase: string
    totalQRs: number
    scannedQRs: number
    progress: number
    nextQR: {
      id: string
      name: string
      sequenceOrder: number
      rarity: string
      hint: {
        title: string
        content: string
      } | null
    } | null
    isPhaseComplete: boolean
  }
}

export interface QRScanResult {
  success: boolean
  scan?: {
    id: string
    tokensEarned: string
    transactionHash: string | null
    qrCode: {
      name: string
      description: string | null
      rarity: string
      phase: string
      sequenceOrder: number
    }
  }
  phaseAdvancement?: {
    advanced: boolean
    newPhase: string
    message: string
  } | null
  userStats?: {
    totalTokens: string
    qrCodesScanned: number
  }
  error?: string
}


export interface QRHint {
  id: string
  name: string
  description: string | null
  sequenceOrder: number
  rarity: string
  tokenReward: string
  isScanned: boolean
  hint: {
    title: string
    content: string
  } | null
  hintAvailable: boolean
  hintLocked: boolean
}

class TokenCrunchiesAPI {
  private baseUrl: string
  private walletAddress: string | null = null

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  // Set wallet authentication
  setAuth(walletAddress: string) {
    this.walletAddress = walletAddress
  }

  // Clear authentication
  clearAuth() {
    this.walletAddress = null
  }

  // Create authentication headers
  private async createAuthHeaders(): Promise<Record<string, string>> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not configured')
    }

    // Simplified authentication - just use wallet address
    // The backend should authenticate based on wallet connection status
    return {
      'x-wallet-address': this.walletAddress.toLowerCase(), // Ensure lowercase for consistency
      'Authorization': `Bearer ${this.walletAddress.toLowerCase()}`, // Add Bearer token format
      'Content-Type': 'application/json'
    }
  }

  // Generic API request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {})
      }

      if (requireAuth) {
        try {
          const authHeaders = await this.createAuthHeaders()
          Object.assign(headers, authHeaders)
        } catch (authError) {
          console.error('Auth headers creation failed:', authError)
          return {
            success: false,
            error: authError instanceof Error ? authError.message : 'Authentication failed'
          }
        }
      }

      const url = `${this.baseUrl}/api${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          code: data.code
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  // Public endpoints (no auth required)
  async getLeaderboard(params?: {
    limit?: number
    offset?: number
    sortBy?: string
  }): Promise<ApiResponse<LeaderboardResponse>> {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.offset) searchParams.set('offset', params.offset.toString())
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy)

    const query = searchParams.toString()
    return this.request<LeaderboardResponse>(
      `/leaderboard${query ? `?${query}` : ''}`,
      { method: 'GET' }
    )
  }

  // Check if user exists (no auth required)
  async checkUser(walletAddress: string): Promise<ApiResponse<{
    userExists: boolean
    nickname: string | null
  }>> {
    return this.request('/auth/check-user', {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    })
  }

  // Authentication endpoints
  async register(nickname: string): Promise<ApiResponse<{ user: UserProfile }>> {
    if (!this.walletAddress) {
      return { success: false, error: 'Wallet not connected' }
    }

    // Simplified registration - just use wallet address and nickname
    return this.request<{ user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress: this.walletAddress.toLowerCase(),
        nickname
      })
    }, true) // Require auth headers for registration
  }

  async getProfile(): Promise<ApiResponse<{ profile: UserProfile }>> {
    return this.request<{ profile: UserProfile }>('/auth/profile', {
      method: 'GET'
    }, true)
  }

  // QR Code endpoints
  async scanQR(qrCode: string): Promise<ApiResponse<QRScanResult>> {
    return this.request<QRScanResult>('/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrCode })
    }, true)
  }

  async getHints(phase?: string): Promise<ApiResponse<{
    phase: string
    hints: QRHint[]
    progress: {
      total: number
      scanned: number
      percentage: number
    }
  }>> {
    const query = phase ? `?phase=${phase}` : ''
    return this.request('/qr/hints' + query, {
      method: 'GET'
    }, true)
  }

  async getSpecificHint(qrId: string): Promise<ApiResponse<{
    qrCode: QRHint & {
      hint: {
        title: string
        content: string
      } | null
    }
  }>> {
    return this.request('/qr/hints', {
      method: 'POST',
      body: JSON.stringify({ qrId })
    }, true)
  }

}

// Export singleton instance
export const apiClient = new TokenCrunchiesAPI()

// Export utility functions
export function formatTokens(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function formatAddress(address: string): string {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getPhaseDisplayName(phase: string): string {
  const phaseNames = {
    'PHASE_1': 'Phase 1: Campus Hunt',
    'PHASE_2': 'Phase 2: Rare Treasures',
    'PHASE_3': 'Phase 3: Legendary Quest'
  }
  return phaseNames[phase as keyof typeof phaseNames] || phase
}

export function getRarityColor(rarity: string): {
  text: string;
  bg: string;
  border: string;
} {
  const colors = {
    'NORMAL': {
      text: 'text-gray-700',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    },
    'RARE': {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    'LEGENDARY': {
      text: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    }
  }
  return colors[rarity as keyof typeof colors] || colors.NORMAL
}

export function getRarityEmoji(rarity: string): string {
  const emojis = {
    'NORMAL': '📱',
    'RARE': '💎',
    'LEGENDARY': '👑'
  }
  return emojis[rarity as keyof typeof emojis] || '📱'
}
