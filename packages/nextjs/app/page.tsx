"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dickswap');
  }, [router]);

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2" style={{
              color: '#8a2be2',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              fontFamily: 'Tahoma, Verdana, sans-serif'
            }}>
              Welcome to
            </span>
            <span className="block text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(90deg, #8a2be2, #ff1493)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(255, 20, 147, 0.3)',
              fontFamily: 'Tahoma, Verdana, sans-serif',
              letterSpacing: '2px'
            }}>
              DickSwap
            </span>
          </h1>

          <div className="text-center mt-6">
            <p className="text-lg mb-4" style={{
              color: '#f5d5e5',
              fontFamily: 'Tahoma, Verdana, sans-serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }}>
              YoUr LoNgNeSs DeCiDeS YoUr SwApPiNg
            </p>

          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
