import { Address, Hex } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import GMON_ABI from "@/ABI/GMON.json";

const MONAD_TESTNET_CHAIN_ID = 10143;

export const GMON_ADDRESS: Address = "0xe4A4d64C4A5cbf6fbFfC0658C1e2a0b64e4fa17c";

export function useGmonBalance(owner?: Address) {
  const { address } = useAccount();
  const target = owner ?? (address as Address | undefined);
  return useReadContract({
    abi: GMON_ABI as any,
    address: GMON_ADDRESS,
    functionName: "balanceOf",
    args: target ? [target] : undefined,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: { enabled: !!target },
  });
}

export function useGmonAllowance(owner?: Address, spender?: Address) {
  const { address } = useAccount();
  const target = owner ?? (address as Address | undefined);
  return useReadContract({
    abi: GMON_ABI as any,
    address: GMON_ADDRESS,
    functionName: "allowance",
    args: target && spender ? [target, spender] : undefined,
    chainId: MONAD_TESTNET_CHAIN_ID,
    query: { enabled: !!target && !!spender },
  });
}

export function useApproveGmon() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const approve = (spender: Address, amount: bigint) =>
    writeContract({
      abi: GMON_ABI as any,
      address: GMON_ADDRESS,
      functionName: "approve",
      args: [spender, amount],
      chainId: MONAD_TESTNET_CHAIN_ID,
    });

  return { approve, hash: hash as Hex | undefined, isPending, error };
}


