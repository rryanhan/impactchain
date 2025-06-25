// Load Hardhat plugins
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-toolbox");
//require("@nomicfoundation/hardhat-chai"); // For testing
// If you ever need contract verification on Polygonscan, uncomment and configure:
// require("@nomicfoundation/hardhat-verify");

// Load environment variables from the project root's .env file
require('dotenv').config({ path: '../.env' });

// Access the environment variables
const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;



// Ensure environment variables are set
if (!POLYGON_AMOY_RPC_URL) {
  throw new Error("POLYGON_AMOY_RPC_URL is not set in .env file");
}
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is not set in .env file");
}


module.exports = {
  // Specify the Solidity compiler version
  solidity: {
    version: "0.8.28", // Make sure this matches your contract's pragma
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for 200 runs
      },
    },
  },

  // Define the networks Hardhat can connect to
  networks: {
    // Hardhat Network (for local testing, default)
    hardhat: {
      chainId: 31337, // Default Hardhat Network Chain ID
    },
    // Polygon Amoy Testnet configuration
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts: [PRIVATE_KEY], // Use your private key for deployment
      chainId: 80002, // The official Chain ID for Polygon Amoy
      // Optional: You can specify a higher gas price or limit if transactions are failing
      // gasPrice: 20000000000, // Example: 20 Gwei
      // gas: 2100000,           // Example: 2.1 million gas limit
    },
  },

  // Optional: Etherscan configuration for contract verification on Polygonscan
  // Uncomment and configure if you want to verify your deployed contracts later
  // etherscan: {
  //   apiKey: {
  //     polygonAmoy: process.env.POLYGONSCAN_API_KEY_AMOY // Get an API key from https://polygonscan.com/register
  //   },
  //   customChains: [
  //     {
  //       network: "polygonAmoy",
  //       chainId: 80002,
  //       urls: {
  //         api: "https://api-amoy.polygonscan.com/api", // Polygonscan Amoy API URL
  //         browser: "https://amoy.polygonscan.com"      // Polygonscan Amoy browser URL
  //       }
  //     }
  //   ]
  // },

  // Optional: Specify paths if they differ from default
  // paths: {
  //   sources: "./contracts",
  //   tests: "./test",
  //   cache: "./cache",
  //   artifacts: "./artifacts"
  // },
};