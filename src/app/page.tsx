'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { GameInterface } from '@/components/GameInterface';
import Image from 'next/image';
import Link from 'next/link';
import { BiSolidZap } from "react-icons/bi";

export default function Home() {
  const { isConnected } = useAccount();
  const [showGame, setShowGame] = useState(false);

  const handleConnectAndPlay = () => {
    if (isConnected) {
      setShowGame(true);
    }
  };

  if (showGame && isConnected) {
    return <GameInterface onBack={() => setShowGame(false)} />;
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto px-4 py-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-16 px-10">
          <div className="flex items-center space-x-2">
            <Image src="/batman-logo.png" width={50} height={50} alt='logo' />
            <h1 className="text-xl font-bold">Batmon</h1>
          </div>
          <div className="[&_*]:!bg-black [&_*]:!text-white [&_*]:!border-none [&_*]:!rounded-full [&_button]:hover:!bg-[#5a47e6]">
            <ConnectButton showBalance={false} />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="flex gap-4 items-center flex-col mt-8">
              <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
                <span className="text-spektr-cyan-50">Batmon for Batmans</span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
                Experience the thrill of BatMonting on the Monad blockchain. <br />
                Bet in MON and win in USDC
              </p>
            </div>

            {/* CTA Button */}
            <div className="mb-12 mt-6 flex justify-center">
              {isConnected ? (
                <button
                  onClick={handleConnectAndPlay}
                  className="bg-gradient-to-r bg-[#6e54ff] text-white py-2 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <span><BiSolidZap className='w-5 h-5' /></span> <span> Start Playing</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <ConnectButton.Custom>
                    {({
                      account,
                      chain,
                      openChainModal,
                      openConnectModal,
                      authenticationStatus,
                      mounted,
                    }) => {
                      const ready = mounted && authenticationStatus !== 'loading';
                      const connected =
                        ready &&
                        account &&
                        chain &&
                        (!authenticationStatus ||
                          authenticationStatus === 'authenticated');

                      return (
                        <div
                          {...(!ready && {
                            'aria-hidden': true,
                            'style': {
                              opacity: 0,
                              pointerEvents: 'none',
                              userSelect: 'none',
                            },
                          })}
                        >
                          {(() => {
                            if (!connected) {
                              return (
                                <button
                                  onClick={openConnectModal}
                                  type="button"
                                  className="bg-gradient-to-r bg-[#6e54ff] text-white font-bold py-2 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer"
                                >
                                  Connect Wallet & Play
                                </button>
                              );
                            }

                            if (chain.unsupported) {
                              return (
                                <button
                                  onClick={openChainModal}
                                  type="button"
                                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300"
                                >
                                  Wrong network
                                </button>
                              );
                            }

                            return (
                              <button
                                onClick={handleConnectAndPlay}
                                className="bg-[#6e54ff] hover:bg-[#5a47e6] text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg cursor-pointer"
                              >
                                Start Playing
                              </button>
                            );
                          })()}
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                </div>
              )}
            </div>

            <div className="shadow-2xl">
              <div className="bg-gray-200 w-full h-[70vh] border-12 rounded-lg border-black shadow-xl mt-20">
                <Image src="/meme.png" alt="efjeb" width={500} height={500} className="w-full h-full object-fill rounded-lg" />
              </div>
            </div>

            {/* Game Features */}
            <div className="flex flex-col items-center gap-8 mb-12 px-28 mt-24">
              <h1 className="text-2xl md:text-4xl max-w-2xl tracking-tighter text-center font-semibold">
                <span className="text-spektr-cyan-50">Batmon got the power of Batman</span>
              </h1>
              <div className="flex gap-8 mt-4">
                <div className={`
                relative rounded-2xl border border-lime-300/15 max-w-sm w-full bg-gradient-to-br from-black/90 via-neutral-900/90 to-black/90 shadow-xl shadow-lime-900/10 backdrop-blur-md group
                p-6 flex flex-col overflow-hidden group
                transition-all duration-300
                hover:scale-[1.035] hover:-translate-y-1 text-white
                hover:shadow-lg
                `}>
                  <div className="text-3xl mb-4">🎲</div>
                  <h3 className="text-xl font-semibold mb-2">Fair Play</h3>
                  <p className="">
                    On-chain verifiable randomness ensures every roll is fair and transparent.
                  </p>
                </div>
                <div className="relative rounded-2xl max-w-sm w-full border border-lime-300/15 bg-gradient-to-br from-black/90 via-neutral-900/90 to-black/90 shadow-xl shadow-lime-900/10 backdrop-blur-md group
                p-6 flex flex-col overflow-hidden group
                transition-all duration-300
                hover:scale-[1.035] hover:-translate-y-1 text-white
                hover:shadow-lg">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-2">Fast & Secure</h3>
                  <p className="">
                    Built on Monad testnet with 10,000 TPS and 400ms block time.
                  </p>
                </div>
                <div className="relative rounded-2xl border border-lime-300/15 bg-gradient-to-br from-black/90 via-neutral-900/90 to-black/90 shadow-xl shadow-lime-900/10 backdrop-blur-md group max-w-sm w-full
                p-6 flex flex-col overflow-hidden group
                transition-all duration-300
                hover:scale-[1.035] hover:-translate-y-1
                hover:shadow-lg">
                  <div className="text-3xl text-white mb-4">💰</div>
                  <h3 className="text-xl text-white font-semibold mb-2">Win Big</h3>
                  <p className="text-white">
                    Double your bet if you guess correctly! Choose your bet amount from 0.001 to 1.0 ETH.
                  </p>
                </div>
              </div>
            </div>



            {/* Instructions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 max-w-2xl mx-auto">
              <h1 className="text-2xl md:text-4xl max-w-2xl tracking-tighter text-center font-semibold">
                <span className="text-spektr-cyan-50">How to play like a Batman</span>
              </h1>
              <ol className="space-y-2 text-left tracking-tight text-lg mt-6">
                <li>1. Connect your MetaMask wallet</li>
                <li>2. Get testnet tokens from the <a href="https://faucet.monad.xyz" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Monad faucet</a></li>
                <li>3. Choose a number between 1-6</li>
                <li>4. Enter your bet amount (0.001 - 1.0 ETH)</li>
                <li>5. Watch the dice roll and win double if you&apos;re right!</li>
              </ol>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-16">
          <p>Built on Monad • by <Link href='https://x.com/fardeentwt' className='underline'>fardeentwt</Link></p>
        </footer>
      </div>
    </div>
  );
}
