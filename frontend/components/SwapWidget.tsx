"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ArrowUpDown, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useSwap } from "../hooks/useSwap";
import { WORKING_TOKENS } from "../lib/services/swap-service";
import { Button } from "./retroui/Button";
import { Card } from "./retroui/Card";
import { Text } from "./retroui/Text";

interface SwapOpportunity {
  id: string;
  expiresAt: string;
  qrScan: {
    tokensEarned: string;
    qrCode: {
      name: string;
      rarity: string;
    };
  };
}

export function SwapWidget({ opportunityId }: { opportunityId?: string }) {
  const [sellAmount, setSellAmount] = useState("");
  const [sellToken, setSellToken] = useState("WMON");
  const [buyToken, setBuyToken] = useState("USDT");
  const [opportunities, setOpportunities] = useState<SwapOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Auto-update buy token when sell token changes to avoid same token error
  const handleSellTokenChange = (newSellToken: string) => {
    setSellToken(newSellToken);

    // If the new sell token is the same as buy token, switch buy token
    if (newSellToken === buyToken) {
      const availableTokens = Object.keys(WORKING_TOKENS).filter(
        (token) => token !== newSellToken
      );
      if (availableTokens.length > 0) {
        setBuyToken(availableTokens[0]);
      }
    }
  };

  // Swap the sell and buy tokens
  const handleSwapTokens = () => {
    const tempSellToken = sellToken;
    setSellToken(buyToken);
    setBuyToken(tempSellToken);
    setSellAmount(""); // Clear amount when swapping
  };

  const { executeSwap, isLoading, error, isSuccess, data } = useSwap();

  const { address, isConnected } = useAccount();

  // Fetch user's swap opportunities
  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!isConnected || !address) {
        setOpportunities([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/swap/opportunities", {
          headers: {
            "x-wallet-address": address.toLowerCase(),
          },
        });

        if (response.ok) {
          const result = await response.json();
          setOpportunities(result.opportunities || []);
          if (result.opportunities?.length > 0) {
            setSelectedOpportunity(result.opportunities[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch opportunities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [address, isConnected]);

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();

    const opportunityToUse = opportunityId || selectedOpportunity;
    if (!opportunityToUse) {
      alert("No swap opportunity available. Scan a QR code first!");
      return;
    }

    try {
      await executeSwap({
        sellToken,
        buyToken,
        sellAmount,
        opportunityId: opportunityToUse,
      });
    } catch (err) {
      console.error("Swap error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <Text className="text-gray-600">Loading opportunities...</Text>
        </div>
      </div>
    );
  }

  if (opportunities.length === 0 && !opportunityId) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">💱</div>
        <Text as="h4" className="text-gray-800 mb-2">No Swap Opportunities</Text>
        <Text className="text-sm text-gray-600">
          Scan QR codes to earn swap opportunities!
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Opportunity Selection */}
      {!opportunityId && opportunities.length > 0 && (
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">
            💎 Swap Opportunity
          </Text>
          <div className="relative">
            <select
              value={selectedOpportunity}
              onChange={(e) => setSelectedOpportunity(e.target.value)}
              className="w-full p-3 border-2 border-black shadow-md bg-white font-head text-sm rounded-none appearance-none pr-8"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  From {opp.qrScan.qrCode.name} ({opp.qrScan.tokensEarned} tokens earned)
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <Card className="bg-red-50 border-red-500">
          <Card.Content className="p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <Text className="text-sm text-red-700">{error.message}</Text>
            </div>
          </Card.Content>
        </Card>
      )}

      {isSuccess && (
        <Card className="bg-green-50 border-green-500">
          <Card.Content className="p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <Text className="text-sm text-green-700 font-medium mb-1">
                  Swap successful!
                </Text>
                <Text className="text-xs text-green-600 break-all">
                  TX: {data?.transactionHash}
                </Text>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Swap Form */}
      <form onSubmit={handleSwap} className="space-y-4">
        {/* Sell Token Section */}
        <div className="space-y-2">
          <Text className="text-sm font-medium text-gray-700">💸 Sell</Text>
          <div className="flex gap-2">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.001"
              step="any"
              className="flex-1 p-3 border-2 border-black shadow-md bg-white font-head text-sm rounded-none"
              required
            />
            <div className="relative min-w-[90px]">
              <select
                value={sellToken}
                onChange={(e) => handleSellTokenChange(e.target.value)}
                className="w-full p-3 border-2 border-black shadow-md bg-white font-head text-sm rounded-none appearance-none pr-8"
              >
                {Object.keys(WORKING_TOKENS).map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={handleSwapTokens}
            variant="outline"
            size="icon"
            className="border-gray-400 hover:border-black"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Buy Token Section */}
        <div className="space-y-2">
          <Text className="text-sm font-medium text-gray-700">💰 Buy</Text>
          <div className="flex gap-2">
            <input
              type="text"
              value="USDT" // This would be calculated based on sell amount
              placeholder="0.00"
              className="flex-1 p-3 border-2 border-gray-300 shadow-sm bg-gray-50 font-head text-sm rounded-none text-gray-600"
              disabled
            />
            <div className="relative min-w-[90px]">
              <select
                value={buyToken}
                onChange={(e) => setBuyToken(e.target.value)}
                className="w-full p-3 border-2 border-black shadow-md bg-white font-head text-sm rounded-none appearance-none pr-8"
              >
                {Object.keys(WORKING_TOKENS)
                  .filter((token) => token !== sellToken)
                  .map((token) => (
                    <option key={token} value={token}>
                      {token}
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <Button
          type="submit"
          disabled={isLoading || (!opportunityId && !selectedOpportunity)}
          className="w-full py-3 text-base font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Swapping...
            </>
          ) : (
            "🔄 Execute Swap"
          )}
        </Button>
      </form>
    </div>
  );
}
