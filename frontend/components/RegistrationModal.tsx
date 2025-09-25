"use client";

import { useState } from "react";
import { Dialog } from "./retroui/Dialog";
import { Button } from "./retroui/Button";
import { Text } from "./retroui/Text";
import { Card } from "./retroui/Card";
import { Loader } from "./retroui/Loader";
import { useUser } from "@/hooks/useUser";
import { User, Wallet, CheckCircle, AlertCircle } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrationModal({ isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { register, isRegistering, walletAddress } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate nickname
    if (!nickname.trim()) {
      setError("Please enter a nickname");
      return;
    }

    if (nickname.length < 3) {
      setError("Nickname must be at least 3 characters");
      return;
    }

    if (nickname.length > 20) {
      setError("Nickname must be less than 20 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      setError("Nickname can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    try {
      const result = await register(nickname.trim());
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  const handleClose = () => {
    if (!isRegistering) {
      setNickname("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content size="md" className="bg-white border-2 border-black rounded-lg">
        <Dialog.Header className="bg-white text-black border-b-2 border-black">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <Text as="h3">Welcome to Token Crunchies!</Text>
          </div>
        </Dialog.Header>

        <div className="p-6 space-y-6">
          {/* Welcome Message */}
          <div className="text-center space-y-3">
            <div className="text-4xl">🎉</div>
            <Text className="text-lg font-semibold text-black">
              Ready to start your treasure hunt?
            </Text>
            <Text className="text-gray-600">
              Create your player profile to begin scanning QR codes and earning tokens!
            </Text>
          </div>

          {/* Wallet Info */}
          <Card className="bg-gray-50">
            <Card.Content className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-green-600" />
                <div>
                  <Text className="font-semibold text-black">Connected Wallet</Text>
                  <Text className="text-sm text-gray-600 font-mono">
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                  </Text>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
              </div>
            </Card.Content>
          </Card>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-black mb-2">
                Choose your nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter a unique nickname"
                className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRegistering}
                maxLength={20}
                autoComplete="off"
              />
              <Text className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </Text>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <Text className="text-sm text-red-700">{error}</Text>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isRegistering}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRegistering || !nickname.trim()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isRegistering ? (
                  <>
                    <Loader size="sm" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    Create Profile
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Game Info */}
          <div className="border-t-2 border-gray-200 pt-4">
            <Text className="text-sm text-gray-600 text-center">
              Once registered, you&apos;ll be able to scan QR codes, earn tokens, and compete on the leaderboard!
            </Text>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
