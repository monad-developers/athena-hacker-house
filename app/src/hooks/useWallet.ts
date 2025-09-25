import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrowserProvider, JsonRpcSigner } from 'ethers'

type WalletState = {
  isConnecting: boolean
  address: string | null
  chainId: number | null
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  error: string | null
}

// Extend the Window interface to include 'ethereum'
declare global {
  interface Window {
    ethereum?: any
  }
}

function getEthereumFromWindow(): any | null {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum
  }
  return null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnecting: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
    error: null,
  })

  const isConnected = useMemo(() => Boolean(state.address && state.provider), [state.address, state.provider])

  const connect = useCallback(async () => {
    const eth = getEthereumFromWindow()
    if (!eth) {
      setState((s) => ({ ...s, error: 'No EIP-1193 provider found. Install MetaMask.' }))
      return
    }
    try {
      setState((s) => ({ ...s, isConnecting: true, error: null }))
      const provider = new BrowserProvider(eth)
      await eth.request?.({ method: 'eth_requestAccounts' })
      const network = await provider.getNetwork()
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setState({
        isConnecting: false,
        address,
        chainId: Number(network.chainId),
        provider,
        signer,
        error: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect'
      setState((s) => ({ ...s, isConnecting: false, error: message }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({ isConnecting: false, address: null, chainId: null, provider: null, signer: null, error: null })
  }, [])

  useEffect(() => {
    const eth = getEthereumFromWindow()
    if (!eth) return

    const handleAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, address: accounts[0] ?? null }))
    }
    const handleChainChanged = (chainIdHex: string) => {
      const chainId = Number.parseInt(chainIdHex, 16)
      setState((s) => ({ ...s, chainId }))
    }
    eth.on?.('accountsChanged', handleAccountsChanged)
    eth.on?.('chainChanged', handleChainChanged)

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged)
      eth.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    const eth = getEthereumFromWindow()
    if (!eth) throw new Error('No provider')
    const hexChain = '0x' + targetChainId.toString(16)
    try {
      await eth.request?.({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChain }] })
    } catch (err: any) {
      // 4902: chain not added
      if (err?.code === 4902) {
        await eth.request?.({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChain,
              chainName: 'Monad Testnet',
              nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: ['https://testnet.monadexplorer.com'],
            },
          ],
        })
      } else {
        throw err
      }
    }
  }, [])

  return { ...state, isConnected, connect, disconnect, switchNetwork }
}


