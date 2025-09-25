export const UniswapV2FactoryABI = [
  { "type": "function", "name": "getPair", "stateMutability": "view", "inputs": [ { "name": "tokenA", "type": "address" }, { "name": "tokenB", "type": "address" } ], "outputs": [ { "name": "pair", "type": "address" } ] },
]

export const UniswapV2PairABI = [
  { "type": "function", "name": "getReserves", "stateMutability": "view", "inputs": [], "outputs": [ { "name": "_reserve0", "type": "uint112" }, { "name": "_reserve1", "type": "uint112" }, { "name": "_blockTimestampLast", "type": "uint32" } ] },
  { "type": "function", "name": "token0", "stateMutability": "view", "inputs": [], "outputs": [ { "name": "", "type": "address" } ] },
  { "type": "function", "name": "token1", "stateMutability": "view", "inputs": [], "outputs": [ { "name": "", "type": "address" } ] },
]

export const ERC20ABI = [
  { "type": "function", "name": "symbol", "stateMutability": "view", "inputs": [], "outputs": [ { "name": "", "type": "string" } ] },
  { "type": "function", "name": "decimals", "stateMutability": "view", "inputs": [], "outputs": [ { "name": "", "type": "uint8" } ] },
]

export const UniswapV2Router02ABI = [
  { "type": "function", "name": "getAmountsOut", "stateMutability": "view", "inputs": [ { "name": "amountIn", "type": "uint256" }, { "name": "path", "type": "address[]" } ], "outputs": [ { "name": "amounts", "type": "uint256[]" } ] },
  { "type": "function", "name": "swapExactETHForTokens", "stateMutability": "payable", "inputs": [ { "name": "amountOutMin", "type": "uint256" }, { "name": "path", "type": "address[]" }, { "name": "to", "type": "address" }, { "name": "deadline", "type": "uint256" } ], "outputs": [ { "name": "amounts", "type": "uint256[]" } ] },
  { "type": "function", "name": "swapExactTokensForTokens", "stateMutability": "nonpayable", "inputs": [ { "name": "amountIn", "type": "uint256" }, { "name": "amountOutMin", "type": "uint256" }, { "name": "path", "type": "address[]" }, { "name": "to", "type": "address" }, { "name": "deadline", "type": "uint256" } ], "outputs": [ { "name": "amounts", "type": "uint256[]" } ] },
]


