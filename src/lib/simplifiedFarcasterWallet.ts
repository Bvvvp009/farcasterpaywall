// Simplified Farcaster Wallet Solution
// Uses external RPC for all contract interactions + Farcaster only for auth and native payments

import { ethers } from 'ethers'

// Contract addresses
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29"
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

// External RPC for all contract interactions
const externalRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"

// ContentAccess Contract ABI
const contentAccessABI = [
  "function registerContent(bytes32 contentId, uint256 price, string ipfsCid)",
  "function checkAccess(address user, bytes32 contentId) view returns (bool)",
  "function getContent(bytes32 contentId) view returns (tuple(address creator, uint256 price, string ipfsCid, bool isActive, uint256 createdAt))",
  "function payForContent(bytes32 contentId)",
  "function showUsersUpload(address creator) view returns (bytes32[])"
]

// USDC Token ABI
const usdcABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
]

export interface WalletStatus {
  isConnected: boolean
  isMiniApp: boolean
  address?: string
  chainId?: number
}

export interface ContentRegistrationResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface PaymentResult {
  success: boolean
  txHash?: string
  error?: string
  method: 'native' | 'contract'
}

/**
 * Get Farcaster wallet status (for authentication only)
 */
export async function getFarcasterWalletStatus(): Promise<WalletStatus> {
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

    // Get Farcaster wallet info (for authentication)
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return {
        isConnected: false,
        isMiniApp: true
      }
    }

    // Get accounts and chain ID
    const accounts = await provider.request({ method: 'eth_accounts' })
    const chainId = await provider.request({ method: 'eth_chainId' })

    if (!accounts || accounts.length === 0) {
      return {
        isConnected: false,
        isMiniApp: true
      }
    }

    console.log('✅ Farcaster wallet status:', {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isMiniApp: true
    })

    return {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isMiniApp: true
    }
  } catch (error) {
    console.error('❌ Error getting Farcaster wallet status:', error)
    return {
      isConnected: false,
      isMiniApp: false
    }
  }
}

/**
 * Get user's wallet address from Farcaster (for authentication)
 */
export async function getFarcasterUserAddress(): Promise<string | null> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      return null
    }

    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return null
    }

    const accounts = await provider.request({ method: 'eth_accounts' })
    return accounts[0] || null
  } catch (error) {
    console.error('❌ Error getting Farcaster user address:', error)
    return null
  }
}

/**
 * Register content using external RPC
 */
export async function registerContent(
  contentId: string,
  price: string,
  ipfsCid: string
): Promise<ContentRegistrationResult> {
  try {
    console.log('📝 Registering content with external RPC...')
    
    // Get user's address from Farcaster for authentication
    const userAddress = await getFarcasterUserAddress()
    if (!userAddress) {
      throw new Error('No Farcaster user address available')
    }

    console.log('👤 User address:', userAddress)

    // Use external RPC for contract interactions
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    
    // For content registration, we need a signer with private key
    const creatorPrivateKey = process.env.NEXT_PUBLIC_CREATOR_PRIVATE_KEY
    if (!creatorPrivateKey) {
      throw new Error('Creator private key not configured')
    }

    const externalSigner = new ethers.Wallet(creatorPrivateKey, externalProvider)
    const contentContract = new ethers.Contract(contentAccessContract, contentAccessABI, externalSigner)

    // Convert contentId to bytes32
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    // Convert price to USDC units (6 decimals)
    const priceInUSDC = ethers.parseUnits(price, 6)

    console.log('📋 Contract details:', {
      address: contentAccessContract,
      contentId: bytes32ContentId,
      price: priceInUSDC.toString(),
      ipfsCid: ipfsCid
    })

    // Register content on contract
    console.log('⏳ Submitting content registration transaction...')
    const tx = await contentContract.registerContent(
      bytes32ContentId,
      priceInUSDC,
      ipfsCid,
      { gasLimit: 300000 }
    )

    console.log('⏳ Transaction submitted:', tx.hash)
    console.log('⏳ Waiting for confirmation...')
    
    const receipt = await tx.wait()
    console.log('✅ Content registered successfully:', receipt.hash)

    return {
      success: true,
      txHash: receipt.hash
    }
  } catch (error) {
    console.error('❌ Content registration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    }
  }
}

/**
 * Pay for content using Farcaster's native sendToken action
 */
export async function payForContentWithNativePayment(
  contentId: string,
  creatorAddress: string,
  price: string
): Promise<PaymentResult> {
  try {
    console.log('💸 Paying for content with Farcaster native payment...')
    
    const { sdk } = await import('@farcaster/frame-sdk')
    
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error("Not in Farcaster Mini App environment")
    }

    // Convert price to USDC units (6 decimals)
    const priceInUSDC = (parseFloat(price) * 1_000_000).toString()

    console.log('💰 Payment details:', {
      contentId,
      creatorAddress,
      price: price,
      priceInUSDC: priceInUSDC
    })

    // Use Farcaster's native sendToken action
    const result = await sdk.actions.sendToken({
      token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      amount: priceInUSDC,
      recipientAddress: creatorAddress
    })

    if (result.success) {
      console.log('✅ Payment successful:', result.send.transaction)
      return {
        success: true,
        txHash: result.send.transaction,
        method: 'native'
      }
    } else {
      console.log('❌ Payment failed:', result.reason)
      return {
        success: false,
        error: result.reason,
        method: 'native'
      }
    }
  } catch (error) {
    console.error('❌ Error with native payment:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
      method: 'native'
    }
  }
}

