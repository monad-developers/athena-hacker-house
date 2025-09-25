/**
 * Simplified User hook for Token Crunchies
 * Only handles user data fetching and registration - no complex auth states
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { apiClient, UserProfile } from '@/lib/api-client'

export interface UserState {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  isRegistering: boolean
  userExists: boolean | null // null = checking, true = exists, false = new user
}

export function useUser() {
  const { address, isConnected } = useAccount()
  
  const [userState, setUserState] = useState<UserState>({
    user: null,
    isLoading: false,
    error: null,
    isRegistering: false,
    userExists: null
  })

  // Check if user exists and load profile if they do
  const checkAndLoadUser = useCallback(async (walletAddress: string) => {
    setUserState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // First check if user exists
      const checkResponse = await apiClient.checkUser(walletAddress)
      
      if (checkResponse.success && checkResponse.data) {
        const { userExists } = checkResponse.data
        
        if (userExists) {
          // User exists, load their profile
          apiClient.setAuth(walletAddress) // Set auth for API calls
          const profileResponse = await apiClient.getProfile()
          
          if (profileResponse.success && profileResponse.data) {
            setUserState({
              user: profileResponse.data.profile,
              isLoading: false,
              error: null,
              isRegistering: false,
              userExists: true
            })
          } else {
            setUserState(prev => ({
              ...prev,
              isLoading: false,
              userExists: true,
              error: profileResponse.error || 'Failed to load profile'
            }))
          }
        } else {
          // New user - needs registration
          setUserState({
            user: null,
            isLoading: false,
            error: null,
            isRegistering: false,
            userExists: false
          })
        }
      } else {
        setUserState(prev => ({
          ...prev,
          isLoading: false,
          error: checkResponse.error || 'Failed to check user status'
        }))
      }
    } catch (error) {
      setUserState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check user status'
      }))
    }
  }, [])

  // Register new user
  const register = useCallback(async (nickname: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConnected || !address) {
      return { success: false, error: 'Wallet not connected' }
    }

    setUserState(prev => ({ ...prev, isRegistering: true, error: null }))

    try {
      apiClient.setAuth(address) // Set auth for registration
      const response = await apiClient.register(nickname)
      
      if (response.success && response.data) {
        setUserState({
          user: response.data.user,
          isLoading: false,
          error: null,
          isRegistering: false,
          userExists: true
        })
        return { success: true }
      } else {
        setUserState(prev => ({
          ...prev,
          isRegistering: false,
          error: response.error || 'Registration failed'
        }))
        return { success: false, error: response.error || 'Registration failed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setUserState(prev => ({
        ...prev,
        isRegistering: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }, [isConnected, address])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (address) {
      await checkAndLoadUser(address)
    }
  }, [address, checkAndLoadUser])

  // Reset state when wallet disconnects
  useEffect(() => {
    if (isConnected && address) {
      checkAndLoadUser(address)
    } else {
      apiClient.clearAuth()
      setUserState({
        user: null,
        isLoading: false,
        error: null,
        isRegistering: false,
        userExists: null
      })
    }
  }, [isConnected, address, checkAndLoadUser])

  return {
    ...userState,
    register,
    refreshProfile,
    walletAddress: address,
    isWalletConnected: isConnected,
    // Computed states for easier usage
    isNewUser: userState.userExists === false,
    isExistingUser: userState.userExists === true && userState.user !== null,
    needsRegistration: isConnected && userState.userExists === false
  }
}
