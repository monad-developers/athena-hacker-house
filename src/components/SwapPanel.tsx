"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { TOKENS, Token } from "../types/swap";
import { monad } from "../providers/WalletProviders";
import Image from "next/image";

type Props = {
  controlled?: boolean;
  fromToken?: Token;
  toToken?: Token;
  amount?: string;
  onChange?: (next: { fromToken: Token; toToken: Token; amount: string }) => void;
};

export default function SwapPanel(props: Props) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [uncontrolledAmount, setUncontrolledAmount] = useState<string>("");

  // Hardcode swap direction: MON -> USDC
  const fromToken: Token = TOKENS[0]; // MON
  const toToken: Token = TOKENS[1];   // USDC
  const amount = props.controlled ? (props.amount ?? "") : uncontrolledAmount;

  const { data: fromBalance } = useBalance({
    address,
    token: fromToken.address ?? undefined,
    query: { enabled: Boolean(address) },
  });

  const isWrongNetwork = typeof chainId === "number" && chainId !== monad.id;

  return (
    <div className="sticky top-6 w-[360px] ml-auto glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4 shadow-glass">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-lg md:text-xl font-medium tracking-tight text-[#9488FC]">Swap</h3>
        <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
      </div>

      {isWrongNetwork && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span>
              You are connected to chain ID {chainId}. Please switch to Monad (ID {monad.id}).
            </span>
            <button
              disabled={isSwitching}
              onClick={() => switchChain?.({ chainId: monad.id })}
              className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50"
            >
              {isSwitching ? "Switching…" : "Switch to Monad"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-xs opacity-80">From</label>
        <div className="flex gap-2">
          <Image src={"/monad.jpeg"} height={50} width={50} alt="monad" className="rounded-full"/>
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              if (props.controlled && props.onChange) props.onChange({ fromToken, toToken, amount: e.target.value });
              else setUncontrolledAmount(e.target.value);
            }}
            className="flex-1 px-3 py-2 rounded-xl border border-[var(--gray-alpha-200)] bg-[var(--background)] focus:outline-none"
          />
        </div>
        <div className="text-xs opacity-70">
          Balance: {fromBalance ? fromBalance.formatted : "-"} {fromToken.symbol}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs opacity-80">To</label>
        <div className="flex items-center justify-start gap-4">
         <Image src={"/usdc.png"} height={50} width={50} alt="monad" className="rounded-full"/> 
         <div className="text-xl font-bold">USDC</div>
         </div>
      </div>
    </div>
  );
}


