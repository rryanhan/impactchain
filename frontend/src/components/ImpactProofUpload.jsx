import React, { useState } from 'react';
import { useAccount, useWriteContract, useSimulateContract } from 'wagmi';
import { Button } from '@material-tailwind/react';
import ImpactChainABI from '../abi/ImpactChain.json';
import { pinataUpload } from '../pinataUpload';

const ImpactProofUpload = ({ contractAddress, onProofAdded }) => {
    const { address: userAddress, isConnected } = useAccount();
    const [files, setFiles] = useState([]);
    const [description, setDescription] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [proofHash, setProofHash] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        setError(''); // Clear previous errors
    };

    // Simulate contract write for adding impact proof
    const { data: simulationData } = useSimulateContract({
        address: contractAddress,
        abi: ImpactChainABI.abi,
        functionName: 'addImpactProof',
        args: proofHash ? [proofHash] : undefined,
        query: {
            enabled: !!proofHash,
        },
    });

    const { writeContract, isPending: isAddingProof } = useWriteContract();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        if (!isConnected) {
            setError('Please connect your wallet first');
            return;
        }

        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        if (!description.trim()) {
            setError('Please add a description');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            // Upload files to IPFS
            const uploadPromises = files.map(async (file, index) => {
                try {
                    const url = await pinataUpload(file);
                    setUploadProgress(((index + 1) / files.length) * 50); // First 50% for file uploads
                    return url;
                } catch (uploadError) {
                    console.error('Error uploading file to Pinata:', uploadError);
                    throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
                }
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            setUploadProgress(50);

            // Create a proof document with all file URLs and description
            const proofDocument = {
                description: description,
                files: uploadedUrls,
                timestamp: Date.now(),
                creator: userAddress
            };

            // Convert to JSON and create hash
            const proofJson = JSON.stringify(proofDocument);
            const hash = btoa(proofJson); // Simple base64 encoding for demo
            setProofHash(hash);

            setUploadProgress(75);

            // Submit to blockchain using wagmi with retry logic
            try {
                writeContract({
                    address: contractAddress,
                    abi: ImpactChainABI.abi,
                    functionName: 'addImpactProof',
                    args: [hash]
                });

                setUploadProgress(100);

                // Reset form
                setFiles([]);
                setDescription('');
                setProofHash('');

                // Notify parent component
                if (onProofAdded) {
                    onProofAdded();
                }

                alert('Impact proof uploaded successfully!');

            } catch (contractError) {
                console.error('Contract write error:', contractError);

                // Check if it's an RPC error
                if (contractError.message && contractError.message.includes('JSON-RPC')) {
                    setError('Network error: Please check your MetaMask connection to Polygon Amoy testnet. Try switching networks and reconnecting.');
                } else {
                    setError(`Blockchain error: ${contractError.message}`);
                }

                // Keep the form data so user can retry
                setUploadProgress(75);
            }

        } catch (error) {
            console.error('Error uploading impact proof:', error);
            setError(`Upload error: ${error.message}`);
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-red-800 text-sm">{error}</p>
                        {error.includes('Network error') && (
                            <div className="mt-2 text-xs text-red-600">
                                <p><strong>Quick Fix:</strong></p>
                                <ul className="list-disc list-inside mt-1">
                                    <li>Check MetaMask is connected to Polygon Amoy testnet</li>
                                    <li>Try switching networks and reconnecting</li>
                                    <li>Make sure you have some MATIC for gas fees</li>
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Proof Documents
                    </label>
                    <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        disabled={uploading || isAddingProof}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Supported formats: Images, PDF, Word documents
                    </p>
                    {files.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-medium">Selected files:</p>
                            <ul className="text-sm text-gray-600">
                                {files.map((file, index) => (
                                    <li key={index}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Impact Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the impact achieved, how the funds were used, and what results were obtained..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        rows={4}
                        disabled={uploading || isAddingProof}
                    />
                </div>

                {/* Upload Progress */}
                {(uploading || isAddingProof) && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{isAddingProof ? 'Adding to blockchain...' : 'Uploading...'}</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    disabled={uploading || isAddingProof || !isConnected}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {uploading || isAddingProof ? 'Processing...' : 'Upload Impact Proof'}
                </Button>

                {!isConnected && (
                    <p className="text-sm text-red-600 text-center">
                        Please connect your wallet to upload impact proofs
                    </p>
                )}
            </form>
        </div>
    );
};

export default ImpactProofUpload; 