"use client";

import { useCallback, useMemo, useState } from "react";
import SwapPanel from "../components/SwapPanel";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { parseUnits } from "viem";
import { TOKENS, Token } from "../types/swap";
import { monad } from "../providers/WalletProviders";

type CellState = "hidden" | "miss" | "diamond";

export default function Home() {
  const { address } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState<string>("");
  const [diamondIndex, setDiamondIndex] = useState<number>(() => Math.floor(Math.random() * 9));
  const [cells, setCells] = useState<CellState[]>(Array(9).fill("hidden"));
  const [triesLeft, setTriesLeft] = useState<number>(3);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [swapResult, setSwapResult] = useState<null | { txHash: string; message: string }>(null);
  const [, setIsSwapping] = useState<boolean>(false);

  const revealCell = useCallback(
    (index: number) => {
      if (status !== "playing") return;
      if (cells[index] !== "hidden") return;

      const isDiamond = index === diamondIndex;
      const newCells = [...cells];
      newCells[index] = isDiamond ? "diamond" : "miss";
      setCells(newCells);

      if (isDiamond) {
        setStatus("won");
        triggerSwap();
        return;
      }

      const nextTries = triesLeft - 1;
      setTriesLeft(nextTries);
      if (nextTries <= 0) {
        setStatus("lost");
      }
    },
    [cells, diamondIndex, status, triesLeft]
  );

  const resetGame = useCallback(() => {
    setDiamondIndex(Math.floor(Math.random() * 9));
    setCells(Array(9).fill("hidden"));
    setTriesLeft(3);
    setStatus("playing");
    setSwapResult(null);
    setIsSwapping(false);
  }, []);

  const triggerSwap = useCallback(async () => {
    try {
      if (!address || !walletClient) {
        setSwapResult({ txHash: "0x", message: "Connect wallet to swap." });
        return;
      }

      setIsSwapping(true);

      const zeroExChainId = Number(process.env.NEXT_PUBLIC_ZEROEX_CHAIN_ID || process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || 10143);
      try {
        await switchChain({ chainId: zeroExChainId });
      } catch {
      }
      const NATIVE_SENTINEL = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
      if (toToken.symbol === "USDC" && !toToken.address) {
        throw new Error("USDC address not configured. Set NEXT_PUBLIC_USDC_ADDRESS in .env.local");
      }
      const sellTokenParam = fromToken.address ? fromToken.address : NATIVE_SENTINEL;
      const buyTokenParam = toToken.address ? toToken.address : NATIVE_SENTINEL;
      const numericAmount = Number(amount);
      if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        setSwapResult({ txHash: "0x", message: "Enter a valid amount greater than 0." });
        return;
      }
      const sellAmount = parseUnits(amount, fromToken.decimals).toString();

      const params = new URLSearchParams({
        chainId: String(zeroExChainId),
        sellToken: String(sellTokenParam),
        buyToken: String(buyTokenParam),
        sellAmount,
        taker: address,
      });

      const quoteRes = await fetch(`/api/swap?${params.toString()}`, { cache: "no-store" });

      if (!quoteRes.ok) {
        const errText = await quoteRes.text();
        try {
          const errJson = JSON.parse(errText);
          const msg = typeof errJson?.error === "string" ? errJson.error : JSON.stringify(errJson);
          throw new Error(`Quote failed (${quoteRes.status}): ${msg}`);
        } catch {
          throw new Error(`Quote failed (${quoteRes.status}): ${errText}`);
        }
      }

      const quote = await quoteRes.json();

      if (fromToken.address && quote.allowanceTarget && quote.issues?.allowance) {
        const currentAllowance = BigInt(quote.issues.allowance.actual || "0");
        const required = BigInt(sellAmount);
        if (currentAllowance < required) {
          const erc20ApproveAbi = [
            {
              type: "function",
              name: "approve",
              stateMutability: "nonpayable",
              inputs: [
                { name: "spender", type: "address" },
                { name: "amount", type: "uint256" },
              ],
              outputs: [{ name: "", type: "bool" }],
            },
          ] as const;
          await walletClient.writeContract({
            address: fromToken.address,
            abi: erc20ApproveAbi,
            functionName: "approve",
            args: [quote.allowanceTarget, required],
          });
        }
      }

      const tx = quote.transaction ?? quote;
      const hash = await walletClient.sendTransaction({
        account: address,
        chain: monad,
        to: tx.to,
        data: tx.data,
        value: tx.value ? BigInt(tx.value) : undefined,
        gas: tx.gas ? BigInt(tx.gas) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
      });

      setSwapResult({ txHash: hash, message: "Swap submitted via 0x Swap API." });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Swap failed.";
      const userRejected = /User rejected|User rejected the request|Request rejected/i.test(message);
      setSwapResult({ txHash: "0x", message: userRejected ? "User rejected the request." : message });
    } finally {
      setIsSwapping(false);
    }
  }, [address, walletClient, amount, fromToken, toToken, switchChain]);

  const statusText = useMemo(() => {
    if (status === "playing") return `Tries left: ${triesLeft}`;
    if (status === "won") return "You found the 💎! Swapping on Monad...";
    return "No tries left. You lost.";
  }, [status, triesLeft]);

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-10 p-6 md:p-10 min-h-svh items-start md:items-center justify-center mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-6 md:gap-8 flex-1">
        <div className="space-y-2">
          <h1 className="m-0 text-3xl md:text-5xl font-semibold tracking-tight">
            <span className="bg-clip-text  text-[#9488FC]">Monad</span> Mines
          </h1>
          <p className="m-0 opacity-80 text-sm md:text-base" aria-live="polite">{statusText}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 md:p-6 shadow-glass w-full max-w-md">
          <div className="grid grid-cols-3 gap-4 md:gap-5 place-items-center">
            {cells.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => revealCell(idx)}
                disabled={status !== "playing" || cell !== "hidden"}
                className={
                  "size-16 md:size-20 text-2xl rounded-xl border select-none transition-all " +
                  (status === "playing" && cell === "hidden" ? "hover:scale-[1.03] active:scale-95 cursor-pointer" : "cursor-default") +
                  " " + (cell === "hidden" ? "bg-[var(--background)] border-[var(--gray-alpha-200)]" : "bg-[var(--gray-alpha-100)] border-[var(--gray-alpha-200)]")
                }
              >
                {cell === "hidden" ? "?" : cell === "diamond" ? "💎" : "❌"}
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[var(--gray-alpha-200)] bg-[var(--gray-alpha-100)] hover:bg-[var(--gray-alpha-200)] transition-colors text-sm md:text-base font-medium min-w-32"
              onClick={resetGame}
            >
              Reset
            </button>
          </div>

          {swapResult && (
            <div className="mt-6 font-[var(--font-geist-mono)] break-all whitespace-pre-wrap max-w-full text-sm">
              <div><strong>Message:</strong> {swapResult.message}</div>
              <div><strong>Tx Hash:</strong> {swapResult.txHash}</div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-auto">
        <SwapPanel
          controlled
          fromToken={fromToken}
          toToken={toToken}
          amount={amount}
          onChange={({ fromToken, toToken, amount }) => {
            setFromToken(fromToken);
            setToToken(toToken);
            setAmount(amount);
          }}
        />
      </div>
    </div>
  );
}
