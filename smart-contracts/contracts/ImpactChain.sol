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

    // Array to store hashes of impact proof documents
    string[] public impactProofHashes;

    // --- Events ---

    event Donated(address indexed donor, uint256 amount, uint256 timestamp);
    event ImpactProofAdded(string proofHash, uint256 timestamp);

    // --- Constructor ---

    constructor(
        address _creator,
        string memory _creatorName, // ADDED
        address _charityWallet,
        address _tokenAddress,
        uint256 _goalAmount,
        string memory _title,
        string memory _description,
        string memory _imageUrl
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
    function addImpactProof(string memory _proofHash) public {
        require(msg.sender == creator, "Only the creator can add proofs");
        impactProofHashes.push(_proofHash);
        emit ImpactProofAdded(_proofHash, block.timestamp);
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
        uint256        // creationDate (ADDED)
    ) {
        return (
            title,
            description,
            imageUrl,
            goalAmount,
            raisedAmount,
            charityWallet,
            creatorName,
            creationDate
        );
    }
}