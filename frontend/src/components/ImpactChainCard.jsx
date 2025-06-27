// frontend/src/components/ImpactChainCard.js
import React from 'react';
import ChainLink from "./ChainLink";
// No longer need initialImpactChainsData here
// import { ethers } from 'ethers'; // You might need ethers.js if you remove multicall and parse BigInts here

const ImpactChainCard = ({ chain }) => {
  // Ensure goal and raised are treated as numbers after formatting
  // If not using multicall (which formats with ethers.utils.formatUnits), you'd format BigInts here
  const raised = chain.raised; // Assume already formatted to number by ExploreImpactChains
  const goal = chain.goal;     // Assume already formatted to number by ExploreImpactChains

  const percentage = Math.min((raised / goal) * 100, 100);
  const filledLinks = Math.floor((percentage / 100) * 12); // 12 links total

  return (
    <div className="bg-white rounded-lg overflow-hidden group">
      <img src={chain.imageUrl} alt={chain.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"/>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-3 truncate">{chain.title}</h3>
        
        {/* Custom Chain Link Progress Bar */}
        <div className="flex items-center mb-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex-1">
              <ChainLink 
                isFilled={index < filledLinks} 
                isFirst={index === 0}
                isLast={index === 11}
              />
            </div>
          ))}
        </div>
        
        <p className="text-sm text-center text-gray-600 font-semibold">{raised.toLocaleString()} USDC Raised</p>
      </div>
    </div>
  );
};

export default ImpactChainCard;