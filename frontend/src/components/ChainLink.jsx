const ChainLink = ({ isFilled, isFirst, isLast }) => {
  const colorClass = isFilled ? 'text-green-500' : 'text-gray-200';


  return (
    <svg className={`w-full h-4 ${colorClass}`} viewBox="0 0 28 14" xmlns="http://www.w3.org/2000/svg">
      {/* The connecting line, drawn conditionally based on position */}
      <line 
        x1={isFirst ? 14 : 0}  // Starts from center if it's the first link
        y1="7" 
        x2={isLast ? 14 : 28} // Ends at center if it's the last link
        y2="7" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      {/* The rectangle box, drawn ON TOP of the line to hide the part behind it */}
      <rect 
        x="4" y="1" width="20" height="12" rx="4" 
        stroke="currentColor" strokeWidth="2" 
        className={'fill-white'}
      />
    </svg>
  );
};

export default ChainLink;