'use client';

import { WalletConnect } from '@/components/wallet/WalletConnect';

export function Header() {
  return (
    <header className="w-full p-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <h1 className="text-white text-xl font-bold">SwapInAd</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-white/70 hover:text-white transition-colors">
            Swap
          </a>
          <a href="#" className="text-white/70 hover:text-white transition-colors">
            Pool
          </a>
          <a href="#" className="text-white/70 hover:text-white transition-colors">
            Bridge
          </a>
        </nav>
        
        <WalletConnect />
      </div>
    </header>
  );
}