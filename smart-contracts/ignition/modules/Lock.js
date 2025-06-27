const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

// --- Configuration Variables for Deployment ---
const CHARITY_RECEIVING_WALLET_ADDRESS = "0x7E79c98013b01D0a3096790C3315F344f4dD795A";
const YOUR_TEST_WALLET_ADDRESS = "0x7E79c98013b01D0a3096790C3315F344f4dD795A";
const MINT_AMOUNT = ethers.parseUnits("1000", 18); // Mint 1000 mUSDC
// ---------------------------------------------

module.exports = buildModule("ImpactChainModule", (m) => {
  // 1. Deploy the ERC20Mock token (your testnet USDC)
  const usdcMock = m.contract("ERC20Mock", ["USD Coin Mock", "mUSDC"]);

  // 2. Deploy the Donation contract
  const donationContract = m.contract("Donation", [
    CHARITY_RECEIVING_WALLET_ADDRESS,
    usdcMock,
  ]);

  // 3. Deploy the ImpactProof contract
  const impactProofContract = m.contract("ImpactProof");

  // 4. Deploy the ImpactChain contract (add your required constructor args)
  // Placeholder args below, replace with your actual constructor parameters as required
  const impactChain = m.contract("ImpactChain", [
    YOUR_TEST_WALLET_ADDRESS,        // creator address (use YOUR_TEST_WALLET_ADDRESS for testing)
    "Test Creator",                  // creator name
    CHARITY_RECEIVING_WALLET_ADDRESS,// charity wallet
    usdcMock,                        // ERC20 token address
    ethers.parseUnits("100", 18),    // goal amount (e.g., 100 mUSDC)
    "Test Campaign",                 // campaign title
    "Test Description",              // campaign description
    "https://example.com/image.jpg"  // image URL
  ]);

  // 5. Deploy the ImpactChainFactory contract (no constructor args)
  const impactChainFactory = m.contract("ImpactChainFactory");

  // 6. Mint mUSDC to your test wallet
  m.call(usdcMock, "mint", [YOUR_TEST_WALLET_ADDRESS, MINT_AMOUNT]);

  return {
    usdcMock,
    donationContract,
    impactProofContract,
    impactChain,
    impactChainFactory,
  };
});