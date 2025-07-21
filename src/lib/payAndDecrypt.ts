import { ethers } from "ethers";
import { decryptContent as decryptContentUtil } from './encryption';

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export async function decryptContent(cipherText: string, dataToEncryptHash: string, contentId: string): Promise<string> {
  console.log("🔓 Starting decryption...");
  console.log("📝 Content ID:", contentId);
  console.log("🔑 Data Hash:", dataToEncryptHash);
  console.log("📄 Ciphertext length:", cipherText.length);

  // Use Farcaster wallet provider instead of private key
  const { sdk } = await import('@farcaster/frame-sdk');
  const isMiniApp = await sdk.isInMiniApp();
  
  if (!isMiniApp) {
    throw new Error("Not in Farcaster Mini App environment");
  }

  const provider = await sdk.wallet.getEthereumProvider();
  if (!provider) {
    throw new Error("No Ethereum provider available");
  }

  const ethersProvider = new ethers.BrowserProvider(provider);
  const walletClient = await ethersProvider.getSigner();

  console.log("👤 Decrypting with wallet address:", walletClient.address);

  // Handle contentId format
  let bytes32ContentId: string;
  if (contentId.startsWith('0x') && contentId.length === 66) {
    bytes32ContentId = contentId;
  } else {
    bytes32ContentId = ethers.encodeBytes32String(contentId);
  }

  // For now, use the existing encryption system
  // In a full implementation, this would use Lit Protocol
  try {
    // This is a simplified version - in reality you'd use Lit Protocol here
    const decrypted: string = await decryptContentUtil(cipherText, dataToEncryptHash);
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error(`Decryption failed: ${error}`);
  }
} 