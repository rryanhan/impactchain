pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Donation {
    address public immutable charityWallet;
    address public immutable usdcTokenAddress;

    event DonationReceived(
        address indexed donor,
        uint256 amount,
        address indexed tokenAddress,
        uint256 timestamp
    );

    // Constructor – run only once when the contract is deplpoyed
    // Initializes the charity wallet and USDC token address
    constructor (address _charityWallet, address _usdcTokenAddress) {
        require(_charityWallet != address(0), "Invalid charity wallet address");
        require(_usdcTokenAddress != address(0), "Invalid USDC token address");

        charityWallet = _charityWallet;
        usdcTokenAddress = _usdcTokenAddress;

    }

    function donate(uint256 _amount) public {
        require(_amount > 0, "Donation must exceed zero");

        // Transfer USDC from the donor to the charity wallet
        bool success = IERC20(usdcTokenAddress).transferFrom(msg.sender, address(this), _amount);
        require(success, "Failed to transfer USDC from donor");

        // Immediately transfer the USDC to the charity wallet
        success = IERC20(usdcTokenAddress).transfer(charityWallet, _amount);
        require(success, "Transfer to charity wallet failed");

        emit DonationReceived(msg.sender, _amount, usdcTokenAddress, block.timestamp);

    }
}