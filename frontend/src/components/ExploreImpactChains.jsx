import ImpactChainCard from "./ImpactChainCard";
import { useState } from "react";
import {initialImpactChainsData} from "../ImpactData.js"; // Assuming you have a JSON file with initial data

const ExploreImpactChains = () => {
  const [chains, setChains] = useState(initialImpactChainsData);

  return (
    <section className="py-16 bg-gray-50">
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Explore ImpactChains</h2>
        <div className="hidden md:flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input type="text" placeholder="Search by keyword" className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <a href="#" className="text-primary font-semibold hover:underline">Show more</a>
        </div>
      </div>
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {chains.map(chain => (
          <ImpactChainCard key={chain.id} chain={chain} />
        ))}
      </div>
    </section>
  );
};

export default ExploreImpactChains;