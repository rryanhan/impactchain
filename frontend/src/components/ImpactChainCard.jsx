import ChainLink from "./ChainLink";


const ImpactChainCard = ({ chain }) => {
  const percentage = Math.min((chain.raised / chain.goal) * 100, 100);
  const filledLinks = Math.floor((percentage / 100) * 12); // 12 links total

  return (
    <div className="bg-white rounded-lg overflow-hidden group">
      <img src={chain.imageUrl} alt={chain.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"/>
      <div className="p-4">
        <h3 className="text-lg font-bold mb-3 truncate">{chain.title}</h3>
        
        {/* Custom Chain Link Progress Bar */}
        <div className="flex items-center mb-3"> {/* Removed the gap */}
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
  );
};

export default ImpactChainCard;