// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ImpactChain.sol";

/**
 * @title ImpactChainFactory
 * @notice A factory contract to create and track all ImpactChain campaigns.
 * This acts as a central registry for the entire platform.
 */
contract ImpactChainFactory {

    // --- State Variables ---

    // Array of all deployed ImpactChain contract addresses
    ImpactChain[] public deployedImpactChains;

    // --- Events ---

    event ImpactChainCreated(
        address indexed contractAddress,
        address indexed creator,
        string creatorName,
        address indexed charityWallet,
        uint256 goalAmount,
        string title,
        uint256 creationDate, // ADDED
        bool allowDeletion // NEW
    );

    // --- Functions ---

    /**
     * @notice Deploys a new ImpactChain contract and stores its address.
     * @param _creatorName The human-readable name of the campaign creator.
     * @param _charityWallet The address where collected funds will be sent.
     * @param _tokenAddress The address of the ERC20 token to be used for donations.
     * @param _goalAmount The funding goal for the campaign.
     * @param _title The title of the campaign.
     * @param _description A description of the campaign.
     * @param _imageUrl A URL for the campaign's main image.
     * @param _allowDeletion Whether to allow deletion of impact proofs for this campaign.
     */
    function createImpactChain(
        string memory _creatorName,
        address _charityWallet,
        address _tokenAddress,
        uint256 _goalAmount,
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        bool _allowDeletion // NEW: Toggle for deletion feature
    ) public returns (address) {
        // Create new ImpactChain contract
        ImpactChain newImpactChain = new ImpactChain(
            msg.sender, // creator
            _creatorName,
            _charityWallet,
            _tokenAddress,
            _goalAmount,
            _title,
            _description,
            _imageUrl,
            _allowDeletion // NEW: Pass deletion toggle
        );

        // Store the address
        deployedImpactChains.push(newImpactChain);

        // Emit event
        emit ImpactChainCreated(
            address(newImpactChain),
            msg.sender,
            _creatorName,
            _charityWallet,
            _goalAmount,
            _title,
            block.timestamp, // creationDate
            _allowDeletion // NEW
        );

        return address(newImpactChain);
    }

    /**
     * @notice Returns all deployed ImpactChain contract addresses.
     * @return An array of all deployed ImpactChain contract addresses.
     */
    function getAllImpactChains() public view returns (ImpactChain[] memory) {
        return deployedImpactChains;
    }

    /**
     * @notice Returns the number of deployed ImpactChain contracts.
     * @return The number of deployed ImpactChain contracts.
     */
    function getImpactChainCount() public view returns (uint256) {
        return deployedImpactChains.length;
    }
}