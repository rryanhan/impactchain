import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'ethers';
import ImpactChainABI from '../abi/ImpactChain.json';
import DonationForm from '../components/DonationForm';
import DonationChain from '../components/DonationChain';
import ImpactProofUpload from '../components/ImpactProofUpload';
import ImpactProofDisplay from '../components/ImpactProofDisplay';

const CampaignDetailPage = () => {
    const { contractAddress } = useParams();
    const { address: userAddress, isConnected } = useAccount();
    const [campaign, setCampaign] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [imageError, setImageError] = useState(false);

    const fallbackImage = "https://placehold.co/800x400/16a34a/ffffff?text=Campaign+Image";

    // Read campaign details using wagmi
    const { data: campaignDetails, isLoading: isLoadingDetails } = useReadContract({
        address: contractAddress,
        abi: ImpactChainABI.abi,
        functionName: 'getCampaignDetails',
    });

    // Read creator address using wagmi
    const { data: creatorAddress, isLoading: isLoadingCreator } = useReadContract({
        address: contractAddress,
        abi: ImpactChainABI.abi,
        functionName: 'creator',
    });

    useEffect(() => {
        if (campaignDetails && creatorAddress) {
            const campaignData = {
                title: campaignDetails[0],
                description: campaignDetails[1],
                imageUrl: campaignDetails[2],
                goalAmount: campaignDetails[3].toString(),
                raisedAmount: campaignDetails[4].toString(),
                charityWallet: campaignDetails[5],
                creatorName: campaignDetails[6],
                creationDate: campaignDetails[7].toString(),
                allowDeletion: campaignDetails[8],
                creator: creatorAddress,
                contractAddress: contractAddress
            };

            setCampaign(campaignData);
            setIsCreator(userAddress && creatorAddress.toLowerCase() === userAddress.toLowerCase());
            setLoading(false);
        }
    }, [campaignDetails, creatorAddress, userAddress, contractAddress]);

    const handleProofAdded = () => setRefreshKey(prev => prev + 1);
    const handleProofDeleted = () => setRefreshKey(prev => prev + 1);
    const handleImageError = () => setImageError(true);

    if (isLoadingDetails || isLoadingCreator || loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl">Loading campaign details...</div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl text-red-500">Campaign not found</div>
            </div>
        );
    }

    // Format numbers for display
    const formattedGoal = Number(formatUnits(campaign.goalAmount, 18));
    const formattedRaised = Number(formatUnits(campaign.raisedAmount, 18));
    const progressPercentage = Math.min((formattedRaised / formattedGoal) * 100, 100);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-4">{campaign.title}</h1>
                <p className="text-gray-600 mb-6">
                    Created by {campaign.creatorName} on {new Date(Number(campaign.creationDate) * 1000).toLocaleDateString()}
                </p>
            </div>
            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row gap-8 mb-10">
                {/* LEFT PANEL */}
                <div className="flex-1 lg:w-3/5">
                    {/* Campaign Image */}
                    <img
                        src={imageError ? fallbackImage : campaign.imageUrl}
                        alt={campaign.title}
                        className="w-full h-80 object-cover rounded-lg mb-8 shadow-md"
                        onError={handleImageError}
                        crossOrigin="anonymous"
                    />
                    {/* Campaign Description */}
                    <p className="text-gray-700 leading-relaxed mb-10">{campaign.description}</p>
                    
                </div>
                {/* RIGHT PANEL */}
                <div className="flex-1 lg:w-2/5 flex flex-col gap-8">
                    {/* Funding Progress */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Goal:</span>
                                <span className="font-semibold">{parseInt(campaign.goalAmount) / 1e18} USDC</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Raised:</span>
                                <span className="font-semibold text-green-600">
                                    {parseInt(campaign.raisedAmount) / 1e18} USDC
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{
                                        width: `${Math.min((parseInt(campaign.raisedAmount) / parseInt(campaign.goalAmount)) * 100, 100)}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    {/* Donation Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Support This ImpactChain</h2>
                        <DonationForm contractAddress={contractAddress} disabled={!isConnected} />
                    </div>
                    {/* Live DonoChain Activity */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold mb-4">Live ImpactChain Activity</h2>
                        <DonationChain contractAddress={contractAddress} />
                    </div>
                </div>
                
            </div>
            {/* Impact Proofs Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-6">Impact Proofs</h2>
                        {isCreator && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold mb-4">Add Impact Proof</h3>
                                <ImpactProofUpload
                                    contractAddress={contractAddress}
                                    onProofAdded={handleProofAdded}
                                />
                            </div>
                        )}
                        <ImpactProofDisplay
                            key={refreshKey}
                            contractAddress={contractAddress}
                            onProofDeleted={handleProofDeleted}
                        />
                    </div>
        </div>
    );
};

export default CampaignDetailPage;