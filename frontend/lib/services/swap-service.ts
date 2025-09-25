import { Address, erc20Abi, maxUint256, getContract } from "viem";
import {
  publicClient,
  treasuryWalletClient,
  monadTestnet,
} from "../web3/monad-provider";

// Known working tokens on Monad testnet with actual liquidity
export const WORKING_TOKENS = {
  WMON: {
    address: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701", // Wrapped MON address on Monad testnet
    symbol: "WMON",
    decimals: 18,
    name: "Wrapped MON",
  },
  USDT: {
    address: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
    symbol: "USDT",
    decimals: 6,
    name: "Tether USD",
  },
} as const;

type TokenSymbol = keyof typeof WORKING_TOKENS;

interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  allowanceTarget?: string;
  price?: string;
  gas?: string;
  gasPrice?: string;
  to?: string;
  data?: string;
  value?: string;
  liquidityAvailable: boolean;
  issues?: {
    allowance?: {
      actual: string;
      spender: string;
    } | null;
    balance?: unknown;
    simulationIncomplete?: boolean;
    invalidSourcesPassed?: unknown[];
  };
  transaction?: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
}

export class SwapService {
  private static readonly API_BASE = "https://api.0x.org/swap/allowance-holder";
  private static readonly CHAIN_ID = 10143; // Monad testnet

  /**
   * Validate API key is configured
   */
  private static validateApiKey(): void {
    if (!process.env.NEXT_PUBLIC_ZEROX_API_KEY) {
      throw new Error(
        "0x API key not configured. Please set NEXT_PUBLIC_ZEROX_API_KEY environment variable."
      );
    }
  }

