export interface SwapStep {
  id: number;
  title: string;
  icon: string;
  description: string;
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
  backgroundColor: string;
  chainId?: number;
}

export interface Network {
  id: number;
  name: string;
  icon: string;
  backgroundColor: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface SwapData {
  fromToken: Token;
  toToken: Token;
  fromNetwork: Network;
  toNetwork: Network;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  priceChange: string;
  networkFee: string;
  slippage: string;
  priceImpact: string;
}

// API Response Types (from zeroExApi service)
export interface SwapPrice {
  price: string;
  estimatedGas: number;
  buyAmount: string;
  sellAmount: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  allowanceTarget: string;
  issues?: {
    allowance?: {
      spender: string;
    };
  };
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export interface SwapQuote extends SwapPrice {
  to: string;
  data: string;
  value: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  issues?: {
    allowance?: {
      spender: string;
    };
  };
}

// Swap State Management Types
export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string | null;
  priceImpact: string | null;
  estimatedGas: number | null;
  isLoadingPrice: boolean;
  priceError: string | null;
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  quoteError: string | null;
}

export interface SwapActions {
  setFromToken: (token: Token) => void;
  setToToken: (token: Token) => void;
  setFromAmount: (amount: string) => void;
  fetchPrice: () => Promise<void>;
  fetchQuote: () => Promise<SwapQuote | null>;
  switchTokens: () => void;
  resetSwap: () => void;
}

export interface SwapContextType extends SwapState, SwapActions {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  handleStepClick: (stepId: number) => void;
  handleNextStep: () => void;
  handleSwap: () => void;
}

// Token List Types
export interface TokenList {
  name: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Token[];
}

// Error Types
export interface SwapError {
  code: string;
  message: string;
  details?: any;
}

// Transaction Types
export interface SwapTransaction {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed?: number;
  effectiveGasPrice?: string;
  blockNumber?: number;
  timestamp?: number;
}
