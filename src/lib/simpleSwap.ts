import { TOKEN_ADDRESSES, type Token } from './constants';

// Uniswap V2 Router ABI (simplified for swaps)
const UNISWAP_V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
   'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

// ERC20 ABI for approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)'
];

// Uniswap V2 Router address on Monad testnet
const UNISWAP_V2_ROUTER = '0xfb8e1c3b833f9e67a71c859a132cf783b645e436';

export async function executeTokenSwap(
  fromToken: Token,
  toToken: Token,
  amountIn: string,
  userAddress: string,
  sendTransaction: any
): Promise<string> {
  try {
    console.log('🚀 EXECUTING SIMPLE SWAP', {
      from: fromToken,
      to: toToken,
      amount: amountIn,
      user: userAddress,
      router: UNISWAP_V2_ROUTER
    });

    const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
    const fromTokenAddress = TOKEN_ADDRESSES[fromToken];
    const toTokenAddress = TOKEN_ADDRESSES[toToken];

    // Build the swap path
    let path: string[];
    let swapFunction: string;
    let swapParams: any[];

    if (fromToken === 'MON') {
      // ETH -> Token swap
      path = [fromTokenAddress, toTokenAddress];
      swapFunction = 'swapExactETHForTokens';
      swapParams = [
        '0', // amountOutMin (accept any amount for demo)
        path,
        userAddress,
        deadline
      ];
      
      console.log('💰 ETH -> Token swap', { path, params: swapParams });

      // No approval needed for ETH
      const result = await sendTransaction({
        to: UNISWAP_V2_ROUTER,
        data: new (await import('ethers')).ethers.utils.Interface(UNISWAP_V2_ROUTER_ABI)
          .encodeFunctionData(swapFunction, swapParams),
        value: amountIn,
      });

      console.log('✅ ETH->Token swap submitted:', result);
      return result;

    } else if (toToken === 'MON') {
      // Token -> ETH swap
      path = [fromTokenAddress, toTokenAddress];
      swapFunction = 'swapExactTokensForETH';
      swapParams = [
        amountIn,
        '0', // amountOutMin (accept any amount for demo)
        path,
        userAddress,
        deadline
      ];

      console.log('🪙 Token -> ETH swap', { path, params: swapParams });

      // Need approval for token
      // await approveToken(fromTokenAddress, UNISWAP_V2_ROUTER, amountIn, sendTransaction);

      const result = await sendTransaction({
        to: UNISWAP_V2_ROUTER,
        data: new (await import('ethers')).ethers.utils.Interface(UNISWAP_V2_ROUTER_ABI)
          .encodeFunctionData(swapFunction, swapParams),
        value: '0',
      });

      console.log('✅ Token->ETH swap submitted:', result);
      return result;

    } else {
      // Token -> Token swap (via WETH)
      path = [fromTokenAddress, TOKEN_ADDRESSES.MON, toTokenAddress]; // Use MON as intermediate
      swapFunction = 'swapExactTokensForTokens';
      swapParams = [
        amountIn,
        '0', // amountOutMin (accept any amount for demo)
        path,
        userAddress,
        deadline
      ];

      console.log('🔄 Token -> Token swap', { path, params: swapParams });

      // Need approval for input token
      // await approveToken(fromTokenAddress, UNISWAP_V2_ROUTER, amountIn, sendTransaction);

      const result = await sendTransaction({
        to: UNISWAP_V2_ROUTER,
        data: new (await import('ethers')).ethers.utils.Interface(UNISWAP_V2_ROUTER_ABI)
          .encodeFunctionData(swapFunction, swapParams),
        value: '0',
      });

      console.log('✅ Token->Token swap submitted:', result);
      return result;
    }

  } catch (error) {
    console.error('❌ SWAP FAILED:', error);
    throw new Error(`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function approveToken(
  tokenAddress: string,
  spender: string,
  amount: string,
  sendTransaction: any
): Promise<void> {
  try {
    console.log('🔐 APPROVING TOKEN', { token: tokenAddress, spender, amount });

    const ethers = await import('ethers');
    
    // Send max approval to avoid repeated approvals
    const result = await sendTransaction({
      to: tokenAddress,
      data: new ethers.ethers.utils.Interface(ERC20_ABI)
        .encodeFunctionData('approve', [spender, ethers.ethers.constants.MaxUint256]),
      value: '0',
    });

    console.log('✅ APPROVAL SENT:', result);
    
    // Wait a bit for approval to be mined (in a real app you'd wait for confirmation)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ APPROVAL FAILED:', error);
    throw new Error(`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main export function
export async function swapTokens(
  fromToken: Token,
  toToken: Token,
  amount: string,
  userAddress: string,
  sendTransaction: any
): Promise<string> {
  console.log('🎯 STARTING TOKEN SWAP', {
    from: fromToken,
    to: toToken,
    amount,
    user: userAddress,
    timestamp: new Date().toISOString()
  });

  return await executeTokenSwap(fromToken, toToken, amount, userAddress, sendTransaction);
} 