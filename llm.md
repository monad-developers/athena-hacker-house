# ATTENTION LLMs - 0x API Usage Instructions
# This document contains all the necessary details to retrieve onchain trading data using the 0x API.
#
# This document includes
# - Developer Assistant Instructions (query structure, UI component generation, best practices)
# - Autonomous Agent Instructions (authentication, API request patterns, recommendations)
# - Complete API Schema (endpoints, parameters, and example responses)
# - UI Component Examples for 0x API Integration
#
# ---
#
# How to Use the 0x API
# You can interact with the 0x API in two primary ways:
#
# 1️. Developer Assistant Mode
# When a developer asks for help with building queries, UI components, or making API calls:
# - Use the provided schema to construct valid API requests.
# - Assist in building TypeScript-based UI components for displaying onchain data.
# - Ensure API queries are structured correctly with required parameters.
# - Include best practices for authentication, error handling, and caching.
#
# 2. Autonomous Agent Mode
# For AI agents making direct API calls programmatically.
#
# API Base URL:
# https://api.0x.org
#
#
# 1. Developer Assistant Mode
#
# When assisting developers in query generation or UI integration, follow these steps:
#
# Fetching a Swap Price Using 0x REST API
#
# Example query to retrieve a swap price:
#
# ```typescript
# const fetchSwapPrice = async (
#   chainId: number,
#   buyToken: string,
#   sellToken: string,
#   sellAmount: string,
#   apiKey: string
# ) => {
#   const url = `https://api.0x.org/swap/allowance-holder/price?chainId=${chainId}&buyToken=${buyToken}&sellToken=${sellToken}&sellAmount=${sellAmount}`;
#
#   const response = await fetch(url, {
#     method: "GET",
#     headers: {
#       "Content-Type": "application/json",
#       "0x-api-key": apiKey,
#       "0x-version": "v2",
#
#     },
#   });
#
#   if (!response.ok) {
#     throw new Error(`Error fetching swap price: ${response.statusText}`);
#   }
#
#   const data = await response.json();
#   return data;
# };
# ```
#
#
#
# UI Component Examples for 0x API Integration
#
# Swap API Price Component
#
# The following example demonstrates how to integrate the 0x Swap API into a price component using TypeScript and Viem:
#
# ```typescript
# import { createWalletClient, http, getContract, erc20Abi, parseUnits, maxUint256, publicActions } from "viem";
# import { privateKeyToAccount } from "viem/accounts";
# import { base } from "viem/chains";
#
# const qs = require("qs");
# const headers = new Headers({
#   "Content-Type": "application/json",
#   "0x-api-key": process.env.ZERO_EX_API_KEY,
#   "0x-version": "v2",
# });
#
# const client = createWalletClient({
#   account: privateKeyToAccount(`0x${process.env.PRIVATE_KEY}` as `0x${string}`),
#   chain: base,
#   transport: http(process.env.ALCHEMY_HTTP_TRANSPORT_URL),
# }).extend(publicActions);
#
# const executeSwap = async (sellToken: string, buyToken: string, amount: string) => {
#   const priceParams = new URLSearchParams({
#     chainId: client.chain.id.toString(),
#     sellToken,
#     buyToken,
#     sellAmount: parseUnits(amount, 18).toString(),
#   });
#
#   const priceResponse = await fetch(`https://api.0x.org/swap/allowance-holder/price?${priceParams.toString()}`, { headers });
#   const price = await priceResponse.json();
#   console.log("Price Response:", price);
#
#   const quoteResponse = await fetch(`https://api.0x.org/swap/allowance-holder/quote?${priceParams.toString()}`, { headers });
#   const quote = await quoteResponse.json();
#   console.log("Quote Response:", quote);
# };
#
# executeSwap("ETH", "USDC", "0.0001");
# ```
#
#
#
# 2. Autonomous Agent Mode
#
# Authentication
#
# API calls require an API key. Include it in the headers:
#
# ```typescript
# const headers = new Headers({
#   "Content-Type": "application/json",
#   "0x-api-key": ZERO_EX_API_KEY,
#   "0x-version": "v2",
# });
# ```
#
#
#
# Key API Endpoints
#
# Get Swap Price
#
# Get an indicative price for a swap.
#
# Endpoint:
# GET /swap/allowance-holder/price
#
# Query Parameters:
#
# -   chainId (integer, required): Blockchain ID.
# -   buyToken (string, required): Token contract address to buy.
# -   sellToken (string, required): Token contract address to sell.
# -   sellAmount (string, required): Amount of sellToken (in base units).
# -   taker (string, optional): Address executing the trade.
#
#
#
# Response Handling
#
# TypeScript Interface for Swap Quotes
#
# ```typescript
# interface SwapQuoteResponse {
#     price: string;
#     estimatedGas: number;
#     to: string;
#     data: string;
# }
#
# try {
#     const response = await fetch(SWAP_API_URL, { headers });
#     const result: SwapQuoteResponse = await response.json();
#     console.log(result.price);
# } catch (error) {
#     console.error('Error fetching quote:', error);
# }
# ```
#
#
#
# Final Notes
#
# -   Always store your API key securely and never expose it in client-side code.
# -   Refer to [0x API Docs](https://0x.org/docs) for full schema details.

