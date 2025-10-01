'use client';

import { useState, useMemo, useEffect } from "react";
import { useLogin, usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import { createPublicClient, http, formatEther } from "viem";
import { monadTestnet } from "viem/chains";
import { motion } from "framer-motion";

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export default function UseLoginPrivy() {
  const { ready, user, logout } = usePrivy();
  const { login } = useLogin();
  const [balance, setBalance] = useState<string | null>(null);

  const ethereumEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () => (user?.linkedAccounts.filter(
      (account) =>
        account.type === "wallet" &&
        account.walletClientType === "privy" &&
        account.chainType === "ethereum"
    ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const walletAddress = ethereumEmbeddedWallets[0]?.address;

  // Fetch wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;
      try {
        const balanceWei = await publicClient.getBalance({ address: walletAddress as `0x${string}` });
        setBalance(formatEther(balanceWei));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };
    fetchBalance();
  }, [walletAddress]);

  if (!ready) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">Privy Wallet</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">Connect and manage your embedded wallet</p>
        </div>

        {/* Action Buttons Section */}
        <div className="flex flex-wrap justify-center gap-6">
          {/* Show Login button only if wallet is not connected */}
          {!walletAddress && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => login()}
              className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20"
            >
              Login
            </motion.button>
          )}

          {/* Show wallet info if connected */}
          {walletAddress && (
            <motion.div
              className="px-6 py-4 rounded-2xl shadow-lg backdrop-blur-md border border-white/20 bg-white/10 dark:bg-white/10 flex flex-col items-center text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="font-mono text-sm break-all">{walletAddress}</p>
              {balance && <p className="text-sm mt-1 text-green-300">{parseFloat(balance).toFixed(4)} ETH</p>}
            </motion.div>
          )}

          {/* Logout button */}
          {walletAddress && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="px-8 py-4 text-white font-bold rounded-2xl shadow-lg transition-all duration-300 backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20"
            >
              Logout
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
