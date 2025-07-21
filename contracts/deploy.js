const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ContentAccess contract...");

  // USDC token addresses for different networks
  const USDC_ADDRESSES = {
    // Base Sepolia USDC
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    // Base Mainnet USDC
    "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    // Sepolia USDC (for testing)
    "sepolia": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  };

  // Platform fee collector addresses
  const PLATFORM_FEE_COLLECTORS = {
    // Base Sepolia - use deployer as platform fee collector for testing
    "base-sepolia": "0x61ffb2f02b1b795dbb46d10fbabc9cd504c125d7", // Test contract
    // Base Mainnet
    "base": "0x0320818E5635DB82E605D405F5D3B10EbfC66dCF", // Mainnet contract
    // Sepolia - use deployer as platform fee collector for testing
    "sepolia": "0x5043a60237322a06edbbb82287c7ba53713b4a39"
  };

  // Get the network
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  
  console.log(`Network: ${networkName}`);
  
  // Get USDC address for the network
  const usdcAddress = USDC_ADDRESSES[networkName];
  if (!usdcAddress) {
    throw new Error(`USDC address not found for network: ${networkName}`);
  }
  
  // Get platform fee collector address
  const platformFeeCollector = PLATFORM_FEE_COLLECTORS[networkName];
  if (!platformFeeCollector) {
    throw new Error(`Platform fee collector address not found for network: ${networkName}`);
  }
  
  console.log(`USDC Address: ${usdcAddress}`);
  console.log(`Platform Fee Collector: ${platformFeeCollector}`);

  // Get the contract factory
  const ContentAccess = await ethers.getContractFactory("ContentAccess");
  
  // Deploy the contract
  const contentAccess = await ContentAccess.deploy(usdcAddress, platformFeeCollector);
  
  // Wait for deployment
  await contentAccess.waitForDeployment();
  
  const contractAddress = await contentAccess.getAddress();
  
  console.log("ContentAccess deployed to:", contractAddress);
  console.log("USDC Token Address:", usdcAddress);
  console.log("Platform Fee Collector:", platformFeeCollector);
  
  // Verify the deployment
  console.log("\nVerifying deployment...");
  
  // Check USDC token
  const usdcToken = await ethers.getContractAt("IERC20", usdcAddress);
  const usdcName = await usdcToken.name();
  const usdcSymbol = await usdcToken.symbol();
  const usdcDecimals = await usdcToken.decimals();
  
  console.log(`USDC Token: ${usdcName} (${usdcSymbol}) - ${usdcDecimals} decimals`);
  
  // Check contract owner
  const owner = await contentAccess.owner();
  console.log("Contract Owner:", owner);
  
  // Check platform fee collector
  const feeCollector = await contentAccess.platformFeeCollector();
  console.log("Platform Fee Collector:", feeCollector);
  
  // Check platform fee percentage
  const platformFeeBps = await contentAccess.PLATFORM_FEE_BPS();
  const feePercentage = (Number(platformFeeBps) / 10000) * 100;
  console.log(`Platform Fee: ${feePercentage}%`);
  
  console.log("\nDeployment successful! 🎉");
  console.log("\nNext steps:");
  console.log("1. Update the contract address in your frontend code");
  console.log("2. Test the contract with USDC payments and platform fees");
  console.log("3. Integrate with Farcaster wallet");
  console.log("4. Verify the contract on block explorer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 