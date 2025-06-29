// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ImpactChain
 * @notice This contract represents a single, specific donation campaign.
 * It manages its own data, donation logic, and impact proof tracking.
 */
contract ImpactChain {
    // --- State Variables ---

    address public immutable creator;
    address public immutable charityWallet;
    IERC20 public immutable token; // The ERC20 token for donations (e.g., USDC)

    string public title;
    string public description;
    string public imageUrl;
    string public creatorName; // ADDED: Human-readable creator name
    uint256 public immutable creationDate; // ADDED: Timestamp of creation

    uint256 public immutable goalAmount;
    uint256 public raisedAmount;

    // NEW: Struct to hold impact proof data with deletion status
    struct ImpactProof {
        string hash;
        bool isDeleted;
        uint256 timestamp;
        uint256 deletedAt;
    }

    // Array to store impact proof structs
    ImpactProof[] public impactProofs;
    
    // NEW: Toggle for allowing deletion of impact proofs
    bool public immutable allowDeletion;

    // --- Events ---

    event Donated(address indexed donor, uint256 amount, uint256 timestamp);
    event ImpactProofAdded(string proofHash, uint256 timestamp);
    event ImpactProofMarkedDeleted(uint256 indexed proofIndex, string proofHash, uint256 timestamp); // NEW

    // --- Modifiers ---

    modifier onlyCreator() {
        require(msg.sender == creator, "Only the creator can perform this action");
        _;
    }

    modifier deletionAllowed() {
        require(allowDeletion, "Impact proof deletion is not allowed for this campaign");
        _;
    }

    // --- Constructor ---

    constructor(
        address _creator,
        string memory _creatorName, // ADDED
        address _charityWallet,
        address _tokenAddress,
        uint256 _goalAmount,
        string memory _title,
        string memory _description,
        string memory _imageUrl,
        bool _allowDeletion // NEW: Toggle for deletion feature
    ) {
        creator = _creator;
        creatorName = _creatorName; // ADDED
        creationDate = block.timestamp; // ADDED
        charityWallet = _charityWallet;
        token = IERC20(_tokenAddress);
        goalAmount = _goalAmount;
        title = _title;
        description = _description;
        imageUrl = _imageUrl;
        allowDeletion = _allowDeletion; // NEW: Set deletion toggle
    }

    // --- Functions ---

    /**
     * @notice Allows a user to donate a specified amount of the approved token.
     * @dev The donor must have first approved the contract to spend the tokens.
     * @param _amount The amount of tokens to donate.
     */
    function donate(uint256 _amount) public {
        require(_amount > 0, "Donation amount must be greater than 0");

        // Transfer tokens from the donor to this contract
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed");

        raisedAmount += _amount;
        
        emit Donated(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Allows the creator to add a hash of an impact proof document.
     * @dev This provides an on-chain, tamper-proof record of the report's existence.
     * @param _proofHash The hash of the off-chain impact report.
     */
    function addImpactProof(string memory _proofHash) public onlyCreator {
        require(bytes(_proofHash).length > 0, "Proof hash cannot be empty");
        
        impactProofs.push(ImpactProof({
            hash: _proofHash,
            isDeleted: false,
            timestamp: block.timestamp,
            deletedAt: 0
        }));
        
        emit ImpactProofAdded(_proofHash, block.timestamp);
    }

    /**
     * @notice Allows the creator to mark an impact proof as deleted if deletion is enabled.
     * @dev This function only works if allowDeletion was set to true during construction.
     * @param _proofIndex The index of the proof to mark as deleted.
     */
    function markImpactProofAsDeleted(uint256 _proofIndex) public onlyCreator deletionAllowed {
        require(_proofIndex < impactProofs.length, "Proof index out of bounds");
        require(!impactProofs[_proofIndex].isDeleted, "Proof is already marked as deleted");
        
        // Mark the proof as deleted
        impactProofs[_proofIndex].isDeleted = true;
        impactProofs[_proofIndex].deletedAt = block.timestamp;
        
        emit ImpactProofMarkedDeleted(_proofIndex, impactProofs[_proofIndex].hash, block.timestamp);
    }

    /**
     * @notice Returns the total number of impact proofs (including deleted ones).
     * @return The number of impact proofs stored.
     */
    function getImpactProofCount() public view returns (uint256) {
        return impactProofs.length;
    }

    /**
     * @notice Returns the number of active (non-deleted) impact proofs.
     * @return The number of active impact proofs.
     */
    function getActiveImpactProofCount() public view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < impactProofs.length; i++) {
            if (!impactProofs[i].isDeleted) {
                activeCount++;
            }
        }
        return activeCount;
    }

    /**
     * @notice Returns all impact proof hashes (including deleted ones).
     * @return An array of all impact proof hashes.
     */
    function getAllImpactProofHashes() public view returns (string[] memory) {
        string[] memory hashes = new string[](impactProofs.length);
        for (uint256 i = 0; i < impactProofs.length; i++) {
            hashes[i] = impactProofs[i].hash;
        }
        return hashes;
    }

    /**
     * @notice Returns only active (non-deleted) impact proof hashes.
     * @return An array of active impact proof hashes.
     */
    function getActiveImpactProofHashes() public view returns (string[] memory) {
        uint256 activeCount = getActiveImpactProofCount();
        string[] memory hashes = new string[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < impactProofs.length; i++) {
            if (!impactProofs[i].isDeleted) {
                hashes[currentIndex] = impactProofs[i].hash;
                currentIndex++;
            }
        }
        return hashes;
    }

    /**
     * @notice Returns the full impact proof data at a specific index.
     * @param _index The index of the proof to retrieve.
     * @return The impact proof struct.
     */
    function getImpactProof(uint256 _index) public view returns (ImpactProof memory) {
        require(_index < impactProofs.length, "Index out of bounds");
        return impactProofs[_index];
    }

    /**
     * @notice Returns all active impact proof data.
     * @return An array of active impact proof structs.
     */
    function getActiveImpactProofs() public view returns (ImpactProof[] memory) {
        uint256 activeCount = getActiveImpactProofCount();
        ImpactProof[] memory activeProofs = new ImpactProof[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < impactProofs.length; i++) {
            if (!impactProofs[i].isDeleted) {
                activeProofs[currentIndex] = impactProofs[i];
                currentIndex++;
            }
        }
        return activeProofs;
    }

    /**
     * @notice Allows the charity to withdraw the donated funds.
     */
    function withdrawFunds() public {
        require(msg.sender == charityWallet, "Only the charity can withdraw");
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");

        bool success = token.transfer(charityWallet, balance);
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Returns all details of the campaign for the frontend.
     */
    function getCampaignDetails() public view returns (
        string memory, // title
        string memory, // description
        string memory, // imageUrl
        uint256,       // goalAmount
        uint256,       // raisedAmount
        address,       // charityWallet
        string memory, // creatorName (ADDED)
        uint256,       // creationDate (ADDED)
        bool          // allowDeletion (NEW)
    ) {
        return (
            title,
            description,
            imageUrl,
            goalAmount,
            raisedAmount,
            charityWallet,
            creatorName,
            creationDate,
            allowDeletion
        );
    }
}