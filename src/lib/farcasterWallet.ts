import { ethers } from 'ethers'
import { decryptContent } from './payAndDecrypt'

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
  bio?: string
  followers?: number
  following?: number
  verifications?: string[]
}

export interface WalletConnectionStatus {
  isConnected: boolean
  isMiniApp: boolean
  address?: string
  chainId?: number
}

export interface FarcasterContentResult {
  success: boolean
  hasAccess?: boolean
  decryptedContent?: string
  error?: string
}

/**
 * Initialize Farcaster Mini App and get user profile
 */
export async function initializeFarcasterApp(): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      console.log('❌ Not in Farcaster Mini App environment')
      return false
    }

    // Hide the splash screen
    await sdk.actions.ready()
    console.log('✅ Farcaster Mini App initialized')

    return true
  } catch (error) {
    console.error('❌ Error initializing Farcaster app:', error)
    return false
  }
}

/**
 * Sign in user with Farcaster (SIWF)
 */
export async function signInWithFarcaster(nonce: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('🔐 Requesting Farcaster sign-in...')
    const result = await sdk.actions.signIn({ 
      nonce,
      acceptAuthAddress: true
    })

    console.log('✅ Farcaster sign-in result:', result)
    return { success: true }
  } catch (error) {
    console.error('❌ Error during Farcaster sign-in:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Sign-in failed' }
  }
}

/**
 * Get Farcaster user information from context with enhanced profile data
 */
export async function getFarcasterUser(): Promise<FarcasterUser | null> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      console.log('❌ Not in Farcaster Mini App environment')
      return null
    }

    const context = await sdk.context
    
    if (!context.user) {
      console.log('❌ No user context available')
      return null
    }

    // Get wallet address from Ethereum provider
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      console.log('❌ No Ethereum provider available')
      return null
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const address = await signer.getAddress()

    console.log('✅ Farcaster user context retrieved:', {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      address: address
    })

    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
      address: address
    }
  } catch (error) {
    console.error('❌ Error getting Farcaster user:', error)
    return null
  }
}

/**
 * Get Farcaster wallet address
 */
export async function getFarcasterWalletAddress(): Promise<string | null> {
  try {
    const user = await getFarcasterUser()
    return user?.address || null
  } catch (error) {
    console.error('❌ Error getting Farcaster wallet address:', error)
    return null
  }
}

/**
 * Check wallet connection status with enhanced details
 */
export async function getWalletConnectionStatus(): Promise<WalletConnectionStatus> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    
    if (!isMiniApp) {
      return {
        isConnected: false,
        isMiniApp: false
      }
    }

    // Get Ethereum provider
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return {
        isConnected: false,
        isMiniApp: true
      }
    }

    // Get accounts
    const accounts = await provider.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      return {
        isConnected: false,
        isMiniApp: true
      }
    }

    // Get chain ID
    const chainId = await provider.request({ method: 'eth_chainId' })

    console.log('✅ Wallet connection status:', {
      isConnected: true,
      address: accounts[0],
      chainId: chainId,
      isMiniApp: true
    })

    return {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isMiniApp: true
    }
  } catch (error) {
    console.error('❌ Error checking wallet connection status:', error)
    return {
      isConnected: false,
      isMiniApp: false
    }
  }
}

/**
 * Send USDC payment using Farcaster's native sendToken action
 */
export async function sendUSDCWithFarcaster(
  recipientAddress: string,
  amount: string,
  description?: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    console.log('💸 Sending USDC via Farcaster:', { recipientAddress, amount })

    // Use Farcaster's native sendToken action
    const result = await sdk.actions.sendToken({
      token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      amount: (parseFloat(amount) * 1_000_000).toString(), // Convert to USDC units
      recipientAddress: recipientAddress
    })

    if (result.success && result.send?.transaction) {
      console.log('✅ USDC sent successfully:', result.send.transaction)
      return { 
        success: true, 
        txHash: result.send.transaction 
      }
    } else {
      console.log('❌ USDC send failed')
      return { 
        success: false, 
        error: 'Payment failed' 
      }
    }
  } catch (error) {
    console.error('❌ Error sending USDC:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment failed' 
    }
  }
}

