import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { formatUnits } from 'ethers';
import { Link } from 'react-router-dom';
import ImpactChainABI from '../abi/ImpactChain.json';
import ImpactChainFactoryABI from '../abi/ImpactChainFactory.json';
import ImpactChainCard from '../components/ImpactChainCard';

const ProfilePage = () => {
    const { address: userAddress, isConnected } = useAccount();
    const [userCampaigns, setUserCampaigns] = useState([]);
    const [userDonations, setUserDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('campaigns');
    const publicClient = usePublicClient();

    // Get all deployed campaigns from factory
    const { data: allCampaigns } = useReadContract({
        address: "0x343C8076d1A188F0Bb86b5DA795FB367681c3710", // FACTORY_ADDRESS
        abi: ImpactChainFactoryABI.abi,
        functionName: 'getAllImpactChains',
    });

    useEffect(() => {
        if (userAddress && allCampaigns && publicClient) {
            loadUserData();
        }
    }, [userAddress, allCampaigns, publicClient]);

    const loadUserData = async () => {
        if (!userAddress || !allCampaigns || !publicClient) return;

        setLoading(true);
        try {
            // Load all campaign details
            const campaignDetails = await Promise.all(
                allCampaigns.map(async (campaignAddress) => {
                    try {
                        const details = await publicClient.readContract({
                            address: campaignAddress,
                            abi: ImpactChainABI.abi,
                            functionName: 'getCampaignDetails',
                        });

                        return {
                            address: campaignAddress,
                            title: details[0],
                            description: details[1],
                            imageUrl: details[2],
                            goalAmount: details[3],
                            raisedAmount: details[4],
                            charityWallet: details[5],
                            creatorName: details[6],
                            creationDate: details[7],
                            allowDeletion: details[8],
                        };
                    } catch (error) {
                        console.error(`Error loading campaign ${campaignAddress}:`, error);
                        return null;
                    }
                })
            );

            // Filter campaigns created by user
            const createdCampaigns = campaignDetails
                .filter(campaign => campaign && campaign.charityWallet.toLowerCase() === userAddress.toLowerCase())
                .map(campaign => ({
                    id: campaign.address,
                    contractAddress: campaign.address,
                    title: campaign.title,
                    description: campaign.description,
                    imageUrl: campaign.imageUrl,
                    goal: Number(formatUnits(campaign.goalAmount, 18)),
                    raised: Number(formatUnits(campaign.raisedAmount, 18)),
                    charityWallet: campaign.charityWallet,
                    creatorName: campaign.creatorName,
                    creationDate: Number(campaign.creationDate),
                    type: 'created',
                }));

            // For now, we'll show all other campaigns as potential donations
            // In a real implementation, you'd query the blockchain for actual donation events
            const otherCampaigns = campaignDetails
                .filter(campaign => campaign && campaign.charityWallet.toLowerCase() !== userAddress.toLowerCase())
                .map(campaign => ({
                    id: campaign.address,
                    contractAddress: campaign.address,
                    title: campaign.title,
                    description: campaign.description,
                    imageUrl: campaign.imageUrl,
                    goal: Number(formatUnits(campaign.goalAmount, 18)),
                    raised: Number(formatUnits(campaign.raisedAmount, 18)),
                    charityWallet: campaign.charityWallet,
                    creatorName: campaign.creatorName,
                    creationDate: Number(campaign.creationDate),
                    type: 'potential_donation', // We don't know if they actually donated
                }));

            setUserCampaigns([...createdCampaigns, ...otherCampaigns]);
            setUserDonations(otherCampaigns);
            setLoading(false);
        } catch (error) {
            console.error('Error loading user data:', error);
            setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
                    <p className="text-gray-600 mb-6">Please connect your wallet to view your profile.</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">Connect your wallet to see your campaigns and transaction history.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    const createdCampaigns = userCampaigns.filter(c => c.type === 'created');
    const otherCampaigns = userCampaigns.filter(c => c.type === 'potential_donation');

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
                        <p className="text-gray-600">Wallet: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</p>
                        <div className="flex space-x-4 mt-2 text-sm">
                            <span className="text-gray-600">
                                <strong>{createdCampaigns.length}</strong> Campaigns Created
                            </span>
                            <span className="text-gray-600">
                                <strong>{otherCampaigns.length}</strong> Other Campaigns Available
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveTab('campaigns')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'campaigns'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            All Campaigns ({userCampaigns.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('created')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'created'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Created ({createdCampaigns.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'available'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Available ({otherCampaigns.length})
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'campaigns' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">All Campaigns</h2>
                            {userCampaigns.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No campaigns found.</p>
                                    <Link
                                        to="/create"
                                        className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Create Your First Campaign
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {userCampaigns.map(chain => (
                                        <ImpactChainCard key={chain.contractAddress} chain={chain} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'created' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Campaigns I Created</h2>
                            {createdCampaigns.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">You haven't created any campaigns yet.</p>
                                    <Link
                                        to="/create"
                                        className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Create Your First Campaign
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {createdCampaigns.map(chain => (
                                        <ImpactChainCard key={chain.contractAddress} chain={chain} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'available' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Available Campaigns</h2>
                            <p className="text-gray-600 mb-4">These are campaigns you can support. Note: This shows all campaigns you haven't created.</p>
                            {otherCampaigns.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No other campaigns available.</p>
                                    <Link
                                        to="/explore"
                                        className="inline-block bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        Explore Campaigns
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {otherCampaigns.map(chain => (
                                        <ImpactChainCard key={chain.contractAddress} chain={chain} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction History Placeholder */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Transaction history feature coming soon!</p>
                    <p className="text-sm text-gray-400">
                        This will show your donation transactions, campaign creation events, and other blockchain activities.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage; 