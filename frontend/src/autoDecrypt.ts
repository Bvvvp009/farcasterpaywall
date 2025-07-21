import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { decryptToString } from "@lit-protocol/encryption";
import { createSiweMessage, generateAuthSig, LitAccessControlConditionResource } from "@lit-protocol/auth-helpers";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { ethers } from "ethers";

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export interface ContentMetadata {
  title: string;
  description: string;
  contentType: string;
  accessType: string;
  contentId: string;
  dataToEncryptHash: string;
  ciphertext: string;
  metadata: {
    originalContentId: string;
    creator: string;
    price: string;
    createdAt: string;
    contentType: string;
  };
}

export interface AutoDecryptResult {
  success: boolean;
  decryptedContent?: string;
  error?: string;
  hasAccess: boolean;
  needsPayment?: boolean;
  price?: string;
}

/**
 * Check if user has access to content on-chain
 */
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

/**
 * Get content details from contract
 */
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

/**
 * Fetch content metadata from IPFS with multiple gateway fallbacks
 */
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
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout
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

/**
 * Check if user has access to content and automatically decrypt if possible
 */
export async function autoDecryptContent(
  contentId: string, 
  userAddress: string,
  ipfsCid?: string
): Promise<AutoDecryptResult> {
  console.log("🤖 Auto-decrypting content:", contentId);
  console.log("👤 User address:", userAddress);

  try {
    // Step 1: Check if user has access on-chain
    const hasAccess = await checkContentAccessOnChain(contentId, userAddress);
    console.log("🔐 Has access:", hasAccess);

    if (!hasAccess) {
      // Get content details to show price
      const contentDetails = await getContentDetails(contentId);
      return {
        success: false,
        hasAccess: false,
        needsPayment: true,
        price: contentDetails?.price || "Unknown",
        error: "Access denied. Payment required."
      };
    }

    // Step 2: If user has access, fetch content metadata from IPFS
    if (!ipfsCid) {
      const contentDetails = await getContentDetails(contentId);
      if (!contentDetails?.ipfsCid) {
        return {
          success: false,
          hasAccess: true,
          error: "IPFS CID not found"
        };
      }
      ipfsCid = contentDetails.ipfsCid;
    }

    // Ensure ipfsCid is defined
    if (!ipfsCid) {
      return {
        success: false,
        hasAccess: true,
        error: "IPFS CID is required but not available"
      };
    }

    // Step 3: Fetch metadata from IPFS
    const metadata = await fetchContentMetadata(ipfsCid);
    if (!metadata) {
      return {
        success: false,
        hasAccess: true,
        error: "Failed to fetch content metadata from IPFS"
      };
    }

    // Step 4: Decrypt content using Lit Protocol
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

/**
 * Automatically check access and decrypt content for connected signer
 */
export async function autoCheckAndDecryptForSigner(
  contentId: string,
  signer: ethers.Signer
): Promise<AutoDecryptResult> {
  try {
    const userAddress = await signer.getAddress();
    console.log("🔍 Auto-checking access for signer:", userAddress);
    
    return await autoDecryptContent(contentId, userAddress);
  } catch (error) {
    console.error("Auto-check and decrypt failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Automatically check access and decrypt content for Farcaster user
 */
export async function autoCheckAndDecryptForFarcaster(
  contentId: string
): Promise<AutoDecryptResult> {
  try {
    // Check if we're in Farcaster environment
    const { sdk } = await import('@farcaster/frame-sdk');
    const isMiniApp = await sdk.isInMiniApp();
    
    if (!isMiniApp) {
      return {
        success: false,
        hasAccess: false,
        error: "Not in Farcaster Mini App environment"
      };
    }

    const provider = await sdk.wallet.getEthereumProvider();
    if (!provider) {
      return {
        success: false,
        hasAccess: false,
        error: "No Ethereum provider available"
      };
    }

    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const userAddress = await signer.getAddress();
    
    console.log("🎭 Auto-checking access for Farcaster user:", userAddress);
    
    return await autoDecryptContent(contentId, userAddress);
  } catch (error) {
    console.error("Auto-check and decrypt for Farcaster failed:", error);
    return {
      success: false,
      hasAccess: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Decrypt content using Lit Protocol
 */
async function decryptWithLitProtocol(
  ciphertext: string,
  dataToEncryptHash: string,
  contentId: string,
  userAddress: string
): Promise<string> {
  const litNodeClient = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilTest });
  await litNodeClient.connect();

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

  // EVM access control conditions (must match encryption)
  const evmContractConditions = [
    {
      contractAddress: contentAccessContract,
      functionName: "checkAccess",
      functionParams: [":userAddress", bytes32ContentId],
      functionAbi: {
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
      chain: "base",
      returnValueTest: {
        key: "",
        comparator: '=',
        value: 'true'
      }
    }
  ];

  const sessionSigs = await litNodeClient.getSessionSigs({
    chain: "base",
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource(
          await LitAccessControlConditionResource.generateResourceString(
            evmContractConditions,
            dataToEncryptHash
          )
        ),
        ability: LIT_ABILITY.AccessControlConditionDecryption
      }
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: walletClient.address,
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient
      });
      return await generateAuthSig({ signer: walletClient, toSign });
    }
  });

  return await decryptToString(
    {
      chain: "base",
      ciphertext: ciphertext,
      dataToEncryptHash: dataToEncryptHash,
      evmContractConditions,
      sessionSigs
    },
    litNodeClient
  );
} 