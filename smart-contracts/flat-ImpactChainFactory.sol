// Sources flattened with hardhat v2.25.0 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.3.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File contracts/ImpactChain.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.28;

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


// File contracts/ImpactChainFactory.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.28;

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
        uint256 creationDate // ADDED
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
     */
    function createImpactChain(
        string memory _creatorName,
        address _charityWallet,
        address _tokenAddress,
        uint256 _goalAmount,
        string memory _title,
        string memory _description,
        string memory _imageUrl
    ) public {
        ImpactChain newImpactChain = new ImpactChain(
            msg.sender,
            _creatorName,
            _charityWallet,
            _tokenAddress,
            _goalAmount,
            _title,
            _description,
            _imageUrl
        );

        deployedImpactChains.push(newImpactChain);

        emit ImpactChainCreated(
            address(newImpactChain),
            msg.sender,
            _creatorName,
            _charityWallet,
            _goalAmount,
            _title,
            block.timestamp // ADDED: Emit the creation timestamp
        );
    }

    /**
     * @notice Returns an array of all created ImpactChain addresses.
     * @return An array of addresses.
     */
    function getAllImpactChains() public view returns (ImpactChain[] memory) {
        return deployedImpactChains;
    }
}