/**
 * Pay for content using Farcaster wallet with proper confirmation handling
 */
export async function payForContentWithFarcasterWallet(contentId: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🚀 Starting Farcaster wallet payment for content:', contentId)
    
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    // Get wallet connection status
    const walletStatus = await getWalletConnectionStatus()
    if (!walletStatus.isConnected || !walletStatus.address) {
      throw new Error("Wallet not connected. Please ensure you are in the Farcaster Mini App.")
    }

    console.log('✅ Wallet connected:', walletStatus.address)

    // Get Ethereum provider
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error("No Ethereum provider available")
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const signer = await ethersProvider.getSigner()
    const userAddress = await signer.getAddress()

    console.log('👤 User address:', userAddress)

    // Get content price from contract
    const contentAccessContractInstance = new ethers.Contract(contentAccessContract, contentAccessABI, signer)
    const usdcContract = new ethers.Contract(usdcTokenAddress, usdcABI, signer)

    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    console.log('🆔 Content ID:', bytes32ContentId)

    // Check if user already has access
    console.log('🔍 Checking if user already has access...')
    const hasAccess = await contentAccessContractInstance.checkAccess(userAddress, bytes32ContentId)
    if (hasAccess) {
      console.log('✅ User already has access to this content')
      return { success: true, error: "User already has access to this content" }
    }

    // Get content details
    console.log('📋 Getting content details...')
    const contentDetails = await contentAccessContractInstance.getContent(bytes32ContentId)
    const priceInUSDC = contentDetails.price
    const priceInUSDCFormatted = ethers.formatUnits(priceInUSDC, 6)

    console.log('💰 Content price:', priceInUSDCFormatted, 'USDC')

    // Check USDC balance
    console.log('💵 Checking USDC balance...')
    const usdcBalance = await usdcContract.balanceOf(userAddress)
    const balanceInUSDC = ethers.formatUnits(usdcBalance, 6)
    
    console.log('💵 User USDC balance:', balanceInUSDC, 'USDC')

    if (usdcBalance < priceInUSDC) {
      const requiredInUSDC = ethers.formatUnits(priceInUSDC, 6)
      throw new Error(`Insufficient USDC balance. Required: ${requiredInUSDC}, Available: ${balanceInUSDC}`)
    }

    // Check current allowance
    console.log('🔐 Checking current USDC allowance...')
    const currentAllowance = await usdcContract.allowance(userAddress, contentAccessContract)
    
    if (currentAllowance < priceInUSDC) {
      console.log('🔐 Approving USDC spending...')
      console.log('⏳ Waiting for user to approve USDC spending...')
      
      const approveTx = await usdcContract.approve(contentAccessContract, priceInUSDC)
      console.log('⏳ USDC approval transaction submitted:', approveTx.hash)
      
      console.log('⏳ Waiting for USDC approval confirmation...')
      const approveReceipt = await approveTx.wait()
      console.log('✅ USDC approval confirmed:', approveReceipt.hash)
    } else {
      console.log('✅ Sufficient USDC allowance already exists')
    }

    // Pay for content
    console.log('💸 Processing payment for content...')
    console.log('⏳ Waiting for user to confirm payment...')
    
    const payTx = await contentAccessContractInstance.payForContent(bytes32ContentId)
    console.log('⏳ Payment transaction submitted:', payTx.hash)
    
    console.log('⏳ Waiting for payment confirmation...')
    const payReceipt = await payTx.wait()
    console.log('✅ Payment confirmed:', payReceipt.hash)

    // Verify access was granted
    console.log('🔍 Verifying access was granted...')
    const accessGranted = await contentAccessContractInstance.checkAccess(userAddress, bytes32ContentId)
    
    if (!accessGranted) {
      throw new Error('Payment successful but access was not granted')
    }

    console.log('✅ Access verified successfully')

    return { 
      success: true, 
      txHash: payReceipt.hash 
    }
  } catch (error) {
    console.error('❌ Payment failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Payment failed' 
    }
  }
}

