/**
 * Leaderboard hook for Token Crunchies
 * Manages leaderboard data fetching and real-time updates
 */

import { useState, useEffect, useCallback } from 'react'
import { apiClient, LeaderboardResponse } from '@/lib/api-client'

export interface LeaderboardState {
  data: LeaderboardResponse | null
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface LeaderboardOptions {
  sortBy?: 'totalTokens' | 'qrCodesScanned' | 'rareQRsScanned' | 'legendaryQRsScanned'
  limit?: number
  offset?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useLeaderboard(options: LeaderboardOptions = {}) {
  const {
    sortBy = 'totalTokens',
    limit = 50,
    offset = 0,
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options

  const [state, setState] = useState<LeaderboardState>({
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  })

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      const response = await apiClient.getLeaderboard({
        sortBy,
        limit,
        offset
      })

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          data: response.data!,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        }))
      } else {
        setState(prev => ({
          ...prev,
          data: null,
          isLoading: false,
          error: response.error || 'Failed to load leaderboard',
          lastUpdated: null
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load leaderboard',
        lastUpdated: null
      }))
    }
  }, [sortBy, limit, offset])

  // Refresh leaderboard (silent update)
  const refreshLeaderboard = useCallback(() => {
    fetchLeaderboard(false)
  }, [fetchLeaderboard])

  // Load more entries (pagination)
  const loadMore = useCallback(async () => {
    if (!state.data || state.isLoading) return

    const newOffset = state.data.leaderboard.length
    
    try {
      const response = await apiClient.getLeaderboard({
        sortBy,
        limit,
        offset: newOffset
      })

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          data: prev.data ? {
            ...response.data!,
            leaderboard: [...prev.data.leaderboard, ...response.data!.leaderboard]
          } : response.data!,
          lastUpdated: new Date()
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more entries'
      }))
    }
  }, [state.data, state.isLoading, sortBy, limit])

  // Initial load
  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshLeaderboard()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshLeaderboard])

  // Helper functions
  const getCurrentUserRank = useCallback((userAddress?: string) => {
    if (!state.data || !userAddress) return null
    
    const userEntry = state.data.leaderboard.find(entry => 
      entry.userId === userAddress || 
      entry.nickname.toLowerCase().includes(userAddress.toLowerCase())
    )
    
    return userEntry?.rank || null
  }, [state.data])

  const getUserStats = useCallback((userAddress?: string) => {
    if (!state.data || !userAddress) return null
    
    const userEntry = state.data.leaderboard.find(entry => 
      entry.userId === userAddress || 
      entry.nickname.toLowerCase().includes(userAddress.toLowerCase())
    )
    
    return userEntry ? {
      rank: userEntry.rank,
      totalTokens: userEntry.totalTokens,
      qrCodesScanned: userEntry.qrCodesScanned,
      rareQRsScanned: userEntry.rareQRsScanned,
      legendaryQRsScanned: userEntry.legendaryQRsScanned
    } : null
  }, [state.data])

  const getTopPlayers = useCallback((count = 3) => {
    if (!state.data) return []
    return state.data.leaderboard.slice(0, count)
  }, [state.data])

  const hasMore = useCallback(() => {
    if (!state.data) return false
    return state.data.pagination.hasMore
  }, [state.data])

  return {
    ...state,
    fetchLeaderboard,
    refreshLeaderboard,
    loadMore,
    getCurrentUserRank,
    getUserStats,
    getTopPlayers,
    hasMore: hasMore(),
    // Computed values
    totalUsers: state.data?.stats.totalUsers || 0,
    totalTokensDistributed: state.data?.stats.totalTokensDistributed || '0',
    totalQRsScanned: state.data?.stats.totalQRsScanned || 0,
    topPlayer: state.data?.stats.topPlayer || null,
    phaseDistribution: state.data?.stats.phaseDistribution || {},
    // Options for re-fetching with different parameters
    sortBy,
    limit,
    offset
  }
}
