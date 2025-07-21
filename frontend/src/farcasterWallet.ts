import { sdk } from '@farcaster/frame-sdk';
import { ethers } from 'ethers';
import { autoDecryptContent, AutoDecryptResult } from './autoDecrypt';

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// ContentAccess Contract ABI (simplified for Farcaster integration)
const contentAccessABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contentId",
        "type": "bytes32"
      }
    ],
    "name": "payForContent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "contentId",
        "type": "bytes32"
      }
    ],
    "name": "checkAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "contentId",
        "type": "bytes32"
      }
    ],
    "name": "getContent",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "ipfsCid",
            "type": "string"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct ContentAccess.Content",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// USDC Token ABI
const usdcABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  address?: string;
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
}

export interface FarcasterContentResult {
  success: boolean;
  hasAccess: boolean;
  needsPayment?: boolean;
  price?: string;
  decryptedContent?: string;
  error?: string;
  txHash?: string;
}

/**
 * Get Farcaster user context
 */
export async function getFarcasterUser(): Promise<FarcasterUser | null> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      console.log("Not in Farcaster Mini App environment");
      return null;
    }

    const context = await sdk.context;
    const provider = await sdk.wallet.getEthereumProvider();
    
    let address: string | undefined;
    if (provider) {
      const accounts = await provider.request({
        method: 'eth_accounts'
      });
      address = accounts[0];
    }

    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
      address
    };
  } catch (error) {
    console.error("Error getting Farcaster user:", error);
    return null;
  }
}

/**
 * Get user's wallet address from Farcaster
 */
export async function getFarcasterWalletAddress(): Promise<string | null> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      return null;
    }

    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) {
      return null;
    }

    const accounts = await provider.request({
      method: 'eth_accounts'
    });

    return accounts[0] || null;
  } catch (error) {
    console.error("Error getting Farcaster wallet address:", error);
    return null;
  }
}

/**
 * Pay for content using Farcaster wallet and USDC
 */
export async function payForContentWithFarcasterWallet(contentId: string): Promise<PaymentResult> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment");
    }

    const user = await getFarcasterUser();
    if (!user?.address) {
      throw new Error("No wallet address available");
    }

    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) {
      throw new Error("No Ethereum provider available");
    }

    // Create ethers provider and signer
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();

    // Get contract instances
    const contentAccessContractInstance = new ethers.Contract(
      contentAccessContract,
      contentAccessABI,
      signer
    );

    const usdcTokenInstance = new ethers.Contract(
      usdcTokenAddress,
      usdcABI,
      signer
    );

    // Get content details
    const content = await contentAccessContractInstance.getContent(contentId);
    console.log("Content price:", content.price.toString());

    // Check USDC balance
    const balance = await usdcTokenInstance.balanceOf(user.address);
    console.log("USDC balance:", balance.toString());

    if (balance < content.price) {
      throw new Error("Insufficient USDC balance");
    }

    // Approve USDC spending
    console.log("Approving USDC spending...");
    const approveTx = await usdcTokenInstance.approve(contentAccessContract, content.price);
    await approveTx.wait();
    console.log("USDC approved ✅");

    // Pay for content
    console.log("Paying for content...");
    const payTx = await contentAccessContractInstance.payForContent(contentId);
    await payTx.wait();
    console.log("Payment successful ✅", payTx.hash);

    return {
      success: true,
      txHash: payTx.hash,
      amount: content.price.toString()
    };
  } catch (error) {
    console.error("Payment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if user has access to content
 */
export async function checkContentAccess(userAddress: string, contentId: string): Promise<boolean> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      return false;
    }

    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) {
      return false;
    }

    const ethersProvider = new ethers.BrowserProvider(provider);
    const contentAccessContractInstance = new ethers.Contract(
      contentAccessContract,
      contentAccessABI,
      ethersProvider
    );

    return await contentAccessContractInstance.checkAccess(userAddress, contentId);
  } catch (error) {
    console.error("Error checking content access:", error);
    return false;
  }
}

/**
 * Get content details
 */
export async function getContentDetails(contentId: string): Promise<any> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (!isMiniApp) {
      return null;
    }

    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) {
      return null;
    }

    const ethersProvider = new ethers.BrowserProvider(provider);
    const contentAccessContractInstance = new ethers.Contract(
      contentAccessContract,
      contentAccessABI,
      ethersProvider
    );

    const content = await contentAccessContractInstance.getContent(contentId);
    
    if (content.creator === ethers.ZeroAddress) {
      return null; // Content doesn't exist
    }

    return {
      creator: content.creator,
      price: content.price.toString(),
      priceInUSDC: ethers.formatUnits(content.price, 6),
      ipfsCid: content.ipfsCid,
      isActive: content.isActive,
      createdAt: new Date(Number(content.createdAt) * 1000).toISOString()
    };
  } catch (error) {
    console.error("Error getting content details:", error);
    return null;
  }
}

/**
 * Initialize Farcaster Mini App
 */
export async function initializeFarcasterApp(): Promise<boolean> {
  try {
    const isMiniApp = await sdk.isInMiniApp();
    if (isMiniApp) {
      await sdk.actions.ready();
      console.log("Farcaster Mini App initialized successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing Farcaster Mini App:", error);
    return false;
  }
}

/**
 * Complete Farcaster content access flow: check access, pay if needed, auto-decrypt
 */
export async function accessContentWithFarcaster(
  contentId: string
): Promise<FarcasterContentResult> {
  try {
    const user = await getFarcasterUser();
    if (!user?.address) {
      return {
        success: false,
        hasAccess: false,
        error: "No Farcaster wallet address available"
      };
    }

    console.log("🎭 Farcaster content access flow for:", contentId);
    console.log("👤 User:", user.displayName || user.username, "(", user.address, ")");

    // Step 1: Try auto-decrypt first (user might already have access)
    const autoDecryptResult = await autoDecryptContent(contentId, user.address);
    
    if (autoDecryptResult.success) {
      console.log("✅ Auto-decrypt successful - user already has access");
      return {
        success: true,
        hasAccess: true,
        decryptedContent: autoDecryptResult.decryptedContent
      };
    }

    if (autoDecryptResult.needsPayment) {
      console.log("💰 Payment required:", autoDecryptResult.price, "USDC");
      
      // Step 2: Pay for content using Farcaster wallet
      const paymentResult = await payForContentWithFarcasterWallet(contentId);
      
      if (!paymentResult.success) {
        return {
          success: false,
          hasAccess: false,
          needsPayment: true,
          price: autoDecryptResult.price,
          error: paymentResult.error
        };
      }

      console.log("✅ Payment successful:", paymentResult.txHash);

      // Step 3: Auto-decrypt after payment
      const finalDecryptResult = await autoDecryptContent(contentId, user.address);
      
      if (finalDecryptResult.success) {
        console.log("✅ Auto-decrypt successful after payment");
        return {
          success: true,
          hasAccess: true,
          decryptedContent: finalDecryptResult.decryptedContent,
          txHash: paymentResult.txHash
        };
      } else {
        return {
          success: false,
          hasAccess: true,
          error: finalDecryptResult.error,
          txHash: paymentResult.txHash
        };
      }
    }

    // If we get here, there was an error with auto-decrypt
    return {
      success: false,
      hasAccess: false,
      error: autoDecryptResult.error
    };

  } catch (error) {
    console.error("Farcaster content access flow failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 