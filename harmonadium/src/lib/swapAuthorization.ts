import { ethers } from 'ethers';
import { MONAD_TESTNET_TOKENS, ALLOWANCE_HOLDER_ADDRESS } from './config';
import { zeroXSwapService } from './zeroXSwap';

// ERC-20 ABI for token operations
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

export interface SwapAuthorization {
  userAddress: string;
  chainId: number;
  approvals: {
    [tokenAddress: string]: {
      spender: string;
      amount: string;
      txHash: string;
      timestamp: number;
    };
  };
  validUntil: number;
  nonce: number;
}

export class SwapAuthorizationManager {
  private authorizations: Map<string, SwapAuthorization> = new Map();
  private swapQueue: Array<{
    id: string;
    angle: number;
    targetToken: string;
    userAddress: string;
    timestamp: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }> = [];
  private isProcessingQueue = false;
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private getStorageKey(userAddress: string): string {
    return `harmonad_swap_auth_${userAddress.toLowerCase()}`;
  }

  private saveToStorage(userAddress: string, auth: SwapAuthorization) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(userAddress), JSON.stringify(auth));
    } catch (error) {
      console.error('Failed to save authorization:', error);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    this.initialized = true;
  }

  async requestSwapAuthorization(
    userAddress: string,
    provider: ethers.BrowserProvider
  ): Promise<SwapAuthorization> {
    console.log('🔐 Requesting swap authorization for:', userAddress);

    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    const authorization: SwapAuthorization = {
      userAddress,
      chainId,
      approvals: {},
      validUntil: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      nonce: Date.now(),
    };

    try {
      // For supported chains, get allowance target from 0x
      let allowanceTarget = '0x0000000000000000000000000000000000000000';

      if (chainId === 1) { // Ethereum mainnet
        try {
          // Get allowance target from 0x price API
          const priceQuote = await zeroXSwapService.getPrice(
            MONAD_TESTNET_TOKENS.MON.address, // Use native token address
            MONAD_TESTNET_TOKENS.USDC.address,
            ethers.parseEther('0.01').toString()
          );
          allowanceTarget = priceQuote.allowanceTarget;
          console.log('✅ Got allowance target from 0x:', allowanceTarget);
        } catch {
          console.warn('⚠️ Could not get allowance target from 0x, using fallback');
          allowanceTarget = '0xDef1C0ded9bec7F1a1670819833240f027b25EfF'; // 0x Exchange Proxy
        }
      } else {
        // For testnets like Monad, use the AllowanceHolder address
        allowanceTarget = ALLOWANCE_HOLDER_ADDRESS;
        console.log('📝 Using AllowanceHolder for testnet:', allowanceTarget);
      }

      // Check native token balance first
      const nativeBalance = await provider.getBalance(userAddress);
      console.log(`💰 Native token balance: ${ethers.formatEther(nativeBalance)} MON`);

      if (nativeBalance < ethers.parseEther('0.1')) {
        throw new Error('Insufficient native token balance. Need at least 0.1 MON for swaps.');
      }

      // For native token swaps (MON -> others), we don't need ERC-20 approvals
      // But let's still set up WMON approval for potential future use
      const wmonAddress = MONAD_TESTNET_TOKENS.WMON.address;

      console.log('🔗 Setting up WMON approval for future token-to-token swaps...');

      // Check if we need to approve WMON
      try {
        const wmonContract = new ethers.Contract(wmonAddress, ERC20_ABI, signer);
        const currentAllowance = await wmonContract.allowance(userAddress, allowanceTarget);

        console.log(`Current WMON allowance: ${ethers.formatEther(currentAllowance)}`);

        const requiredAmount = ethers.MaxUint256; // Unlimited approval

        if (currentAllowance < ethers.parseEther('1000000')) { // If less than 1M tokens approved
          console.log('📝 Requesting WMON approval...');

          const approveTx = await wmonContract.approve(allowanceTarget, requiredAmount);
          console.log('⏳ Approval transaction sent:', approveTx.hash);

          const receipt = await approveTx.wait();
          console.log('✅ WMON approval confirmed');

          authorization.approvals[wmonAddress] = {
            spender: allowanceTarget,
            amount: requiredAmount.toString(),
            txHash: receipt.hash,
            timestamp: Date.now(),
          };
        } else {
          console.log('✅ WMON already has sufficient allowance');

          authorization.approvals[wmonAddress] = {
            spender: allowanceTarget,
            amount: requiredAmount.toString(),
            txHash: 'existing',
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not set up WMON approval (this is OK for native swaps):', error);

        // This is not critical for native MON swaps
        authorization.approvals[wmonAddress] = {
          spender: allowanceTarget,
          amount: '0',
          txHash: 'skipped',
          timestamp: Date.now(),
        };
      }

      // Save authorization
      this.authorizations.set(userAddress, authorization);
      this.saveToStorage(userAddress, authorization);

      console.log('🎉 Swap authorization completed successfully!');
      return authorization;

    } catch (error: unknown) {
      console.error('❌ Swap authorization failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Authorization failed: ${errorMessage}`);
    }
  }

  isAuthorized(userAddress: string): boolean {
    const auth = this.authorizations.get(userAddress);
    if (!auth) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > auth.validUntil) {
      this.revokeAuthorization(userAddress);
      return false;
    }

    return true;
  }

  getAuthorization(userAddress: string): SwapAuthorization | null {
    if (!this.initialized) this.loadFromStorage();

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.getStorageKey(userAddress));
        if (stored) {
          const auth = JSON.parse(stored);
          this.authorizations.set(userAddress, auth);
          return auth;
        }
      } catch (error) {
        console.error('Failed to load authorization:', error);
      }
    }

    return this.authorizations.get(userAddress) || null;
  }

  revokeAuthorization(userAddress: string) {
    this.authorizations.delete(userAddress);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.getStorageKey(userAddress));
    }
    console.log('🔒 Authorization revoked for', userAddress);
  }

  // Swap Queue Management
  addToSwapQueue(
    angle: number,
    targetToken: string,
    userAddress: string
  ): string {
    const id = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.swapQueue.push({
      id,
      angle,
      targetToken,
      userAddress,
      timestamp: Date.now(),
      status: 'pending',
    });

    console.log(`📥 Added swap to queue: ${angle}° → ${targetToken} (ID: ${id})`);

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.processSwapQueue();
    }

    return id;
  }

  private async processSwapQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    console.log('🔄 Processing swap queue...');

    while (this.swapQueue.length > 0) {
      const nextSwap = this.swapQueue.find(swap => swap.status === 'pending');
      if (!nextSwap) break;

      console.log(`⚡ Processing swap: ${nextSwap.angle}° → ${nextSwap.targetToken}`);
      nextSwap.status = 'processing';

      try {
        // The actual swap execution will be handled by the calling component
        // We just manage the queue here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Minimum 1s between swaps

        nextSwap.status = 'completed';
        console.log(`✅ Swap completed: ${nextSwap.id}`);

      } catch (error) {
        console.error(`❌ Swap failed: ${nextSwap.id}`, error);
        nextSwap.status = 'failed';
      }

      // Remove completed/failed swaps after 10 seconds
      setTimeout(() => {
        this.swapQueue = this.swapQueue.filter(swap => swap.id !== nextSwap.id);
      }, 10000);
    }

    this.isProcessingQueue = false;
    console.log('✅ Swap queue processing completed');
  }

  getQueueStatus() {
    return {
      total: this.swapQueue.length,
      pending: this.swapQueue.filter(s => s.status === 'pending').length,
      processing: this.swapQueue.filter(s => s.status === 'processing').length,
      queue: this.swapQueue.map(s => ({
        id: s.id,
        angle: s.angle,
        targetToken: s.targetToken,
        status: s.status,
        timestamp: s.timestamp,
      })),
    };
  }

  clearQueue() {
    this.swapQueue = [];
    this.isProcessingQueue = false;
  }

  clearAllAuthorizations() {
    this.authorizations.clear();
    this.clearQueue();

    if (typeof window !== 'undefined') {
      // Clear all stored authorizations
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('harmonad_swap_auth_')) {
          localStorage.removeItem(key);
        }
      }
    }

    console.log('🧹 All authorizations and queue cleared');
  }
}

// Export singleton instance
export const swapAuthManager = new SwapAuthorizationManager();