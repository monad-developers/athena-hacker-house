'use client';

import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { monadTestnet } from '@/lib/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [monadTestnet],
  ssr: true,
  storage: createStorage({  
    storage: cookieStorage, 
  }),
  connectors: [ 
    injected({
      target: 'metaMask',
    }),
    injected(), // Fallback generic injected connector
  ],
  transports: {
    [monadTestnet.id]: http(),
  },
});

