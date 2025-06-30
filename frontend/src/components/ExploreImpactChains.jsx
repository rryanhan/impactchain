// frontend/src/pages/ExploreImpactChains.js

import React, { useState, useEffect } from "react";
import ImpactChainCard from "../components/ImpactChainCard"; // Assuming this path
// import { useAccount, useContractRead, usePublicClient } from 'wagmi'; // OLD IMPORT
import { useAccount, usePublicClient } from 'wagmi'; // Keep useAccount and usePublicClient
import { useReadContract } from 'wagmi'; // NEW: Import useReadContract from wagmi/codegen for type safety
                                              // (or 'wagmi' if you prefer without codegen for quick dev)

import { abi as impactChainFactoryAbi } from '../abi/ImpactChainFactory.json';
import { abi as impactChainAbi } from '../abi/ImpactChain.json';

import { formatUnits } from 'ethers'; // For formatting big numbers

// --- CONFIGURATION ---
// Get your deployed ImpactChainFactory address
const IMPACT_CHAIN_FACTORY_ADDRESS = "0x343C8076d1A188F0Bb86b5DA795FB367681c3710"; // <--- REPLACE WITH YOUR FACTORY ADDRESS
// --------------------

const HIDDEN_CHAIN_ADDRESSES = [
  "0xfa949769650777Eb7c30250df1f504C992D3534c",
  "0xb3a19a0235A9A509CEC41E23F4b8F07d259875ce",
  "0x95B2796365987d8FbbDc85E49f22dD74A1B5E08C",
  "0x72538A04B871C4A46F2d43957A03d71Ce8bb14C2",
  "0xfa7F05B11f1Dd5C1048735697e9D7037eDb66b0A",
  "0x938688c30FC340b7090fa98f2B684790e8fB908a",
  "0x2C40FAcAB765F144f77e4db3654F944e24b72da6",
  "0x27d4B2d41920CffD362c7e5DbA3b8a5f1e515Dcc",
  "0x2c0588552Ca50652C092DD0e4b07eDBB1Acc819c",
  "0xA6625aD90A66759cB02ce958d397A0CC1b889730",
];


const ExploreImpactChains = () => {
  const { address, isConnected } = useAccount();

  // 1. Read all deployed ImpactChain addresses from the Factory

  const { data: deployedChainAddresses, isLoading: isLoadingFactory, error: factoryError } = useReadContract({
    address: IMPACT_CHAIN_FACTORY_ADDRESS,
    abi: impactChainFactoryAbi,
    functionName: 'getAllImpactChains',
  });

    console.log("isLoadingFactory:", isLoadingFactory);
  console.log("factoryError:", factoryError);
  console.log("Raw deployedChainAddresses:", deployedChainAddresses);
  console.log("Type of deployedChainAddresses:", typeof deployedChainAddresses);
  if (deployedChainAddresses) {
      console.log("Length of deployedChainAddresses:", deployedChainAddresses.length);
  }

  const [impactChains, setimpactChains] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const publicClient = usePublicClient();

  const visibleChains = impactChains.filter(
  chain => !HIDDEN_CHAIN_ADDRESSES.map(addr => addr.toLowerCase()).includes(chain.contractAddress.toLowerCase())
);

  useEffect(() => {
    const fetchimpactChainDetails = async () => {
      if (!deployedChainAddresses || deployedChainAddresses.length === 0) {
        setimpactChains([]);
        setIsLoadingDetails(false);
        return;
      }

      setIsLoadingDetails(true);
      const readContracts = [];

      for (const chainAddress of deployedChainAddresses) {
        readContracts.push({
          address: chainAddress,
          abi: impactChainAbi,
          functionName: 'getCampaignDetails',
          // args: [] // getCampaignDetails takes no arguments
        });
      }

      try {
        console.log("Preparing multicall with contracts:", readContracts); // ADD THIS LOG
        const results = await publicClient.multicall({
          contracts: readContracts,
          allowFailure: true,
        });
        console.log("Multicall raw results:", results); // ADD THIS LOG

        const fetchedChains = [];
        results.forEach((result, index) => {
            console.log(`Processing result for chain ${deployedChainAddresses[index]}:`, result); // ADD THIS LOG
            if (result.status === 'success' && result.result) {
                const details = result.result;
                console.log("Details from getCampaignDetails:", details); // ADD THIS LOG

                // Make sure 'details' is an array of the expected length
                if (details && Array.isArray(details) && details.length === 8) { // Check length explicitly
                    const [
                        title,
                        description,
                        imageUrl,
                        goalAmount,
                        raisedAmount,
                        charityWallet,
                        creatorName,
                        creationDate
                    ] = details;

                    fetchedChains.push({
                        id: deployedChainAddresses[index],
                        contractAddress: deployedChainAddresses[index],
                        title: title,
                        description: description,
                        imageUrl: imageUrl,
                        goal: Number(formatUnits(goalAmount, 18)),
                        raised: Number(formatUnits(raisedAmount, 18)),
                        charityWallet: charityWallet,
                        creatorName: creatorName,
                        creationDate: Number(creationDate)
                    });
                } else {
                    console.warn(`Unexpected details format for chain ${deployedChainAddresses[index]}:`, details); // ADD THIS LOG
                }
            } else {
                console.warn(`Failed to fetch details for chain at address ${deployedChainAddresses[index]}:`, result.error || "No result data"); // MODIFY THIS LOG
            }
        });
        console.log("Final fetchedChains array:", fetchedChains); // ADD THIS LOG
        setimpactChains(fetchedChains);

      } catch (err) {
        console.error("Error fetching impactChain details in catch block:", err); // MODIFY THIS LOG
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (deployedChainAddresses !== undefined && publicClient) {
        fetchimpactChainDetails();
    }
  }, [deployedChainAddresses, publicClient]);

  if (isLoadingFactory || isLoadingDetails) {
    return (
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-8">Exploring impactChains...</h2>
        <p className="text-gray-600">Loading decentralized campaigns. This may take a moment.</p>
        {/* Add a spinner or loading animation here */}
      </section>
    );
  }

  if (factoryError) {
    return (
      <section className="py-16 bg-gray-50 text-center text-red-600">
        <h2 className="text-3xl font-bold mb-8">Error Loading impactChains</h2>
        <p>There was an error connecting to the blockchain or fetching campaign data: {factoryError.message}</p>
        <p>Please ensure your wallet is connected to the Polygon Amoy Testnet.</p>
      </section>
    );
  }

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

      {/* Message if no campaigns */}
      {impactChains.length === 0 && (
        <p className="text-center text-gray-600">No impactChains found. Try creating one!</p>
      )}
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleChains.map(chain => (
        <ImpactChainCard key={chain.contractAddress} chain={chain} />
        ))}
      </div>
    </section>
  );
};

export default ExploreImpactChains;