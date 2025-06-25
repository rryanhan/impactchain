// frontend/src/components/ConnectWalletButton.jsx
import React from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from '@wagmi/connectors';
import { polygonAmoy } from 'wagmi/chains';

function ConnectWalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const metaMaskConnector = connectors.find(
    (connector) => connector.id === 'injected'
  );

  if (isConnected) {
    if (chain?.id !== polygonAmoy.id) {
      return (
        // Replaced inline styles with Tailwind classes
        <button
          onClick={() => switchChain?.({ chainId: polygonAmoy.id })}
          className="
            bg-orange-500 text-white font-bold 
            rounded-lg px-4 py-2 border-none cursor-pointer 
            hover:bg-orange-600 transition duration-200
          "
        >
          Switch to Polygon Amoy
        </button>
      );
    }

    return (
      // Replaced inline styles with Tailwind classes
      <div className="flex items-center space-x-2">
        <span className="font-bold text-primary">
          Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="
            bg-gray-200 text-gray-800 
            rounded-lg px-3 py-2 border-none cursor-pointer 
            hover:bg-gray-300 transition duration-200
          "
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (!metaMaskConnector) {
      return (
        <p className="text-red-500 font-medium">MetaMask not detected. Please install.</p>
      );
  }

  return (
    // Replaced inline styles with Tailwind classes
    <button
      onClick={() => connect({ connector: metaMaskConnector })}
      className="
            bg-green-400
            text-black
            font-bold py-3 px-3 rounded-sm
            text-lg shadow-lg hover:shadow-xl hover:bg-green-200
            transition duration-300 ease-in-out transform hover:scale-105
          ">
      Connect Wallet
    </button>
  );
}

export default ConnectWalletButton;