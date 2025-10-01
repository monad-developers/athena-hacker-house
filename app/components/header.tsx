'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '../../public/Logo.jpeg';
import { Menu, X } from 'lucide-react';
import { usePrivy, useLogin, useCreateWallet, WalletWithMetadata } from '@privy-io/react-auth';

export default function Header() {
  const [isScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { ready, user, logout } = usePrivy();
  const { login } = useLogin();
  const { createWallet: createEthereumWallet } = useCreateWallet();

  const ethereumEmbeddedWallets = useMemo<WalletWithMetadata[]>(
    () =>
      (user?.linkedAccounts.filter(
        (acc) =>
          acc.type === 'wallet' &&
          acc.walletClientType === 'privy' &&
          acc.chainType === 'ethereum'
      ) as WalletWithMetadata[]) ?? [],
    [user]
  );

  const hasEthereumWallet = ethereumEmbeddedWallets.length > 0;

  const handleCreateWallet = useCallback(async () => {
    setIsCreating(true);
    try {
      await createEthereumWallet();
    } finally {
      setIsCreating(false);
    }
  }, [createEthereumWallet]);

  return (
    <header className="absolute lg:top-8 top-4 px-6 w-full flex justify-center z-50">
      <div
        className={`flex items-center max-w-7xl mx-auto justify-between w-full px-6 py-3 rounded-2xl border ${
          isScrolled ? 'border-gray-200 backdrop-blur-xl' : 'border-gray-100 backdrop-blur-md'
        } bg-white/90 shadow-md`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image src={Logo} alt="DiceSwap Logo" width={40} height={40} className="rounded-xl" />
          <span className="text-2xl text-[#6258b1] font-bold leading-tight">
            BlindDiceSwap
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6"></nav>

        {/* Privy Login Section */}
        <div className="hidden md:flex items-center space-x-4">
          {!ready ? (
            <span>Loading...</span>
          ) : (
            <>
              <button
                onClick={() => login()}
                disabled={!!user}
                className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
                  user
                    ? 'bg-gray-400 cursor-not-allowed hidden text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {user ? 'Logged In' : 'Connect'}
              </button>

              {/* Logout Button */}
              {user && (
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-2xl font-semibold shadow-lg transition backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20 text-red-400"
                >
                  Logout
                </button>
              )}

              {/* Create Wallet Button */}
              <button
                onClick={handleCreateWallet}
                disabled={!user || isCreating || hasEthereumWallet}
                className={`px-4 py-2 hidden rounded-2xl font-semibold shadow-lg transition backdrop-blur-md border border-white/20 bg-white/10 hover:bg-white/20 ${
                  hasEthereumWallet
                    ? 'text-green-400'
                    : !user || isCreating
                    ? 'text-gray-400 hidden'
                    : 'text-blue-400 hidden'
                }`}
              >
                {hasEthereumWallet
                  ? '✓ Wallet Exists'
                  : !user
                  ? 'Login to Create'
                  : isCreating
                  ? 'Creating...'
                  : 'Create Wallet'}
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-800"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 w-[90%] bg-white shadow-lg rounded-xl py-4 flex flex-col items-center space-y-4 border border-gray-200">
          {!ready ? (
            <span>Loading...</span>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <button
                onClick={() => login()}
                disabled={!!user}
                className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
                  user
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {user ? 'Logged In' : 'Login'}
              </button>
              <button
                onClick={logout}
                disabled={!user}
                className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
                  !user
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {!user ? 'Logged Out' : 'Logout'}
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={!user || isCreating || hasEthereumWallet}
                className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
                  hasEthereumWallet
                    ? 'bg-green-600 text-white cursor-default'
                    : !user || isCreating
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {hasEthereumWallet
                  ? '✓ Wallet Exists'
                  : !user
                  ? 'Login to Create'
                  : isCreating
                  ? 'Creating...'
                  : 'Create Wallet'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
