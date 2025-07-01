// frontend/src/components/ImpactChainCard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import ChainLink from "./ChainLink";

const ImpactChainCard = ({ chain }) => {
    const [imageError, setImageError] = useState(false);
    const percentage = Math.min((chain.raised / chain.goal) * 100, 100);
    const filledLinks = Math.floor((percentage / 100) * 12);

    // Fallback image when IPFS gateway fails
    const fallbackImage = "https://placehold.co/600x400/16a34a/ffffff?text=Campaign+Image";

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <Link to={`/campaigns/${chain.contractAddress || chain.id}`} className="block">
            <div className="bg-white rounded-lg overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <img
                    src={imageError 
                        ? fallbackImage 
                        : (chain.imageUrl && chain.imageUrl.includes(",") 
                            ? chain.imageUrl.split(",")[0] 
                            : chain.imageUrl || fallbackImage)}
                    alt={chain.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                />
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

                    <p className="text-sm text-center text-gray-600 font-semibold">{chain.raised.toLocaleString()} USDC Raised</p>
                </div>
            </div>
        </Link>
    );
};

export default ImpactChainCard;