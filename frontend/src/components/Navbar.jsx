// frontend/src/components/Navbar.jsx
import ConnectWalletButton from './ConnectWalletButton.jsx';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="
      w-full flex items-center justify-between bg-gray-50
    ">
      {/* Logo/Title */}
      <img src={"/src/assets/impact-chain-logo.png"} alt="ImpactChain Logo" className="h-15"/>

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
        
        <img className="
          w-20
          flex items-center justify-center 
          
        " src="./src/assets/profile-icon.png"
        />
      </nav>
    </header>
  );
}

export default Navbar;