  /**
   * Get swap quote for WMON/USDT pairs
   */
  static async getQuote(params: {
    sellToken: TokenSymbol;
    buyToken: TokenSymbol;
    sellAmount: string;
    takerAddress: string;
  }): Promise<SwapQuote> {
    this.validateApiKey();

    const sellTokenData = WORKING_TOKENS[params.sellToken];
    const buyTokenData = WORKING_TOKENS[params.buyToken];

    const query = new URLSearchParams({
      chainId: this.CHAIN_ID.toString(),
      sellToken: sellTokenData.address,
      buyToken: buyTokenData.address,
      sellAmount: params.sellAmount,
      taker: params.takerAddress,
      slippagePercentage: "1", // 1% slippage tolerance
      skipValidation: "true", // Important for testnet
    });

    const response = await fetch(`${this.API_BASE}/quote?${query}`, {
      headers: {
        "0x-api-key": process.env.NEXT_PUBLIC_ZEROX_API_KEY!,
        "0x-version": "v2",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("0x API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to get quote: ${response.status} ${errorText}`);
    }

    const quote = await response.json();

    // Check if there's actually liquidity available
    if (!quote.liquidityAvailable) {
      throw new Error(
        "INSUFFICIENT_ASSET_LIQUIDITY: No liquidity available for this pair"
      );
    }

    // For allowance-holder API, if we don't have transaction data, we need to construct it
    // This is a fallback for testnets where full transaction data might not be available
    if (!quote.to && !quote.data) {
      console.warn(
        "Quote missing transaction data, this may indicate limited testnet support"
      );
      // Add minimal transaction data for allowance-holder pattern
      quote.to =
        quote.allowanceTarget || "0x0000000000001ff3684f28c67538d4d072c22734";
      quote.data = "0x"; // Empty data for now
      quote.value = "0";
      quote.gas = "200000"; // Default gas limit
      quote.gasPrice = "1000000000"; // 1 gwei default
    }

    return quote;
  }

  /**
   * Check and approve token allowance if needed
   */
  static async checkAndApproveAllowance(
    tokenAddress: Address,
    spenderAddress: Address,
    userAddress: Address
  ): Promise<void> {
    if (!treasuryWalletClient) {
      throw new Error("Treasury wallet client not available");
    }

    try {
      // Create token contract instance
      const tokenContract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: treasuryWalletClient,
      });

      // Check current allowance
      const currentAllowance = await tokenContract.read.allowance([
        userAddress,
        spenderAddress,
      ]);

      // If allowance is 0, approve max amount
      if (currentAllowance === BigInt(0)) {
        if (!treasuryWalletClient.account) {
          throw new Error("Treasury wallet account not available for approval");
        }

        const hash = await tokenContract.write.approve(
          [spenderAddress, maxUint256],
          {
            account: treasuryWalletClient.account,
            chain: monadTestnet,
          }
        );

        // Wait for approval transaction to be mined
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
      }
    } catch (error) {
      throw new Error(
        `Failed to approve token allowance: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Execute a swap transaction following the 0x allowance-holder pattern
   */
  static async executeSwap(quote: SwapQuote, _userAddress: Address) {
    if (!treasuryWalletClient) {
      throw new Error("Treasury wallet client not available");
    }

    // Get treasury address for the account parameter
    const treasuryAddress = treasuryWalletClient.account?.address;
    if (!treasuryAddress) {
      throw new Error("Treasury wallet address not available");
    }

    // Step 1: Check if allowance is needed and approve if necessary
    if (quote.issues?.allowance !== null && quote.issues?.allowance) {
      await this.checkAndApproveAllowance(
        quote.sellToken as Address,
        quote.issues.allowance.spender as Address,
        treasuryAddress
      );
    } else {
    }

    // Step 2: Execute the swap transaction using the transaction object from quote
    try {
      let txHash: string;

      // Use transaction object from quote if available (proper 0x response)
      if (quote.transaction) {
        // For Monad testnet, we need to use a different approach due to RPC limitations
        // Try to prepare and sign the transaction manually
        const transactionRequest = {
          to: quote.transaction.to as Address,
          data: quote.transaction.data as `0x${string}`,
          value: quote.transaction.value
            ? BigInt(quote.transaction.value)
            : BigInt(0),
          gas: BigInt(quote.transaction.gas),
          gasPrice: BigInt(quote.transaction.gasPrice),
        };

        // Try to execute the transaction with the current RPC
        try {
          // First try regular sendTransaction
          txHash = await treasuryWalletClient.sendTransaction({
            account: treasuryAddress,
            ...transactionRequest,
            chain: monadTestnet,
          });
        } catch (sendTxError: unknown) {
          console.error("sendTransaction failed:", sendTxError);

          // If sendTransaction is not supported, try sendRawTransaction approach
          const errorMessage =
            sendTxError instanceof Error
              ? sendTxError.message
              : String(sendTxError);
          const errorCode = (sendTxError as { code?: number }).code;
          if (
            errorMessage.includes("Unsupported method: eth_sendTransaction") ||
            errorMessage.includes("method is not supported") ||
            errorCode === -32604 ||
            errorCode === -32600
          ) {
            try {
              // Get nonce for the treasury address
              const nonce = await publicClient.getTransactionCount({
                address: treasuryAddress,
                blockTag: "pending",
              });

              // Prepare the transaction with all required fields
              const txRequest = {
                to: transactionRequest.to,
                data: transactionRequest.data,
                value: transactionRequest.value,
                gas: transactionRequest.gas,
                gasPrice: transactionRequest.gasPrice,
                nonce,
                chainId: monadTestnet.id,
              };

              // Sign the transaction
              if (!treasuryWalletClient.account) {
                throw new Error(
                  "Treasury wallet account not available for signing"
                );
              }

              const serializedTx = await treasuryWalletClient.signTransaction({
                ...txRequest,
                account: treasuryWalletClient.account,
                chain: monadTestnet,
              });

              // Send the raw transaction
              txHash = await publicClient.sendRawTransaction({
                serializedTransaction: serializedTx,
              });

            } catch (rawTxError: unknown) {
              console.error("sendRawTransaction also failed:", rawTxError);
              const rawErrorMessage =
                rawTxError instanceof Error
                  ? rawTxError.message
                  : String(rawTxError);
              throw new Error(
                `Both sendTransaction and sendRawTransaction failed. Monad testnet RPC has very limited method support. Error: ${rawErrorMessage}`
              );
            }
          } else {
            // Re-throw other errors that aren't method-related
            throw sendTxError;
          }
        }
      } else {
        // Fallback for incomplete quote responses
        const fallbackTx = {
          to: (quote.to || quote.allowanceTarget) as Address,
          data: (quote.data || "0x") as `0x${string}`,
          value: BigInt(quote.value || "0"),
          gas: BigInt(quote.gas || "200000"),
          gasPrice: BigInt(quote.gasPrice || "1000000000"),
        };

        txHash = await treasuryWalletClient.sendTransaction({
          account: treasuryAddress,
          ...fallbackTx,
          chain: monadTestnet,
        });
      }

      return { txHash };
    } catch (error: unknown) {
      console.error("Transaction failed:", error);

      // Handle specific RPC method not supported error
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: number }).code;
      if (
        errorMessage.includes("method is not supported") ||
        errorCode === -32604
      ) {
        throw new Error(
          "Monad testnet RPC has limited method support. The swap cannot be executed directly through this RPC endpoint. Please use a different RPC or signing method."
        );
      }

      // If the transaction data is empty (0x), this might be a quote-only response
      if ((quote.transaction?.data || quote.data) === "0x") {
        throw new Error(
          "Cannot execute swap: Quote does not contain valid transaction data. This may indicate limited testnet support for the 0x allowance-holder API."
        );
      }

      throw error;
    }
  }

  /**
   * Get available token pairs with liquidity
   */
  static async getAvailablePairs(): Promise<
    Array<{
      from: TokenSymbol;
      to: TokenSymbol;
      sellToken: string;
      buyToken: string;
    }>
  > {
    const pairs: Array<{
      from: TokenSymbol;
      to: TokenSymbol;
      sellToken: string;
      buyToken: string;
    }> = [];

    // Test WMON -> USDT
    try {
      await this.getQuote({
        sellToken: "WMON",
        buyToken: "USDT",
        sellAmount: "1000000000000000000", // 1 WMON
        takerAddress: "0x0000000000000000000000000000000000000000",
      });
      pairs.push({
        from: "WMON",
        to: "USDT",
        sellToken: WORKING_TOKENS.WMON.address,
        buyToken: WORKING_TOKENS.USDT.address,
      });
    } catch (error) {
      console.log(error);
    }

    // Test USDT -> WMON
    try {
      await this.getQuote({
        sellToken: "USDT",
        buyToken: "WMON",
        sellAmount: "1000000", // 1 USDT (6 decimals)
        takerAddress: "0x0000000000000000000000000000000000000000",
      });
      pairs.push({
        from: "USDT",
        to: "WMON",
        sellToken: WORKING_TOKENS.USDT.address,
        buyToken: WORKING_TOKENS.WMON.address,
      });
    } catch (error) {
      console.log(error);
    }

    return pairs;
  }

  /**
   * Convert amount to proper decimal places for token
   */
  static formatAmount(token: TokenSymbol, amount: string): string {
    const tokenData = WORKING_TOKENS[token];

    // If amount already has proper decimals, return as-is
    if (amount.includes(".")) {
      const [whole, decimal] = amount.split(".");
      const paddedDecimal = decimal.padEnd(tokenData.decimals, "0");
      return whole + paddedDecimal.slice(0, tokenData.decimals);
    }

    // Otherwise, treat as whole number and convert to wei/decimal equivalent
    const baseAmount = BigInt(amount);
    const multiplier = BigInt(10) ** BigInt(tokenData.decimals);
    return (baseAmount * multiplier).toString();
  }
}