/**
 * Check content access using external RPC
 */
export async function checkContentAccess(
  contentId: string,
  userAddress: string
): Promise<boolean> {
  try {
    console.log('🔍 Checking content access with external RPC...')
    
    // Use external RPC for contract reads
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    const contentContract = new ethers.Contract(contentAccessContract, contentAccessABI, externalProvider)

    // Convert contentId to bytes32
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    const hasAccess = await contentContract.checkAccess(userAddress, bytes32ContentId)
    console.log('🔍 Access check result:', { contentId, userAddress, hasAccess })
    
    return hasAccess
  } catch (error) {
    console.error('❌ Error checking content access:', error)
    return false
  }
}

/**
 * Get content details using external RPC
 */
export async function getContentDetails(
  contentId: string
): Promise<{ price: string; creator: string; isActive: boolean; ipfsCid: string } | null> {
  try {
    console.log('📋 Getting content details with external RPC...')
    
    // Use external RPC for contract reads
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    const contentContract = new ethers.Contract(contentAccessContract, contentAccessABI, externalProvider)

    // Convert contentId to bytes32
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    const content = await contentContract.getContent(bytes32ContentId)
    
    return {
      price: ethers.formatUnits(content.price, 6),
      creator: content.creator,
      isActive: content.isActive,
      ipfsCid: content.ipfsCid
    }
  } catch (error) {
    console.error('❌ Error getting content details:', error)
    return null
  }
}

/**
 * Complete content access flow
 */
export async function accessContent(
  contentId: string
): Promise<{ success: boolean; hasAccess: boolean; error?: string; decryptedContent?: string }> {
  try {
    console.log('🎭 Starting content access flow...')
    
    // Get user's address from Farcaster
    const userAddress = await getFarcasterUserAddress()
    if (!userAddress) {
      return { success: false, hasAccess: false, error: 'No Farcaster user address available' }
    }

    console.log('👤 User address:', userAddress)

    // Check if user has access using external RPC
    const hasAccess = await checkContentAccess(contentId, userAddress)
    
    if (hasAccess) {
      console.log('✅ User has access to content')
      // Here you would decrypt the content
      return { success: true, hasAccess: true, decryptedContent: 'Decrypted content here' }
    }

    // User needs to pay - get content details
    const contentDetails = await getContentDetails(contentId)
    if (!contentDetails) {
      return { success: false, hasAccess: false, error: 'Content not found' }
    }

    console.log('💰 Payment required:', contentDetails.price, 'USDC')

    // Use Farcaster's native payment
    const paymentResult = await payForContentWithNativePayment(
      contentId,
      contentDetails.creator,
      contentDetails.price
    )

    if (!paymentResult.success) {
      return { success: false, hasAccess: false, error: paymentResult.error }
    }

    console.log('✅ Payment successful, content access granted')
    return { success: true, hasAccess: true, decryptedContent: 'Decrypted content here' }
  } catch (error) {
    console.error('❌ Error in content access:', error)
    return { success: false, hasAccess: false, error: error instanceof Error ? error.message : 'Access failed' }
  }
} 