const { ethers } = require("hardhat");

async function main() {
  const walletAddress = "0x1B10Fae83C2c08C3809E4FEd4e1814F5BF8cD0B3";
  const usdcAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7c";
  const contentAccessContract = "0x61ffB2f02B1b795dbB46d10fBAbC9cD504c125d7";

  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
  
  console.log("🔍 Checking balances on Base Sepolia...");
  console.log("Wallet Address:", walletAddress);
  console.log("USDC Contract:", usdcAddress);
  console.log("Content Access Contract:", contentAccessContract);
  console.log("");

  try {
    // Check ETH balance
    const ethBalance = await provider.getBalance(walletAddress);
    const ethBalanceInEth = ethers.formatEther(ethBalance);
    console.log("💰 ETH Balance:", ethBalanceInEth, "ETH");
    console.log("   Raw Balance:", ethBalance.toString(), "wei");

    // Check USDC balance
    const usdcABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)"
    ];

    const usdcContract = new ethers.Contract(usdcAddress, usdcABI, provider);
    
    const usdcBalance = await usdcContract.balanceOf(walletAddress);
    const usdcDecimals = await usdcContract.decimals();
    const usdcSymbol = await usdcContract.symbol();
    const usdcBalanceFormatted = ethers.formatUnits(usdcBalance, usdcDecimals);
    
    console.log("💵 USDC Balance:", usdcBalanceFormatted, usdcSymbol);
    console.log("   Raw Balance:", usdcBalance.toString(), "units");

    // Check if contract exists
    const contractCode = await provider.getCode(contentAccessContract);
    console.log("📋 Content Access Contract Code Length:", contractCode.length);
    console.log("   Contract Exists:", contractCode !== "0x");

    // Estimate gas for a simple transaction
    const gasPrice = await provider.getFeeData();
    console.log("⛽ Current Gas Price:", ethers.formatUnits(gasPrice.gasPrice, "gwei"), "gwei");
    
    // Estimate cost for a simple transaction (21000 gas)
    const estimatedCost = gasPrice.gasPrice * 21000n;
    console.log("💸 Estimated ETH needed for basic tx:", ethers.formatEther(estimatedCost), "ETH");

    // Check if user has enough ETH for basic transaction
    if (ethBalance < estimatedCost) {
      console.log("❌ Insufficient ETH for basic transaction");
      console.log("   Need at least:", ethers.formatEther(estimatedCost), "ETH");
      console.log("   Have:", ethBalanceInEth, "ETH");
      console.log("   Missing:", ethers.formatEther(estimatedCost - ethBalance), "ETH");
    } else {
      console.log("✅ Sufficient ETH for basic transaction");
    }

    // Check USDC allowance for content access contract
    const allowanceABI = [
      "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const usdcWithAllowance = new ethers.Contract(usdcAddress, allowanceABI, provider);
    const allowance = await usdcWithAllowance.allowance(walletAddress, contentAccessContract);
    const allowanceFormatted = ethers.formatUnits(allowance, usdcDecimals);
    
    console.log("🔐 USDC Allowance for Contract:", allowanceFormatted, usdcSymbol);
    console.log("   Raw Allowance:", allowance.toString(), "units");

  } catch (error) {
    console.error("❌ Error checking balances:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 