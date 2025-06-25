// smart-contracts/ignition/modules/ImpactChainModule.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat"); // Import ethers to parse units

// --- Configuration Variables for Deployment ---
// The public address of the charity wallet that will receive donations
// For hackathon MVP, this can be your own MetaMask wallet address for testing.
const CHARITY_RECEIVING_WALLET_ADDRESS = "0x7E79c98013b01D0a3096790C3315F344f4dD795A";

// The public address of your MetaMask wallet where you want to receive test mUSDC
const YOUR_TEST_WALLET_ADDRESS = "0x7E79c98013b01D0a3096790C3315F344f4dD795A";

// Amount of mUSDC to mint to your test wallet
const MINT_AMOUNT = ethers.parseUnits("1000", 18); // Mint 1000 mUSDC (assuming 18 decimals)
// ---------------------------------------------

module.exports = buildModule("ImpactChainModule", (m) => {
  // 1. Deploy the ERC20Mock token (your testnet USDC)
  const usdcMock = m.contract("ERC20Mock", ["USD Coin Mock", "mUSDC"]);

  // 2. Deploy the Donation contract
  // The Donation contract needs the charity's wallet and the deployed mUSDC token address
  const donationContract = m.contract("Donation", [
    CHARITY_RECEIVING_WALLET_ADDRESS,
    usdcMock, // Hardhat Ignition will automatically pass the address of usdcMock after it's deployed
  ]);

  // 3. Deploy the ImpactProof contract
  const impactProofContract = m.contract("ImpactProof");

  // 4. Mint mUSDC to your test wallet
  // This is a post-deployment step for testing purposes
  m.call(usdcMock, "mint", [YOUR_TEST_WALLET_ADDRESS, MINT_AMOUNT]);



  return { usdcMock, donationContract, impactProofContract };
});