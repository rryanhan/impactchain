import React, { useState, useEffect, useRef } from 'react';
import { useReadContract, usePublicClient, useWriteContract } from 'wagmi';
import { Button } from '@material-tailwind/react';
import ImpactChainABI from '../abi/ImpactChain.json';

const ImpactProofDisplay = ({ contractAddress, onProofDeleted }) => {
    const [proofs, setProofs] = useState([]);
    const [allProofs, setAllProofs] = useState([]); // Store all proofs including hidden ones
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');
    const [allowDeletion, setAllowDeletion] = useState(false);
    const [deletingProof, setDeletingProof] = useState(null);
    const [showHidden, setShowHidden] = useState(false);
    const [hiddenProofs, setHiddenProofs] = useState(new Set()); // Track locally hidden proofs
    const hasLoadedRef = useRef(false); // Use ref to prevent multiple loads
    const publicClient = usePublicClient();

    // Load hidden proofs from localStorage on component mount
    useEffect(() => {
        if (contractAddress) {
            const storageKey = `hiddenProofs_${contractAddress}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const hiddenArray = JSON.parse(stored);
                    console.log('Loaded hidden proofs from localStorage:', hiddenArray);
                    setHiddenProofs(new Set(hiddenArray));
                } catch (error) {
                    console.error('Error loading hidden proofs from localStorage:', error);
                }
            }
        }
    }, [contractAddress]);

    // Save hidden proofs to localStorage whenever they change (but only if not empty)
    useEffect(() => {
        if (contractAddress) {
            const storageKey = `hiddenProofs_${contractAddress}`;

            if (hiddenProofs.size > 0) {
                // Save when we have hidden proofs
                const hiddenArray = Array.from(hiddenProofs);
                console.log('Saving hidden proofs to localStorage:', hiddenArray);
                localStorage.setItem(storageKey, JSON.stringify(hiddenArray));
            } else {
                // Only clear if there's actually something to clear (not just empty state)
                const existing = localStorage.getItem(storageKey);
                if (existing && existing !== '[]') {
                    console.log('Clearing hidden proofs from localStorage');
                    localStorage.removeItem(storageKey);
                }
            }
        }
    }, [hiddenProofs, contractAddress]);

    // Read campaign details to check if deletion is allowed
    const { data: campaignDetails } = useReadContract({
        address: contractAddress,
        abi: ImpactChainABI.abi,
        functionName: 'getCampaignDetails',
    });

    useEffect(() => {
        if (campaignDetails) {
            // For the old contract, we'll allow local hiding by default
            setAllowDeletion(true);
        }
    }, [campaignDetails]);

    useEffect(() => {
        if (contractAddress && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
            loadImpactProofs();
        }
    }, [contractAddress, publicClient]);

    // Filter proofs based on hidden status
    useEffect(() => {
        console.log('Filtering proofs - showHidden:', showHidden, 'hiddenProofs:', Array.from(hiddenProofs));
        console.log('All proofs before filtering:', allProofs.map(p => ({ id: p.id, isHidden: p.isHidden })));

        const filteredProofs = allProofs.filter(proof => {
            const shouldShow = showHidden || !hiddenProofs.has(proof.id);
            console.log(`Proof ${proof.id}: hiddenProofs.has(${proof.id}) = ${hiddenProofs.has(proof.id)}, shouldShow = ${shouldShow}`);
            return shouldShow;
        });

        console.log('Filtered proofs:', filteredProofs.map(p => ({ id: p.id, isHidden: p.isHidden })));
        setProofs(filteredProofs);
    }, [allProofs, hiddenProofs, showHidden]);

    const loadImpactProofs = async () => {
        try {
            console.log('Loading impact proofs for contract:', contractAddress);
            setLoading(true);

            // Try to read impact proofs by checking indices 0, 1, 2, etc.
            // until we get an error (meaning we've reached the end)
            const proofHashes = [];
            let index = 0;
            const maxAttempts = 20; // Prevent infinite loops

            while (index < maxAttempts) {
                try {
                    console.log(`Trying to read proof at index ${index}`);

                    const result = await publicClient.readContract({
                        address: contractAddress,
                        abi: ImpactChainABI.abi,
                        functionName: 'impactProofHashes',
                        args: [index],
                    });

                    if (result && result.length > 0) {
                        console.log(`Found proof at index ${index}:`, result);
                        proofHashes.push({
                            index: index,
                            hash: result
                        });
                        index++;
                    } else {
                        console.log(`No proof found at index ${index}, stopping`);
                        break;
                    }
                } catch (error) {
                    console.log(`Error reading proof at index ${index}, stopping:`, error.message);
                    break;
                }
            }

            console.log('Total proofs found:', proofHashes.length);
            setDebugInfo(`Found ${proofHashes.length} proofs`);

            if (proofHashes.length === 0) {
                setAllProofs([]);
                setLoading(false);
                return;
            }

            // Process the proof hashes
            const decodedProofs = proofHashes
                .map(({ index, hash }) => {
                    console.log(`Processing hash ${index}:`, hash);

                    try {
                        const decodedJson = atob(hash); // Decode base64
                        const proofData = JSON.parse(decodedJson);

                        console.log(`Decoded proof data ${index}:`, proofData);

                        return {
                            id: index,
                            hash: hash,
                            description: proofData.description,
                            files: proofData.files || [],
                            timestamp: proofData.timestamp,
                            creator: proofData.creator,
                            isHidden: false // We'll set this after loading
                        };
                    } catch (error) {
                        console.error('Error decoding proof:', error);
                        return {
                            id: index,
                            hash: hash,
                            description: 'Unable to decode proof data',
                            files: [],
                            timestamp: Date.now(),
                            creator: 'Unknown',
                            isHidden: false // We'll set this after loading
                        };
                    }
                })
                .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

            console.log('Final decoded proofs:', decodedProofs);
            setAllProofs(decodedProofs);
            setLoading(false);
        } catch (error) {
            console.error("Error loading impact proofs:", error);
            setDebugInfo(`Error: ${error.message}`);
            setLoading(false);
        }
    };

    // Apply hidden status to proofs after they're loaded
    useEffect(() => {
        if (allProofs.length > 0) {
            setAllProofs(prev => prev.map(proof => ({
                ...proof,
                isHidden: hiddenProofs.has(proof.id)
            })));
        }
    }, [hiddenProofs, allProofs.length]);

    // Local hiding functionality (not on blockchain)
    const handleHideProof = async (proofIndex) => {
        if (!allowDeletion) {
            alert('Hiding is not allowed for this campaign');
            return;
        }

        if (!confirm('Are you sure you want to hide this impact proof? This will only hide it from view locally.')) {
            return;
        }

        try {
            setDeletingProof(proofIndex);
            console.log('Hiding proof:', proofIndex);

            // Add to locally hidden set
            setHiddenProofs(prev => {
                const newSet = new Set([...prev, proofIndex]);
                console.log('Updated hiddenProofs:', Array.from(newSet));
                return newSet;
            });

            // Update the proof's hidden status in allProofs immediately
            setAllProofs(prev => {
                const updated = prev.map(proof =>
                    proof.id === proofIndex
                        ? { ...proof, isHidden: true }
                        : proof
                );
                console.log('Updated allProofs with hidden status:', updated.map(p => ({ id: p.id, isHidden: p.isHidden })));
                return updated;
            });

            setTimeout(() => {
                setDeletingProof(null);
                if (onProofDeleted) {
                    onProofDeleted();
                }
            }, 500);

        } catch (error) {
            console.error('Error hiding proof:', error);
            alert('Error hiding proof: ' + error.message);
            setDeletingProof(null);
        }
    };

    // Unhide proof
    const handleUnhideProof = (proofIndex) => {
        console.log('Unhiding proof:', proofIndex);

        setHiddenProofs(prev => {
            const newSet = new Set(prev);
            newSet.delete(proofIndex);
            console.log('Updated hiddenProofs after unhide:', Array.from(newSet));
            return newSet;
        });

        setAllProofs(prev => {
            const updated = prev.map(proof =>
                proof.id === proofIndex
                    ? { ...proof, isHidden: false }
                    : proof
            );
            console.log('Updated allProofs after unhide:', updated.map(p => ({ id: p.id, isHidden: p.isHidden })));
            return updated;
        });
    };

    const getFileType = (url) => {
        const extension = url.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'image';
        } else if (extension === 'pdf') {
            return 'pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            return 'document';
        }
        return 'file';
    };

    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image':
                return '🖼️';
            case 'pdf':
                return '📄';
            case 'document':
                return '📝';
            default:
                return '📎';
        }
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-600">Loading impact proofs...</div>
                {debugInfo && (
                    <div className="text-xs text-gray-500 mt-2">
                        Debug: {debugInfo}
                    </div>
                )}
            </div>
        );
    }

    if (allProofs.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="text-gray-500 mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Impact Proofs Yet</h3>
                <p className="text-gray-600">
                    Impact proofs will appear here once the campaign creator uploads them.
                </p>
                {debugInfo && (
                    <div className="text-xs text-gray-500 mt-2">
                        Debug: {debugInfo}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Controls */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={showHidden}
                            onChange={(e) => setShowHidden(e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Show hidden proofs ({hiddenProofs.size} hidden)
                        </span>
                    </label>
                    {/* Test button */}
                    <button
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 border border-red-300 rounded hover:bg-red-200"
                        onClick={() => {
                            console.log('TEST BUTTON CLICKED!');
                            alert('Test button works!');
                        }}
                    >
                        Test Click
                    </button>
                </div>
                <div className="text-xs text-gray-500">
                    {debugInfo} | {proofs.length} visible / {allProofs.length} total
                </div>
            </div>

            {/* Info about local hiding */}
            <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-800">
                    <strong>Note:</strong> Hiding proofs only affects your local view. Proofs remain on the blockchain for transparency.
                </div>
            </div>

            {proofs.map((proof) => {
                console.log('Rendering proof:', proof.id, 'allowDeletion:', allowDeletion, 'isHidden:', proof.isHidden);

                return (
                    <div
                        key={proof.id}
                        className={`bg-white border rounded-lg p-6 ${proof.isHidden
                            ? 'border-orange-200 bg-orange-50 opacity-75'
                            : 'border-gray-200'
                            }`}
                    >
                        {/* Proof Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">
                                    {proof.isHidden ? '👁️‍🗨️' : '📊'}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Impact Proof #{proof.id + 1}
                                    {proof.isHidden && (
                                        <span className="ml-2 text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                            HIDDEN
                                        </span>
                                    )}
                                </h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    {new Date(proof.timestamp).toLocaleDateString()}
                                </span>
                                {allowDeletion && (
                                    proof.isHidden ? (
                                        <button
                                            className="ml-2 px-3 py-1 text-sm bg-green-100 text-green-800 border border-green-300 rounded hover:bg-green-200"
                                            onClick={() => {
                                                console.log('Unhide button clicked for proof:', proof.id);
                                                handleUnhideProof(proof.id);
                                            }}
                                        >
                                            Unhide
                                        </button>
                                    ) : (
                                        <button
                                            className="ml-2 px-3 py-1 text-sm bg-orange-100 text-orange-800 border border-orange-300 rounded hover:bg-orange-200"
                                            onClick={() => {
                                                console.log('Hide button clicked for proof:', proof.id);
                                                handleHideProof(proof.id);
                                            }}
                                            disabled={deletingProof === proof.id}
                                        >
                                            {deletingProof === proof.id ? 'Hiding...' : 'Hide'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <p className="text-gray-700 leading-relaxed">{proof.description}</p>
                        </div>

                        {/* Files */}
                        {proof.files.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Attached Files:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {proof.files.map((fileUrl, fileIndex) => {
                                        const fileType = getFileType(fileUrl);
                                        const fileName = fileUrl.split('/').pop();

                                        return (
                                            <div key={fileIndex} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                                                <span className="text-lg">{getFileIcon(fileType)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {fileName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 capitalize">
                                                        {fileType}
                                                    </p>
                                                </div>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Creator Info */}
                        <div className="text-xs text-gray-500 border-t pt-3">
                            Uploaded by: {proof.creator ? `${proof.creator.slice(0, 6)}...${proof.creator.slice(-4)}` : 'Unknown'}
                            {proof.isHidden && (
                                <span className="ml-4 text-orange-600">
                                    Hidden locally (still on blockchain)
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ImpactProofDisplay; 