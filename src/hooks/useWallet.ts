import { useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useSendTransaction, useChainId } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { TOKEN_ADDRESSES, type Token } from '@/lib/constants';
import { swapTokens } from '@/lib/simpleSwap'; 

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { toast } = useToast();
  const chainId = useChainId();
  
  // Debug wallet connection state
  console.log('🔗 Wallet connection status:', {
    isConnected,
    address,
    chainId,
    expectedChainId: 10143,
    chainIdMatch: chainId === 10143,
    connectors: connectors.map(c => ({ name: c.name, id: c.id, uid: c.uid })),
    isConnecting
  });

  const { data: monBalance, refetch: refetchMonBalance } = useBalance({ address, chainId: 10143 });
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useBalance({ address, token: TOKEN_ADDRESSES.USDC, chainId: 10143 });
  const { data: wethBalance, refetch: refetchWethBalance } = useBalance({ address, token: TOKEN_ADDRESSES.WETH, chainId: 10143 });

  const balances: Record<Token, number> = {
    MON: parseFloat(monBalance?.formatted || '0'),
    USDC: parseFloat(usdcBalance?.formatted || '0'),
    WETH: parseFloat(wethBalance?.formatted || '0'),
  };

  // Debug log for balance updates
  console.log('💰 Wallet balances updated:', {
    MON: { formatted: monBalance?.formatted, parsed: balances.MON },
    USDC: { formatted: usdcBalance?.formatted, parsed: balances.USDC },
    WETH: { formatted: wethBalance?.formatted, parsed: balances.WETH },
    isConnected,
    address
  });

  const refetchAllBalances = useCallback(async () => {
    console.log('🔄 Refetching all balances...');
    await Promise.all([
      refetchMonBalance(),
      refetchUsdcBalance(), 
      refetchWethBalance()
    ]);
    console.log('✅ All balances refetched');
  }, [refetchMonBalance, refetchUsdcBalance, refetchWethBalance]);

  const switchToMonadTestnet = useCallback(async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }], // 10143 in hex
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x279F',
                  chainName: 'Monad Testnet',
                  nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MON',
                    decimals: 18,
                  },
                  rpcUrls: ['https://testnet-rpc.monad.xyz'],
                  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
                },
              ],
            });
          } catch (addError) {
            console.error('Error adding Monad testnet:', addError);
            toast({
              title: 'Network Error',
              description: 'Failed to add Monad testnet to MetaMask',
              variant: 'destructive'
            });
          }
        } else {
          console.error('Error switching to Monad testnet:', switchError);
          toast({
            title: 'Network Error', 
            description: 'Failed to switch to Monad testnet',
            variant: 'destructive'
          });
        }
      }
    }
  }, [toast]);

  const handleSwap = useCallback(async (fromToken: Token, toToken: Token) => {
    console.log('🚀 UNISWAP V3 SWAP FUNCTION CALLED', {
      fromToken,
      toToken,
      isConnected,
      address: address || 'undefined',
      timestamp: new Date().toISOString()
    });

    if (!isConnected || !address) {
      console.log('❌ SWAP FAILED - Wallet not connected');
      toast({ title: 'Wallet not connected', description: 'Please connect your wallet to swap tokens.', variant: 'destructive' });
      return;
    }
    
    // Get the raw balance data to check if user has tokens
    const balanceData = fromToken === 'MON' ? monBalance : 
                       fromToken === 'USDC' ? usdcBalance : wethBalance;
    
    console.log('💰 BALANCE CHECK', {
      fromToken,
      balanceData: balanceData ? {
        formatted: balanceData.formatted,
        value: balanceData.value?.toString(),
        decimals: balanceData.decimals
      } : 'undefined',
      hasBalance: !!(balanceData && balanceData.value && balanceData.value > BigInt(0))
    });
    
    if (!balanceData || !balanceData.value || balanceData.value === BigInt(0)) {
      console.log('❌ SWAP FAILED - Insufficient balance');
      toast({ 
        title: 'Insufficient Balance', 
        description: `You don't have any ${fromToken} tokens to swap.`, 
        variant: 'destructive' 
      });
      return;
    }

    try {
      console.log('🔄 Executing Uniswap V2 swap...', {
        fromToken,
        toToken,
        amount: balanceData.value.toString(),
        formattedAmount: balanceData.formatted,
        userAddress: address
      });
      
      // Calculate swap amount
let swapAmount;

console.log('💰 Balance calculation debug:', {
  fromToken,
  balanceData: balanceData ? {
    formatted: balanceData.formatted,
    value: balanceData.value?.toString(),
    decimals: balanceData.decimals
  } : 'undefined',
  balanceValue: balanceData?.value?.toString()
});

if (fromToken === 'MON') {
  // Reserve gas for MON swaps (native token)
  const gasReserve = BigInt('10000000000000000'); // 0.01 MON for gas
  swapAmount = balanceData.value - gasReserve;
  console.log('MON swap amount calculation:', {
    originalBalance: balanceData.value.toString(),
    gasReserve: gasReserve.toString(),
    swapAmount: swapAmount.toString()
  });
  
  if (swapAmount <= BigInt(0)) {
    toast({ 
      title: 'Insufficient Balance', 
      description: 'Not enough MON to cover swap + gas fees for future transactions.',
      variant: 'destructive' 
    });
    return;
  }
} else { 
  // For ERC20 tokens (USDC, WETH), use almost full balance
  // No gas reserve needed since gas is paid in native MON, not the token being swapped
  swapAmount = balanceData.value; // Use full balance
  console.log('Token swap amount calculation:', {
    originalBalance: balanceData.value.toString(),
    swapAmount: swapAmount.toString(),
    note: 'Using full balance - no gas reserve needed for ERC20 tokens'
  });
}

      const txHash = await swapTokens(
        fromToken,
        toToken,
        swapAmount.toString(),
        address,
        sendTransactionAsync
      );

      console.log('✅ SWAP TRANSACTION SUBMITTED!', { 
        txHash,
        amount: balanceData,
        fromToken,
        toToken,
        explorerLink: `https://testnet.monadexplorer.com/tx/${txHash}`
      });

      toast({
        title: 'Swap Submitted!',
        description: `Swapping ${balanceData.formatted} ${fromToken} for ${toToken} via Uniswap V2!`,
      });

      // Refetch balances after swap
      setTimeout(async () => {
        await refetchAllBalances();
      }, 2000); // Wait 2 seconds for transaction to be mined

    } catch (error) {
       console.error('❌ SWAP ERROR:', error);
       
       // More detailed error logging
       if (error instanceof Error) {
         console.error('Error message:', error.message);
         console.error('Error stack:', error.stack);
       }
       
       toast({
        title: 'Swap Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred during the swap.',
        variant: 'destructive',
      });
    }
  }, [isConnected, address, toast, sendTransactionAsync, monBalance, usdcBalance, wethBalance, refetchAllBalances]);

  return {
    address,
    isConnected,
    connectors,
    isConnecting,
    balances,
    connect: (connector: any) => {
      console.log('🚀 Attempting to connect with:', {
        connectorName: connector?.name,
        connectorId: connector?.id,
        ethereum: typeof window !== 'undefined' && !!window.ethereum,
        metamask: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
      });
      
      try {
        const result = connect({ connector });
        console.log('✅ Connect initiated:', result);
        return result;
      } catch (error) {
        console.error('❌ Connect failed:', error);
        toast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect to MetaMask',
          variant: 'destructive'
        });
        throw error;
      }
    },
    disconnect,
    handleSwap,
    refetchAllBalances,
    switchToMonadTestnet,
    chainId,
  };
} 