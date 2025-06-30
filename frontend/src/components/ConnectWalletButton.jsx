import React from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { Link } from 'react-router-dom';

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

    // Show "Start an ImpactChain!" button when connected
    return (
      <Link to="/create">
        <button className="
            bg-green-500
            font-bold 
            py-3 px-8 rounded-sm 
            text-lg shadow-lg hover:shadow-xl hover:bg-green-50
            transition duration-300 ease-in-out transform hover:scale-105
          ">
          Start an ImpactChain!
        </button>
      </Link>
    );
  }

  if (!metaMaskConnector) {
    return (
      <p className="text-red-500 font-medium">MetaMask not detected. Please install.</p>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: metaMaskConnector })}
      className="
        bg-green-400 text-black font-bold py-3 px-3 rounded-sm
        text-lg shadow-lg hover:shadow-xl hover:bg-green-200
        transition duration-300 ease-in-out transform hover:scale-105
      "
    >
      Connect Wallet
    </button>
  );
}

export default ConnectWalletButton;