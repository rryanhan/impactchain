import { createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { http, createPublicClient } from 'viem';
import { injected } from '@wagmi/connectors';

// Use a more reliable RPC URL for Polygon Amoy
const POLYGON_AMOY_RPC = "https://rpc-amoy.polygon.technology" || "https://polygon-amoy.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161";

export const wagmiConfig = createConfig({
    autoConnect: true,
    chains: [polygonAmoy],
    connectors: [
        injected(),
    ],
    transports: {
        [polygonAmoy.id]: http(POLYGON_AMOY_RPC),
    },
    publicClient: createPublicClient({
        chain: polygonAmoy,
        transport: http(POLYGON_AMOY_RPC),
    }),

});