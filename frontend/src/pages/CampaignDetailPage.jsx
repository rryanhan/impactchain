// frontend/src/pages/CampaignDetailPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import { useReadContract, useAccount } from 'wagmi';
import { formatUnits } from 'ethers';
import { abi as impactChainAbi } from '../abi/ImpactChain.json';
import DonationForm from '../components/DonationForm';

const CampaignDetailPage = () => {
  const { contractAddress } = useParams();
  const { isConnected } = useAccount();

  const { data: campaignDetails, isLoading, error } = useReadContract({
    address: contractAddress,
    abi: impactChainAbi,
    functionName: 'getCampaignDetails',
    enabled: !!contractAddress,
  });

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Loading ImpactChain details...</p>
        {/* Add spinner */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-600">
        <p>Error loading ImpactChain: {error.message}</p>
        <p>Please ensure the address in the URL is correct and your wallet is connected to Polygon Amoy Testnet.</p>
      </div>
    );
  }

  if (!campaignDetails) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">No ImpactChain found at this address.</p>
      </div>
    );
  }

  const [
    title,
    description,
    imageUrl,
    goalAmount,
    raisedAmount,
    charityWallet,
    creatorName,
    creationDate
  ] = campaignDetails;

  const formattedGoal = Number(formatUnits(goalAmount, 18));
  const formattedRaised = Number(formatUnits(raisedAmount, 18));
  const progressPercentage = Math.min((formattedRaised / formattedGoal) * 100, 100);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Main Two-Column Layout for Top Section */}
      <div>
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-gray-600 mb-6">Created by {creatorName} on {new Date(Number(creationDate) * 1000).toLocaleDateString()}</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 mb-10"> {/* flex-col on small screens, flex-row on large */}
        

        {/* LEFT PANEL (60% width on large screens) */}
        <div className="flex-1 lg:w-3/5"> {/* flex-1 ensures it takes available space, lg:w-3/5 sets 60% on large */}
          {/* SECTION B: Hero Section - ImpactChain Overview */}
          
          <img src={imageUrl} alt={title} className="w-full h-80 object-cover rounded-lg mb-8 shadow-md"/>
          <p className="text-gray-700 leading-relaxed mb-10">{description}</p>
        </div>

        {/* RIGHT PANEL (40% width on large screens) */}
        <div className="flex-1 lg:w-2/5 flex flex-col gap-8"> {/* flex-1 ensures it takes available space, lg:w-2/5 sets 40% on large, flex-col for stacking inner sections */}
          
          {/* SECTION C: Financial Transparency Dashboard */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Funding Progress</h2>
            <p className="text-gray-600 mb-4">Raised: <span className="font-bold text-green-600">{formattedRaised.toLocaleString()} USDC</span> / Goal: {formattedGoal.toLocaleString()} USDC</p>
            <div className="relative w-32 h-32 mx-auto mb-4"> {/* Centered for better visual */}
              <div className="w-full h-full rounded-full bg-gray-200 absolute"></div>
              <div className="w-full h-full rounded-full absolute"
                   style={{
                     background: `conic-gradient(#16a34a ${progressPercentage}%, #e5e7eb ${progressPercentage}%)`
                   }}></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800">
                {progressPercentage.toFixed(0)}%
              </div>
            </div>
          </div>
          
          {/* SECTION D: Make a Donation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Support This ImpactChain</h2>
            <DonationForm contractAddress={contractAddress} disabled={!isConnected} />
          </div>

          {/* SECTION E: Live DonoChain Activity */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Live DonoChain Activity</h2>
            <p className="text-gray-600">Recent transactions will appear here.</p>
            {/* Placeholder for live feed of transactions */}
          </div>
        </div>
      </div>

      {/* SECTION F: Verified Impact Reports Dashboard (Full width, below the two-column layout) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Verified Impact Reports</h2>
        <p className="text-gray-600">Impact reports will be displayed here.</p>
        {/* Placeholder for impact report cards */}
      </div>
    </div>
  );
};

export default CampaignDetailPage;