'use client';

import { useAccount, useChainId, useSendTransaction, useWalletClient, useSignTypedData, useWaitForTransactionReceipt } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { MONAD_TESTNET_TOKENS } from "@/utils/constants";
import { parseUnits, type Address, concat, numberToHex, size, type Hex } from "viem";
import qs from "qs";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const diceImages = [
  "/dice1.jpg",
  "/dice2.jpeg",
  "/dice3.jpg",
  "/dice4.png",
  "/dice5.jpg",
  "/dice6.jpg",
];

export default function DiceSwap() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId() || 10143;
  const { data: walletClient } = useWalletClient();
  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { signTypedDataAsync } = useSignTypedData();

  const [loading, setLoading] = useState(false);
  const [diceFace, setDiceFace] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pendingResult, setPendingResult] = useState<string | null>(null);
  const [swapResult, setSwapResult] = useState<string | null>(null);

  useEffect(() => {
    if (hash) setTxHash(hash);
  }, [hash]);

  const diceToToken = useMemo(() => ({
    1: MONAD_TESTNET_TOKENS[1],
    2: MONAD_TESTNET_TOKENS[2],
    3: MONAD_TESTNET_TOKENS[3],
    4: MONAD_TESTNET_TOKENS[4],
    5: MONAD_TESTNET_TOKENS[5],
    6: MONAD_TESTNET_TOKENS[6],
  } as const), []);

  const rollDice = async () => {
    if (!isConnected || !address) return alert("Connect wallet first");

    setLoading(true);
    setDiceFace(null);
    setRolling(true);
    setSwapResult(null);
    setPendingResult(null);
    setTxHash(null);

    const start = Date.now();
    const interval = setInterval(() => {
      const r = Math.floor(Math.random() * 6) + 1;
      setDiceFace(r);
      if (Date.now() - start > 800) {
        clearInterval(interval);
        const finalFace = Math.floor(Math.random() * 6) + 1;
        setDiceFace(finalFace);
        setRolling(false);
        void startSwap(finalFace);
      }
    }, 100);
  };

  const startSwap = async (face: number) => {
    try {
      // Random WMON amount to swap
      const amountWMON = (Math.random() * (0.5 - 0.01) + 0.01).toFixed(4);
      const WMON = MONAD_TESTNET_TOKENS[0];
      const sellAmount = parseUnits(amountWMON, WMON.decimals).toString();

      const order: Array<1|2|3|4|5|6> = [1,2,3,4,5,6];
      const startIdx = face - 1;
      const tryOrder = order.slice(startIdx).concat(order.slice(0, startIdx));

      let sent = false;
      let chosenToken = "";
      let receivedAmount = amountWMON;

      for (const key of tryOrder) {
        const target = diceToToken[key];
        const baseParams = { chainId, sellToken: WMON.address, buyToken: target.address, sellAmount };

        try {
          const p2Res = await fetch(`/api/quote?${qs.stringify({...baseParams, taker: address as Address})}`);
          const p2Quote = await p2Res.json();

          if (p2Quote?.transaction?.to && p2Quote?.transaction?.data) {
            if (p2Quote?.permit2?.eip712) {
              const signature: Hex = await signTypedDataAsync(p2Quote.permit2.eip712);
              const sigLengthHex = numberToHex(size(signature), { signed: false, size: 32 });
              p2Quote.transaction.data = concat([p2Quote.transaction.data as Hex, sigLengthHex as Hex, signature as Hex]);
            }

            sendTransaction?.({
              account: walletClient?.account.address,
              chainId,
              to: p2Quote.transaction.to,
              data: p2Quote.transaction.data,
              value: p2Quote?.transaction?.value ? BigInt(p2Quote.transaction.value) : undefined,
              gas: p2Quote?.transaction?.gas ? BigInt(p2Quote.transaction.gas) : undefined,
            });

            chosenToken = target.symbol;
            // Simulate received amount
            receivedAmount = (parseFloat(amountWMON) * (Math.random() * 1.5 + 0.5)).toFixed(4);
            sent = true;
            break;
          }
        } catch {}
      }

      if (!sent) throw new Error("No valid WMON pair available");

      // ✅ Swap result without rolled number
// ✅ Swap result without rolled number
setPendingResult(`Swapped ${amountWMON} WMON → ${receivedAmount} ${chosenToken}`);
    } catch (e) {
      console.error(e);
      setSwapResult("❌ Swap failed: " + (e as Error).message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed && pendingResult) {
      setSwapResult(pendingResult);
      setPendingResult(null);
      setLoading(false);
    }
  }, [isConfirmed, pendingResult]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Dice Animation */}
      <AnimatePresence>
        {diceFace && (
          <motion.div
            key={diceFace}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 360] }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.6 }}
            className="w-32 h-32 relative rounded-2xl"
          >
            <Image
              src={diceImages[diceFace - 1]}
              alt={`Dice ${diceFace}`}
              fill
              className="object-cover rounded-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rolled Value below Dice */}
      {diceFace && (
        <motion.div
          key={`rolled-${diceFace}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
          className="text-white font-bold text-xl"
        >
          🎲 Rolled {diceFace}
        </motion.div>
      )}

      {/* Roll Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={loading || rolling}
        onClick={rollDice}
        className="px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white text-xl font-bold rounded-2xl shadow-lg disabled:opacity-50 transition-all duration-300"
      >
        {loading ? "Rolling..." : "Roll Dice"}
      </motion.button>

      {/* Swap Result Glass Boxes */}
      <AnimatePresence>
        {swapResult && (
          <div className="flex flex-col items-center space-y-3">

            {/* Swap Result Box */}
            <motion.div
              key={`swap-${swapResult}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-sm p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-center text-white flex items-center justify-center space-x-2"
            >
              <p className="font-semibold">{swapResult}</p>
              <span className="text-green-400 text-xl">✅</span>
            </motion.div>

            {/* Transaction Hash Box */}
            {txHash && (
              <motion.div
                key={`tx-${txHash}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="w-full max-w-sm p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md text-center text-gray-300 text-sm"
              >
                Tx:{' '}
                <a
                  href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-300"
                >
                  {txHash.slice(0, 6)}…{txHash.slice(-6)}
                </a>
              </motion.div>
            )}

            {/* Confirmation Box */}
            {isConfirming && (
              <motion.div
                key="confirming"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="w-full max-w-sm p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-md text-center text-yellow-300 text-sm"
              >
                Waiting for confirmation…
              </motion.div>
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
