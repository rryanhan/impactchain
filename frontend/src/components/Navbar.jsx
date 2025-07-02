// frontend/src/components/Navbar.jsx
import ConnectWalletButton from './ConnectWalletButton.jsx';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

function Navbar() {
    const { isConnected } = useAccount();

    return (
        <header className="
      w-full flex items-center justify-between bg-gray-50
    ">
            {/* Logo/Title */}
            <Link to="/">
                <img src={"/public/assets/impact-chain-logo.png"} alt="ImpactChain Logo" className="h-15" />
            </Link>
            {/* Navigation and Connect Wallet */}
            <nav className="flex items-center space-x-4">
                {/* "Start an ImpactChain!" button */}
                <Link to="/create">
                    <button className="
            bg-green-400
            text-black
            font-bold py-3 px-3 rounded-sm
            text-lg 
            cursor-pointer
          ">
                        Start an ImpactChain!
                    </button>
                </Link>

                {/* Profile Photo - Only show when connected */}
                {isConnected && (
                    <Link to="/profile">
                        <img className="
              w-20
              flex items-center justify-center
              cursor-pointer
              hover:opacity-80
              transition-opacity"
                            src="/public/assets/profile-icon.png"
                            alt='Profile'
                        />
                    </Link>
                )}

                {!isConnected && (
                    <img className="
              w-20
              flex items-center justify-center"
                        src="/public/assets/profile-icon.png"
                        alt='Profile'
                    />
                )}
            </nav>
        </header>
    );
}

export default Navbar;