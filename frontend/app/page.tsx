"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { LoginPage } from "@/components/LoginPage";
import { QRScanner } from "@/components/Tabs/QRScanner";
import { TabNavigation } from "@/components/Tabs/TabNavigation";
import { RegistrationModal } from "@/components/RegistrationModal";
import { Info } from "lucide-react";
import { Dialog } from "@/components/retroui/Dialog";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/retroui/Button";
import { Text } from "@/components/retroui/Text";
import { Loader } from "@/components/retroui/Loader";
import { LeaderboardTab } from "@/components/Tabs/LeaderboardTab";
import { HuntTab } from "@/components/Tabs/HuntTab";
import { useUser } from "@/hooks/useUser";


export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "leaderboard">("home");
  
  const { isConnected } = useAccount();
  const { 
    user, 
    isLoading, 
    error,
    needsRegistration,
    refreshProfile 
  } = useUser();

  // Show registration modal when user needs to register
  useEffect(() => {
    if (needsRegistration) {
      setShowRegistration(true);
    } else {
      setShowRegistration(false);
    }
  }, [needsRegistration]);

  const handleQRScanned = (_qrCode: string) => {
    setShowScanner(false);
    // Refresh user profile to get updated stats
    refreshProfile();
  };


  const handleRegistrationSuccess = async () => {
    setShowRegistration(false);
    // Force refresh profile to ensure we have complete data
    await refreshProfile();
  };

  // Show login page if wallet is not connected
  if (!isConnected) {
    return <LoginPage />;
  }

  // Show loading state while checking user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader size="lg" count={3} />
          <Text className="text-gray-600">Loading your profile...</Text>
        </div>
      </div>
    );
  }

  // Show error state if something went wrong
  if (error && !needsRegistration) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border-2 border-black rounded-lg p-6 text-center space-y-4">
            <div className="text-4xl mb-4">⚠️</div>
            <Text as="h2" className="text-xl font-bold text-black">
              Something went wrong
            </Text>
            <Text className="text-gray-600">{error}</Text>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show QR Scanner modal
  if (showScanner && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <QRScanner
          onQRScanned={handleQRScanned}
          expectedQR={user?.phaseProgress?.nextQR?.sequenceOrder || 1}
          onClose={() => setShowScanner(false)}
        />
      </div>
    );
  }

  // Main App View - Tab-based navigation
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-black px-4 py-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <Dialog>
              <Dialog.Trigger asChild>
                <Button size="icon" className="rounded-full">
                  <Info className="w-5 h-5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Content
                size="md"
                className="bg-white border-2 border-black rounded-lg"
              >
                <Dialog.Header className="bg-white text-black border-b-2 border-black">
                  <Text as="h3">How to Play</Text>
                </Dialog.Header>
                <div className="p-6 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🕵️‍♂️</span>
                      <div>
                        <Text as="h4" className="font-semibold text-black mb-1">
                          Explore & Find
                        </Text>
                        <Text>
                          Hunt for special QR codes hidden around the event venue.
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📲</span>
                      <div>
                        <Text as="h4" className="font-semibold text-black mb-1">
                          Scan & Earn
                        </Text>
                        <Text>
                          Use the &quot;Scan QR&quot; button on the Home screen to
                          scan the codes and instantly earn tokens.
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <Text as="h4" className="font-semibold text-black mb-1">
                          Compete & Win
                        </Text>
                        <Text>
                          Check the &quot;Leaderboard&quot; to see how you rank
                          against other players!
                        </Text>
                      </div>
                    </div>

                    <div className="bg-gray-50 border-2 border-black rounded-lg p-4 mt-6">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <Text as="h4" className="font-semibold text-black mb-1">
                            Pro-Tip
                          </Text>
                          <Text>
                            Keep an eye on the &quot;Leaderboard&quot; to see how
                            you stack up against other participants.
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog>

            {/* User Profile Button */}
            {/* {user && (
              <Button variant="outline" size="sm" className="flex items-center gap-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.nickname}</span>
              </Button>
            )} */}
          </div>
          
          <ConnectKitButton showAvatar={false} />
        </div>

        {/* User Stats Bar */}
        {/* {user && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-600">💰</span>
                <Text className="font-semibold">{formatTokens(user.totalTokens)} tokens</Text>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-600">📱</span>
                <Text>{user.qrCodesScanned} QRs found</Text>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-purple-600">🎯</span>
                <Text className="text-xs">{getPhaseDisplayName(user.currentPhase)}</Text>
              </div>
            </div>
          </div>
        )} */}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {activeTab === "home" && user && (
            <HuntTab
              scannedQRs={user?.scannedQRs || []}
              onScanQR={() => setShowScanner(true)}
              userProfile={user}
            />
          )}
          {activeTab === "leaderboard" && (
            <LeaderboardTab currentUserAddress={user?.walletAddress} />
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
