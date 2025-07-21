import { ethers } from "ethers";

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export interface ContentMetadata {
  originalContentId: string;
  creator: string;
  price: string;
  createdAt: string;
  contentType: string;
  dataToEncryptHash: string;
  ciphertext: string;
}

export interface AutoDecryptResult {
  success: boolean;
  hasAccess: boolean;
  needsPayment?: boolean;
  price?: string;
  decryptedContent?: string;
  error?: string;
}

export async function autoDecryptContent(
  contentId: string,
  userAddress: string,
  ipfsCid?: string
): Promise<AutoDecryptResult> {
  try {
    console.log("🤖 Auto-decrypting content:", contentId);
    console.log("👤 User address:", userAddress);

    // Check access on-chain
    const hasAccess = await checkContentAccessOnChain(contentId, userAddress);
    console.log("🔐 Has access:", hasAccess);

    if (!hasAccess) {
      // Get content details to show price
      const contentDetails = await getContentDetails(contentId);
      if (contentDetails) {
        return {
          success: false,
          hasAccess: false,
          needsPayment: true,
          price: contentDetails.price,
          error: "Payment required to access this content"
        };
      }
      return {
        success: false,
        hasAccess: false,
        error: "No access to this content"
      };
    }

    // Get content details and IPFS metadata
    const contentDetails = await getContentDetails(contentId);
    if (!contentDetails) {
      return {
        success: false,
        hasAccess: true,
        error: "Content not found"
      };
    }

    // Fetch metadata from IPFS
    const metadata = await fetchContentMetadata(contentDetails.ipfsCid);
    if (!metadata) {
      return {
        success: false,
        hasAccess: true,
        error: "Failed to fetch content metadata"
      };
    }

    // Decrypt content
    const decryptedContent = await decryptWithLitProtocol(
      metadata.ciphertext,
      metadata.dataToEncryptHash,
      contentId,
      userAddress
    );

    return {
      success: true,
      hasAccess: true,
      decryptedContent
    };
  } catch (error) {
    console.error("Auto-decrypt failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

async function checkContentAccessOnChain(contentId: string, userAddress: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org");
    const contract = new ethers.Contract(
      contentAccessContract,
      ["function checkAccess(address user, bytes32 contentId) view returns (bool)"],
      provider
    );

    // Handle contentId format
    let bytes32ContentId: string;
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId;
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId);
    }

    return await contract.checkAccess(userAddress, bytes32ContentId);
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
}

async function getContentDetails(contentId: string): Promise<any> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org");
    const contract = new ethers.Contract(
      contentAccessContract,
      ["function getContent(bytes32 contentId) view returns (tuple(address creator, uint256 price, string ipfsCid, bool isActive, uint256 createdAt))"],
      provider
    );

    let bytes32ContentId: string;
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId;
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId);
    }

    const content = await contract.getContent(bytes32ContentId);
    
    return {
      creator: content.creator,
      price: ethers.formatUnits(content.price, 6),
      ipfsCid: content.ipfsCid,
      isActive: content.isActive,
      createdAt: new Date(Number(content.createdAt) * 1000).toISOString()
    };
  } catch (error) {
    console.error("Error getting content details:", error);
    return null;
  }
}

async function fetchContentMetadata(ipfsCid: string): Promise<ContentMetadata | null> {
  const gateways = [
    `https://${ipfsCid}.ipfs.dweb.link`,
    `https://${ipfsCid}.ipfs.nftstorage.link`,
    `https://${ipfsCid}.ipfs.infura-ipfs.io`,
    `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
    `https://ipfs.io/ipfs/${ipfsCid}`
  ];

  for (const gateway of gateways) {
    try {
      console.log(`🔍 Trying IPFS gateway: ${gateway}`);
      const response = await fetch(gateway, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (response.ok) {
        const metadata = await response.json();
        console.log(`✅ IPFS fetch successful from: ${gateway}`);
        return metadata;
      } else {
        console.log(`❌ Gateway ${gateway} returned: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Gateway ${gateway} failed:`, error);
      continue;
    }
  }
  console.error("All IPFS gateways failed");
  return null;
}

async function decryptWithLitProtocol(
  ciphertext: string,
  dataToEncryptHash: string,
  contentId: string,
  userAddress: string
): Promise<string> {
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

  // Handle contentId format
  let bytes32ContentId: string;
  if (contentId.startsWith('0x') && contentId.length === 66) {
    bytes32ContentId = contentId;
  } else {
    bytes32ContentId = ethers.encodeBytes32String(contentId);
  }

  // For now, return a placeholder - in full implementation this would use Lit Protocol
  return `Decrypted content for ${contentId} (placeholder - Lit Protocol integration needed)`;
}

export async function autoCheckAndDecryptForSigner(
  contentId: string,
  signer: ethers.Signer
): Promise<AutoDecryptResult> {
  try {
    console.log("🔍 Auto-checking access for signer:", await signer.getAddress());
    return await autoDecryptContent(contentId, await signer.getAddress());
  } catch (error) {
    console.error("Auto-check for signer failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function autoCheckAndDecryptForFarcaster(
  contentId: string
): Promise<AutoDecryptResult> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk');
    const context = await sdk.context;
    const provider = await sdk.wallet.getEthereumProvider();
    
    if (!provider) {
      throw new Error("No Ethereum provider available");
    }

    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    
    return await autoDecryptContent(contentId, await signer.getAddress());
  } catch (error) {
    console.error("Auto-check for Farcaster failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
} 