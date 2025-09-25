"use client";

import { ConnectKitButton } from "connectkit";
import { Text } from "./retroui/Text";
import { Button } from "./retroui/Button";

export function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-12">
          <div className="space-y-4">
            <Text as="h1" className="font-bold text-black text-5xl">
              ATHENA
            </Text>
            <Text as="h2" className="font-bold text-black text-4xl">
              HACKERHOUSE
            </Text>
            <div className="w-24 h-1 bg-black mx-auto rounded-full"></div>
          </div>

          <div className="space-y-2">
            <Text className="text-2xl font-semibold text-gray-600 tracking-wider">
              Hunt. Earn. Redeem.
            </Text>
            <Text className="text-gray-500 text-sm">
              Scan QR codes • Collect $CRUNCHIES • Get snacks
            </Text>
          </div>

          <div className="pt-0 flex flex-col items-center justify-center space-y-2">
            <div>
              <ConnectKitButton.Custom>
                {({ show }) => {
                  return <Button onClick={show}>Connect Wallet</Button>;
                }}
              </ConnectKitButton.Custom>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-6 px-4">
        <Text className="text-gray-400 text-sm">Powered by Monad</Text>
      </div>
    </div>
  );
}
