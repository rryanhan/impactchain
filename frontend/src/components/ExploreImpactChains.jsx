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

const ExploreImpactChains = () => {
  const { address, isConnected } = useAccount();

  // 1. Read all deployed ImpactChain addresses from the Factory
  // OLD: const { data: deployedChainAddresses, isLoading: isLoadingFactory, error: factoryError } = useContractRead({
  const { data: deployedChainAddresses, isLoading: isLoadingFactory, error: factoryError } = useReadContract({
    address: IMPACT_CHAIN_FACTORY_ADDRESS,
    abi: impactChainFactoryAbi,
    functionName: 'getAllImpactChains',
    // Wagmi v2 hooks typically include 'query: { refetchInterval: ... }' for watching
    // If you need refetching, check wagmi docs for useReadContract's equivalent
    // For a simple list, default behavior usually refetches on block.
  });

    console.log("isLoadingFactory:", isLoadingFactory);
  console.log("factoryError:", factoryError);
  console.log("Raw deployedChainAddresses:", deployedChainAddresses);
  console.log("Type of deployedChainAddresses:", typeof deployedChainAddresses);
  if (deployedChainAddresses) {
      console.log("Length of deployedChainAddresses:", deployedChainAddresses.length);
  }

  const [donoChains, setDonoChains] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchDonoChainDetails = async () => {
      if (!deployedChainAddresses || deployedChainAddresses.length === 0) {
        setDonoChains([]);
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
        setDonoChains(fetchedChains);

      } catch (err) {
        console.error("Error fetching DonoChain details in catch block:", err); // MODIFY THIS LOG
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (deployedChainAddresses !== undefined && publicClient) {
        fetchDonoChainDetails();
    }
  }, [deployedChainAddresses, publicClient]);

  if (isLoadingFactory || isLoadingDetails) {
    return (
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-3xl font-bold mb-8">Exploring DonoChains...</h2>
        <p className="text-gray-600">Loading decentralized campaigns. This may take a moment.</p>
        {/* Add a spinner or loading animation here */}
      </section>
    );
  }

  if (factoryError) {
    return (
      <section className="py-16 bg-gray-50 text-center text-red-600">
        <h2 className="text-3xl font-bold mb-8">Error Loading DonoChains</h2>
        <p>There was an error connecting to the blockchain or fetching campaign data: {factoryError.message}</p>
        <p>Please ensure your wallet is connected to the Polygon Amoy Testnet.</p>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Explore DonoChains</h2>
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
      {donoChains.length === 0 && (
        <p className="text-center text-gray-600">No DonoChains found. Try creating one!</p>
      )}
      
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {donoChains.map(chain => (
          <ImpactChainCard key={chain.contractAddress} chain={chain} />
        ))}
      </div>
    </section>
  );
};

export default ExploreImpactChains;