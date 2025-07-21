import { ethers } from 'ethers'
import { autoDecryptContent, AutoDecryptResult } from './autoDecrypt'

// Contract addresses - Use environment variables for mainnet
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29";
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

// ContentAccess Contract ABI (simplified for Farcaster integration)
const contentAccessABI = [
  "function checkAccess(address user, bytes32 contentId) view returns (bool)",
  "function getContent(bytes32 contentId) view returns (tuple(address creator, uint256 price, string ipfsCid, bool isActive, uint256 createdAt))",
  "function payForContent(bytes32 contentId)",
  "function showUsersUpload(address creator) view returns (bytes32[])"
]

// USDC Token ABI (simplified)
const usdcABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
]

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  address: string
}

export interface FarcasterContentResult {
  success: boolean
  hasAccess?: boolean
  decryptedContent?: string
  needsPayment?: boolean
  price?: string
  txHash?: string
  error?: string
}

export async function getFarcasterUser(): Promise<FarcasterUser | null> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const context = await sdk.context
    
    if (!context.user) {
      return null
    }

    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return null
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const address = await signer.getAddress()

    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
      address: address
    }
  } catch (error) {
    console.error('Error getting Farcaster user:', error)
    return null
  }
}

export async function getFarcasterWalletAddress(): Promise<string | null> {
  try {
    const user = await getFarcasterUser()
    return user?.address || null
  } catch (error) {
    console.error('Error getting Farcaster wallet address:', error)
    return null
  }
}

export async function payForContentWithFarcasterWallet(contentId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const provider = await sdk.wallet.getEthereumProvider()
    
    if (!provider) {
      throw new Error("No Ethereum provider available")
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const userAddress = await signer.getAddress()

    // Get content price from contract
    const contentAccessContractInstance = new ethers.Contract(contentAccessContract, contentAccessABI, signer)
    const usdcContract = new ethers.Contract(usdcTokenAddress, usdcABI, signer)

    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    const content = await contentAccessContractInstance.getContent(bytes32ContentId)
    const priceInUSDC = content.price

    // Check USDC balance
    const balance = await usdcContract.balanceOf(userAddress)
    if (balance < priceInUSDC) {
      throw new Error(`Insufficient USDC balance. Required: ${ethers.formatUnits(priceInUSDC, 6)}, Available: ${ethers.formatUnits(balance, 6)}`)
    }

    // Approve USDC spending
    const approveTx = await usdcContract.approve(contentAccessContract, priceInUSDC)
    await approveTx.wait()

    // Pay for content
    const payTx = await contentAccessContractInstance.payForContent(bytes32ContentId)
    const receipt = await payTx.wait()

    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('Payment with Farcaster wallet failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

export async function checkContentAccess(contentId: string): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const provider = await sdk.wallet.getEthereumProvider()
    
    if (!provider) {
      return false
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const userAddress = await signer.getAddress()

    const contentAccessContractInstance = new ethers.Contract(contentAccessContract, contentAccessABI, signer)

    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    return await contentAccessContractInstance.checkAccess(userAddress, bytes32ContentId)
  } catch (error) {
    console.error('Error checking content access:', error)
    return false
  }
}

export async function getContentDetails(contentId: string): Promise<any> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const provider = await sdk.wallet.getEthereumProvider()
    
    if (!provider) {
      return null
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()

    const contentAccessContractInstance = new ethers.Contract(contentAccessContract, contentAccessABI, signer)

    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    const content = await contentAccessContractInstance.getContent(bytes32ContentId)
    
    return {
      creator: content.creator,
      price: ethers.formatUnits(content.price, 6),
      ipfsCid: content.ipfsCid,
      isActive: content.isActive,
      createdAt: new Date(Number(content.createdAt) * 1000).toISOString()
    }
  } catch (error) {
    console.error('Error getting content details:', error)
    return null
  }
}

export async function initializeFarcasterApp(): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    const isMiniApp = await sdk.isInMiniApp()
    return isMiniApp
  } catch (error) {
    console.error('Error initializing Farcaster app:', error)
    return false
  }
}

export async function accessContentWithFarcaster(
  contentId: string
): Promise<FarcasterContentResult> {
  try {
    const user = await getFarcasterUser()
    if (!user?.address) {
      return { success: false, error: "No Farcaster user found" }
    }

    console.log("🎭 Farcaster content access flow for:", contentId)
    console.log("👤 User:", user.displayName || user.username, "(", user.address, ")")

    const autoDecryptResult = await autoDecryptContent(contentId, user.address)
    
    if (autoDecryptResult.success) {
      return {
        success: true,
        hasAccess: true,
        decryptedContent: autoDecryptResult.decryptedContent
      }
    }

    if (autoDecryptResult.needsPayment) {
      console.log("💰 Payment required:", autoDecryptResult.price, "USDC")
      const paymentResult = await payForContentWithFarcasterWallet(contentId)
      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error }
      }
      console.log("✅ Payment successful:", paymentResult.txHash)
      
      const finalDecryptResult = await autoDecryptContent(contentId, user.address)
      if (finalDecryptResult.success) {
        return {
          success: true,
          hasAccess: true,
          decryptedContent: finalDecryptResult.decryptedContent
        }
      } else {
        return { success: false, error: finalDecryptResult.error }
      }
    }

    return { success: false, hasAccess: false, error: autoDecryptResult.error }
  } catch (error) {
    console.error('Farcaster content access failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
} 