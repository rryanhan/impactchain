// frontend/src/pages/CampaignDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import ImpactChainABI from '../abi/ImpactChain.json';
import ImpactProofUpload from '../components/ImpactProofUpload';
import ImpactProofDisplay from '../components/ImpactProofDisplay';

const CampaignDetailPage = () => {
    const { contractAddress } = useParams();
    const { address: userAddress, isConnected } = useAccount();
    const [campaign, setCampaign] = useState(null);
    const [isCreator, setIsCreator] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for forcing re-renders
    const [imageError, setImageError] = useState(false);

    // Fallback image when IPFS gateway fails
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
                allowDeletion: campaignDetails[8], // NEW: Deletion toggle
                creator: creatorAddress,
                contractAddress: contractAddress
            };

            setCampaign(campaignData);
            setIsCreator(userAddress && creatorAddress.toLowerCase() === userAddress.toLowerCase());
            setLoading(false);
        }
    }, [campaignDetails, creatorAddress, userAddress, contractAddress]);

    // Function to refresh impact proofs
    const handleProofAdded = () => {
        setRefreshKey(prev => prev + 1); // Force re-render of ImpactProofDisplay
    };

    // Function to handle proof deletion
    const handleProofDeleted = () => {
        setRefreshKey(prev => prev + 1); // Force re-render of ImpactProofDisplay
    };

    const handleImageError = () => {
        setImageError(true);
    };

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

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Campaign Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
                    <div className="flex items-center space-x-2">
                        {isCreator && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Campaign Creator
                            </span>
                        )}
                        {campaign.allowDeletion && (
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                                Deletion Enabled
                            </span>
                        )}
                    </div>
                </div>

                {/* Campaign Image */}
                {campaign.imageUrl && (
                    <img
                        src={imageError ? fallbackImage : campaign.imageUrl}
                        alt={campaign.title}
                        className="w-full h-64 object-cover rounded-lg mb-6"
                        onError={handleImageError}
                        crossOrigin="anonymous"
                    />
                )}

                {/* Campaign Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Campaign Details</h3>
                        <p className="text-gray-700 mb-4">{campaign.description}</p>
                        <p className="text-sm text-gray-500">
                            Created by: {campaign.creatorName}
                        </p>
                        <p className="text-sm text-gray-500">
                            Created: {new Date(parseInt(campaign.creationDate) * 1000).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                            Impact Proof Deletion: {campaign.allowDeletion ? 'Enabled' : 'Disabled'}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-2">Funding Progress</h3>
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
                </div>
            </div>

            {/* Impact Proofs Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Impact Proofs</h2>

                {/* Upload Section for Creator */}
                {isCreator && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">Add Impact Proof</h3>
                        <ImpactProofUpload
                            contractAddress={contractAddress}
                            onProofAdded={handleProofAdded}
                        />
                    </div>
                )}

                {/* Display Impact Proofs */}
                <ImpactProofDisplay
                    key={refreshKey} // Force re-render when refreshKey changes
                    contractAddress={contractAddress}
                    onProofDeleted={handleProofDeleted}
                />
            </div>
        </div>
    );
};

export default CampaignDetailPage;