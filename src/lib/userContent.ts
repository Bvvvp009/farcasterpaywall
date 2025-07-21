import { ethers } from 'ethers'
import contentAccessABI from "../../contracts/contractABI.json"

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export interface UserContent {
  contentId: string
  originalContentId: string
  title: string
  price: string
  contentType: string
  hasAccess: boolean
  metadata?: any
  createdAt: string
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

    for (let i = 0; i < contentIds.length; i++) {
      const contentId = contentIds[i];
      if (contentId === ethers.ZeroHash) continue; // Skip empty entries

      try {
        // Get content details from contract
        const contentDetails = await contract.getContent(contentId);
        
        // Check if current user has access to this content
        const hasAccess = await contract.checkAccess(userAddress, contentId);
        
        // Try to fetch metadata from IPFS
        let metadata = null;
        try {
          const response = await fetch(`https://gateway.pinata.cloud/ipfs/${contentDetails.ipfsCid}`);
          if (response.ok) {
            metadata = await response.json();
          }
        } catch (ipfsError) {
          console.warn("Failed to fetch IPFS metadata:", ipfsError);
        }

        userContent.push({
          contentId: contentId,
          originalContentId: metadata?.originalContentId || contentId,
          title: metadata?.title || `Content ${i + 1}`,
          price: ethers.formatUnits(contentDetails.price, 6),
          contentType: metadata?.contentType || 'text',
          hasAccess: hasAccess,
          metadata: metadata,
          createdAt: new Date(Number(contentDetails.createdAt) * 1000).toISOString()
        });
      } catch (error) {
        console.error(`Error processing content ${contentId}:`, error);
      }
    }

    return userContent;
  } catch (error) {
    console.error("Error fetching user content:", error);
    return [];
  }
} 