/**
 * Check if user has access to specific content
 */
export async function checkContentAccess(contentId: string): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      console.log('❌ Not in Farcaster Mini App environment')
      return false
    }

    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      console.log('❌ No Ethereum provider available')
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

    const hasAccess = await contentAccessContractInstance.checkAccess(userAddress, bytes32ContentId)
    console.log('🔍 Content access check:', { contentId, hasAccess })
    return hasAccess
  } catch (error) {
    console.error('❌ Error checking content access:', error)
    return false
  }
}

/**
 * Get content details from smart contract
 */
export async function getContentDetails(contentId: string): Promise<{ price: string; creator: string; isActive: boolean } | null> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      console.log('❌ Not in Farcaster Mini App environment')
      return null
    }

    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      console.log('❌ No Ethereum provider available')
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
      price: ethers.formatUnits(content.price, 6),
      creator: content.creator,
      isActive: content.isActive
    }
  } catch (error) {
    console.error('❌ Error getting content details:', error)
    return null
  }
}

/**
 * Access content with Farcaster wallet - complete flow
 */
export async function accessContentWithFarcaster(
  contentId: string
): Promise<FarcasterContentResult> {
  try {
    console.log('🎭 Starting Farcaster content access flow for:', contentId)
    
    const user = await getFarcasterUser()
    if (!user?.address) {
      return { success: false, error: "No Farcaster user found" }
    }

    console.log("👤 User:", user.displayName || user.username, "(", user.address, ")")

    // Check if user has access
    const hasAccess = await checkContentAccess(contentId)
    
    if (hasAccess) {
      console.log('✅ User has access, proceeding to decrypt...')
      try {
        // Get content metadata from IPFS (this would be fetched from the contract in real implementation)
        // For now, we'll use placeholder data
        const mockContent = {
          ciphertext: 'sample_ciphertext',
          dataToEncryptHash: 'sample_data_hash'
        }
        
        const decryptedContent = await decryptContent(
          mockContent.ciphertext,
          mockContent.dataToEncryptHash,
          contentId
        )
        
        return {
          success: true,
          hasAccess: true,
          decryptedContent: decryptedContent
        }
      } catch (decryptError) {
        console.error('❌ Decryption failed:', decryptError)
        return { success: false, error: 'Failed to decrypt content' }
      }
    }

    // User needs to pay
    console.log('💰 User needs to pay for content access')
    const contentDetails = await getContentDetails(contentId)
    if (!contentDetails) {
      return { success: false, error: 'Content not found' }
    }

    console.log("💰 Payment required:", contentDetails.price, "USDC")
    const paymentResult = await payForContentWithFarcasterWallet(contentId)
    
    if (!paymentResult.success) {
      return { success: false, error: paymentResult.error }
    }

    // After successful payment, decrypt content
    try {
      console.log('🔓 Decrypting content after payment...')
      const mockContent = {
        ciphertext: 'sample_ciphertext',
        dataToEncryptHash: 'sample_data_hash'
      }
      
      const decryptedContent = await decryptContent(
        mockContent.ciphertext,
        mockContent.dataToEncryptHash,
        contentId
      )
      
      return {
        success: true,
        hasAccess: true,
        decryptedContent: decryptedContent
      }
    } catch (decryptError) {
      console.error('❌ Decryption failed after payment:', decryptError)
      return { success: false, error: 'Payment successful but failed to decrypt content' }
    }
  } catch (error) {
    console.error('❌ Error in content access flow:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Content access failed' }
  }
} 