import { Address, Hex } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import POOL_ABI from "@/ABI/SimpleSwapPool.json";

const MONAD_TESTNET_CHAIN_ID = 10143;
export const SIMPLE_SWAP_POOL_ADDRESS: Address = "0xDf4682D006a1AeBC154afDE8dD13C912b09Fe9CB";

export function usePoolReserves() {
  return useReadContract({
    abi: POOL_ABI as any,
    address: SIMPLE_SWAP_POOL_ADDRESS,
    functionName: "getReserves",
    args: [],
    chainId: MONAD_TESTNET_CHAIN_ID,
  });
}

export function useSwapEthForGmon() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const swap = (minGmonOut: bigint, valueWei: bigint) =>
    writeContract({
      abi: POOL_ABI as any,
      address: SIMPLE_SWAP_POOL_ADDRESS,
      functionName: "swapETHForGMON",
      args: [minGmonOut],
      value: valueWei,
      chainId: MONAD_TESTNET_CHAIN_ID,
    });

  return { swap, hash: hash as Hex | undefined, isPending, error };
}

export function useSwapGmonForEth() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const swap = (gmonIn: bigint, minEthOut: bigint) =>
    writeContract({
      abi: POOL_ABI as any,
      address: SIMPLE_SWAP_POOL_ADDRESS,
      functionName: "swapGMONForETH",
      args: [gmonIn, minEthOut],
      chainId: MONAD_TESTNET_CHAIN_ID,
    });

  return { swap, hash: hash as Hex | undefined, isPending, error };
}


