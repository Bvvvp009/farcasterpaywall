import { ethers } from "ethers";
import { decryptContent } from "./payAndDecrypt";
import contentAccessABI from "../../contracts/contractABI.json";

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";


export interface UserContent {
  contentId: string;
  originalContentId: string;
  ipfsCid: string;
  creator: string;
  price: string;
  priceInUSDC: string;
  title?: string;
  description?: string;
  contentType?: string;
  createdAt?: string;
  isActive: boolean;
  hasAccess: boolean;
}

export async function getUserUploadedContent(userAddress: string): Promise<UserContent[]> {
  try {
    console.log("Fetching content for user:", userAddress);
    
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org");
    const contract = new ethers.Contract(contentAccessContract, contentAccessABI, provider);

    // Get all content IDs uploaded by the user
    const contentIds = await contract.showUsersUpload(userAddress);
    console.log("Found content IDs:", contentIds);

    const userContent: UserContent[] = [];

    // For each content ID, fetch the details from contract and metadata from IPFS
    for (const contentId of contentIds) {
      try {
        // Get content details from contract
        const contentDetails = await contract.getContent(contentId);
        
        // Check if current user has access to this content
        const hasAccess = await contract.checkAccess(userAddress, contentId);
        
        // Try to fetch metadata from IPFS
        const metadata = await fetchContentMetadata(contentDetails.ipfsCid);
        
        // Convert price from USDC units (6 decimals) to readable format
        const priceInUSDC = ethers.formatUnits(contentDetails.price, 6);
        
        userContent.push({
          contentId: contentId,
          originalContentId: metadata?.originalContentId || contentId,
          ipfsCid: contentDetails.ipfsCid,
          creator: contentDetails.creator,
          price: priceInUSDC,
          priceInUSDC: contentDetails.price.toString(),
          title: metadata?.title || `Content ${contentId}`,
          description: metadata?.description || "Encrypted content",
          contentType: metadata?.contentType || "text",
          createdAt: new Date(Number(contentDetails.createdAt) * 1000).toISOString(),
          isActive: contentDetails.isActive,
          hasAccess: hasAccess
        });
      } catch (error) {
        console.error(`Error fetching content ${contentId}:`, error);
        // Add basic info even if metadata fetch fails
        userContent.push({
          contentId: contentId,
          originalContentId: contentId,
          ipfsCid: "",
          creator: userAddress,
          price: "0",
          priceInUSDC: "0",
          title: `Content ${contentId}`,
          description: "Metadata not available",
          isActive: false,
          hasAccess: false
        });
      }
    }

    return userContent;
  } catch (error) {
    console.error("Error fetching user content:", error);
    return [];
  }
}

async function fetchContentMetadata(ipfsCid: string): Promise<any> {
  try {
    if (!ipfsCid || ipfsCid === "") {
      return null;
    }

    // Fetch metadata from IPFS
    const response = await fetch(`https://dweb.link/ipfs/${ipfsCid}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch IPFS data: ${response.status}`);
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error("Error fetching content metadata:", error);
    return null;
  }
}

export async function decryptUserContent(
  contentId: string, 
  dataToEncryptHash: string, 
  ciphertext: string
): Promise<string> {
  try {
    return await decryptContent(contentId, dataToEncryptHash, ciphertext);
  } catch (error) {
    console.error("Error decrypting user content:", error);
    throw error;
  }
}

// Function to get content details by ID
export async function getContentById(contentId: string): Promise<UserContent | null> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
    const contentAccessContractInstance = new ethers.Contract(
      contentAccessContract,
      contentAccessABI,
      provider
    );

    const contentDetails = await contentAccessContractInstance.getContent(contentId);
    
    if (contentDetails.creator === ethers.ZeroAddress) {
      return null; // Content doesn't exist
    }

    const metadata = await fetchContentMetadata(contentDetails.ipfsCid);
    const priceInUSDC = ethers.formatUnits(contentDetails.price, 6);

    return {
      contentId: contentId,
      originalContentId: metadata?.originalContentId || contentId,
      ipfsCid: contentDetails.ipfsCid,
      creator: contentDetails.creator,
      price: priceInUSDC,
      priceInUSDC: contentDetails.price.toString(),
      title: metadata?.title || `Content ${contentId}`,
      description: metadata?.description || "Encrypted content",
      contentType: metadata?.contentType || "text",
      createdAt: new Date(Number(contentDetails.createdAt) * 1000).toISOString(),
      isActive: contentDetails.isActive,
      hasAccess: false // Will be checked separately
    };
  } catch (error) {
    console.error("Error fetching content by ID:", error);
    return null;
  }
}

// Function to check if user has access to specific content
export async function checkUserAccess(userAddress: string, contentId: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org");
    const contentAccessContractInstance = new ethers.Contract(
      contentAccessContract,
      contentAccessABI,
      provider
    );

    return await contentAccessContractInstance.checkAccess(userAddress, contentId);
  } catch (error) {
    console.error("Error checking user access:", error);
    return false;
  }
} 