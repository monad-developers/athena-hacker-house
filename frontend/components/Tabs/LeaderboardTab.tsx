"use client";

import { useState } from "react";
import { Loader } from "../retroui/Loader";
import { Text } from "../retroui/Text";
import { Card } from "../retroui/Card";
import { Button } from "../retroui/Button";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { formatTokens } from "@/lib/api-client";
import { RefreshCw, Trophy, Users, Coins } from "lucide-react";

interface LeaderboardTabProps {
  currentUserAddress?: string;
}

export function LeaderboardTab({ currentUserAddress }: LeaderboardTabProps) {
  const [sortBy, setSortBy] = useState<'totalTokens' | 'qrCodesScanned' | 'rareQRsScanned'>('totalTokens');
  
  const {
    data,
    isLoading,
    error,
    refreshLeaderboard,
    loadMore,
    hasMore,
    totalUsers,
    totalTokensDistributed,
    totalQRsScanned,
    topPlayer,
    lastUpdated
  } = useLeaderboard({
    sortBy,
    limit: 20,
    autoRefresh: true,
    refreshInterval: 30000
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-xl">🥇</span>;
      case 2:
        return <span className="text-xl">🥈</span>;
      case 3:
        return <span className="text-xl">🥉</span>;
      default:
        return (
          <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">
            #{rank}
          </span>
        );
    }
  };

  const isCurrentUser = (userId: string, nickname: string) => {
    return (
      currentUserAddress &&
      (userId.toLowerCase() === currentUserAddress.toLowerCase() ||
       nickname.toLowerCase().includes(currentUserAddress.toLowerCase()))
    );
  };

  const getSortLabel = (sort: string) => {
    const labels = {
      totalTokens: 'Total Tokens',
      qrCodesScanned: 'QR Codes',
      rareQRsScanned: 'Rare QRs'
    };
    return labels[sort as keyof typeof labels] || sort;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader size="lg" count={3} />
        <Text className="text-gray-600">Loading leaderboard...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-4xl">❌</div>
        <Text className="text-gray-600 text-center">
          Failed to load leaderboard
        </Text>
        <Text className="text-sm text-gray-500 text-center">{error}</Text>
        <Button onClick={() => refreshLeaderboard()} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-4xl">🏆</div>
        <Text className="text-gray-600 text-center">
          No players yet
        </Text>
        <Text className="text-sm text-gray-500 text-center">
          Be the first to scan QR codes and claim your spot!
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white">
          <Card.Content className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <Text className="text-2xl font-bold text-black">{totalUsers}</Text>
            <Text className="text-sm text-gray-600">Players</Text>
          </Card.Content>
        </Card>
        
        <Card className="bg-white">
          <Card.Content className="p-4 text-center">
            <Coins className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <Text className="text-2xl font-bold text-black">
              {formatTokens(totalTokensDistributed)}
            </Text>
            <Text className="text-sm text-gray-600">Tokens</Text>
          </Card.Content>
        </Card>
        
        <Card className="bg-white">
          <Card.Content className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <Text className="text-2xl font-bold text-black">{totalQRsScanned}</Text>
            <Text className="text-sm text-gray-600">QRs Found</Text>
          </Card.Content>
        </Card>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['totalTokens', 'qrCodesScanned', 'rareQRsScanned'] as const).map((sort) => (
          <Button
            key={sort}
            variant={sortBy === sort ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy(sort)}
            className="whitespace-nowrap"
          >
            {getSortLabel(sort)}
          </Button>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <Text className="text-sm text-gray-500">
          {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
        </Text>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshLeaderboard()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {data.leaderboard.map((entry) => (
          <Card
            key={entry.userId}
            className={`bg-white w-full ${
              isCurrentUser(entry.userId, entry.nickname) ? "ring-2 ring-blue-500 bg-blue-50" : ""
            }`}
          >
            <Card.Content className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {getRankIcon(entry.rank)}
                <div>
                  <Text className="font-semibold text-black">
                    {entry.nickname}
                    {isCurrentUser(entry.userId, entry.nickname) && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        You
                      </span>
                    )}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {entry.qrCodesScanned} QRs • {entry.rareQRsScanned} rare • {entry.legendaryQRsScanned} legendary
                  </Text>
                </div>
              </div>

              <div className="text-right">
                <Text className="text-lg font-bold text-black">
                  {formatTokens(entry.totalTokens)}
                </Text>
                <Text className="text-sm text-gray-600">tokens</Text>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            className="w-full"
          >
            Load More Players
          </Button>
        </div>
      )}

      {/* Top Player Highlight */}
      {topPlayer && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <Card.Content className="p-4 text-center">
            <div className="text-2xl mb-2">👑</div>
            <Text className="font-bold text-black">Current Champion</Text>
            <Text className="text-lg font-semibold text-orange-600">
              {topPlayer.nickname}
            </Text>
            <Text className="text-sm text-gray-600">
              {formatTokens(topPlayer.totalTokens)} tokens • {topPlayer.qrCodesScanned} QRs found
            </Text>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
