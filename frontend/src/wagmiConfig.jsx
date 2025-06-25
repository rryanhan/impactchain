import { createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { http, createPublicClient } from 'viem'; 
import { injected } from '@wagmi/connectors'; 

export const wagmiConfig = createConfig({
  autoConnect: true,
  chains: [polygonAmoy],
  connectors: [
    injected(), 
  ],
  transports: {
    [polygonAmoy.id]: http(import.meta.env.VITE_POLYGON_AMOY_RPC_URL),
  },
  publicClient: createPublicClient({
    chain: polygonAmoy,
    transport: http(import.meta.env.VITE_POLYGON_AMOY_RPC_URL),
  }),

});