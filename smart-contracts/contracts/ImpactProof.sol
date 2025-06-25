// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Match your hardhat.config.js Solidity version

import "@openzeppelin/contracts/access/Ownable.sol"; // For restricting who can record impact proofs

contract ImpactProof is Ownable {
    // Struct to hold details of each impact update
    struct ImpactUpdate {
        uint256 campaignId;      // ID linking to a specific DonoChain
        string impactHash;       // Cryptographic hash of the off-chain report
        uint256 reportedCost;    // Cost reported in the off-chain proof
        string description;      // Short description of the impact
        uint256 timestamp;       // Timestamp when the proof was recorded on-chain
    }

    // Mapping from campaign ID to an array of its impact updates
    mapping(uint256 => ImpactUpdate[]) public campaignImpactUpdates;

    // Event to log when an impact proof is recorded
    event ImpactProofRecorded(
        uint256 indexed campaignId,
        string impactHash,
        uint256 reportedCost,
        string description,
        uint256 timestamp
    );

    // Constructor: The deployer becomes the owner (who can record proofs for MVP)
    constructor() Ownable(msg.sender) {}

    // Function to record an impact proof on-chain
    // Restricted to the owner (your dev team's wallet for MVP)
    function recordImpactHash(
        uint256 _campaignId,
        string memory _impactHash,
        uint256 _reportedCost,
        string memory _description
    ) public onlyOwner {
        require(bytes(_impactHash).length > 0, "Impact hash cannot be empty");
        require(_reportedCost >= 0, "Reported cost cannot be negative");
        require(bytes(_description).length > 0, "Description cannot be empty");

        campaignImpactUpdates[_campaignId].push(
            ImpactUpdate({
                campaignId: _campaignId,
                impactHash: _impactHash,
                reportedCost: _reportedCost,
                description: _description,
                timestamp: block.timestamp
            })
        );

        emit ImpactProofRecorded(_campaignId, _impactHash, _reportedCost, _description, block.timestamp);
    }

    // Function to get all impact updates for a specific campaign
    function getImpactUpdatesForCampaign(uint256 _campaignId)
        public
        view
        returns (ImpactUpdate[] memory)
    {
        return campaignImpactUpdates[_campaignId];
    }
}