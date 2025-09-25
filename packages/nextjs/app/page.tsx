"use client";

import type { NextPage } from "next";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Home: NextPage = () => {
  const router = useRouter();
  const [bootProgress, setBootProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Starting DickSwap...');
  const [showCursor, setShowCursor] = useState(true);

  const bootMessages = [
    'Starting DickSwap...',
    'Loading system files...',
    'Initializing swap protocols...',
    'Checking longness parameters...',
    'Establishing blockchain connection...',
    'Calibrating swap algorithms...',
    'Ready to swap!'
  ];

  useEffect(() => {
    // Cursor blink effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    // Boot sequence
    const bootInterval = setInterval(() => {
      setBootProgress(prev => {
        const newProgress = prev + 1;
        
        // Update message based on progress
        const messageIndex = Math.floor((newProgress / 100) * (bootMessages.length - 1));
        setCurrentMessage(bootMessages[Math.min(messageIndex, bootMessages.length - 1)]);
        
        // Complete boot and redirect
        if (newProgress >= 100) {
          clearInterval(bootInterval);
          setTimeout(() => {
            router.replace('/dickswap');
          }, 1000);
        }
        
        return newProgress;
      });
    }, 80);

    return () => {
      clearInterval(cursorInterval);
      clearInterval(bootInterval);
    };
  }, [router]);

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center"
      style={{
        background: 'linear-gradient(135deg, #008080 0%, #004040 100%)',
        fontFamily: 'MS Sans Serif, sans-serif',
        color: '#c0c0c0'
      }}
    >
      {/* Windows 95 style boot screen */}
      <div className="w-full max-w-2xl px-8">
        
        {/* Logo/Title Section */}
        <div className="text-center mb-12">
          <div 
            className="text-6xl font-bold mb-4"
            style={{
              color: '#ffffff',
              textShadow: '3px 3px 0px #000000, 2px 2px 0px #808080',
              fontFamily: 'MS Sans Serif, serif',
              letterSpacing: '4px'
            }}
          >
            DickSwap
          </div>
          
          <div 
            className="text-lg"
            style={{
              color: '#c0c0c0',
              fontFamily: 'MS Sans Serif, sans-serif'
            }}
          >
            Version 1.0
          </div>
        </div>

        {/* Boot Messages */}
        <div className="mb-8">
          <div 
            className="text-left font-mono text-sm h-6"
            style={{
              color: '#ffffff',
              fontFamily: 'Courier New, monospace'
            }}
          >
            {currentMessage}
            <span 
              className={`ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: '#ffffff' }}
            >
              _
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div 
            className="w-full h-6 border-2 relative"
            style={{
              borderColor: '#808080 #ffffff #ffffff #808080',
              background: '#c0c0c0'
            }}
          >
            <div 
              className="h-full transition-all duration-100 ease-linear"
              style={{
                width: `${bootProgress}%`,
                background: 'linear-gradient(90deg, #000080 0%, #0000ff 50%, #000080 100%)',
                boxShadow: 'inset 1px 1px 0px #ffffff, inset -1px -1px 0px #808080'
              }}
            />
          </div>
          
          <div 
            className="text-center mt-2 text-sm"
            style={{
              color: '#c0c0c0',
              fontFamily: 'MS Sans Serif, sans-serif'
            }}
          >
            {bootProgress}% Complete
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center">
          <div 
            className="text-sm"
            style={{
              color: '#ffff00',
              fontFamily: 'MS Sans Serif, sans-serif',
              textShadow: '1px 1px 0px #000000'
            }}
          >
            YoUr LoNgNeSs DeCiDeS YoUr SwApPiNg
          </div>
        </div>

        {/* Windows style copyright */}
        <div 
          className="text-center mt-8 text-xs"
          style={{
            color: '#808080',
            fontFamily: 'MS Sans Serif, sans-serif'
          }}
        >
          Copyright © 2024 DickSwap Corporation. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Home;
