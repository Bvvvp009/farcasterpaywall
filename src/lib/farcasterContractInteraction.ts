// Farcaster Contract Interaction - Using only supported methods
// Based on Farcaster wallet limitations and supported methods

import { ethers } from 'ethers'

// Contract addresses
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29"

// ContentAccess Contract ABI (simplified for Farcaster compatibility)
const contentAccessABI = [
  "function registerContent(bytes32 contentId, uint256 price, string ipfsCid)",
  "function checkAccess(address user, bytes32 contentId) view returns (bool)",
  "function getContent(bytes32 contentId) view returns (tuple(address creator, uint256 price, string ipfsCid, bool isActive, uint256 createdAt))"
]

export interface ContractResult {
  success: boolean
  txHash?: string
  error?: string
}

/**
 * Register content using Farcaster wallet with raw transaction
 * This avoids eth_estimateGas and eth_call limitations
 */
export async function registerContentWithFarcasterWallet(
  contentId: string,
  price: string,
  ipfsCid: string
): Promise<ContractResult> {
  try {
    console.log('📝 Registering content with Farcaster wallet (raw transaction)...')
    
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error('Not in Farcaster Mini App environment')
    }

    // Get Farcaster wallet provider
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error('No Ethereum provider available')
    }

    // Get user's address
    const accounts = await provider.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available')
    }

    const userAddress = accounts[0]
    console.log('👤 User address:', userAddress)

    // Convert contentId to bytes32
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    // Convert price to USDC units (6 decimals)
    const priceInUSDC = ethers.parseUnits(price, 6)

    // Create ethers provider from Farcaster provider
    const ethersProvider = new ethers.BrowserProvider(provider)
    
    // Create contract instance with ethers provider
    const contract = new ethers.Contract(contentAccessContract, contentAccessABI, ethersProvider)

    // Encode the function call data
    const functionData = contract.interface.encodeFunctionData('registerContent', [
      bytes32ContentId,
      priceInUSDC,
      ipfsCid
    ])

    console.log('📋 Transaction details:', {
      to: contentAccessContract,
      data: functionData,
      from: userAddress,
      gas: '0x493e0' // 300000 in hex
    })

    // Send transaction using Farcaster wallet
    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        to: contentAccessContract as `0x${string}`,
        data: functionData as `0x${string}`,
        from: userAddress as `0x${string}`,
        gas: '0x493e0' // 300000 in hex
      }]
    })

    console.log('⏳ Transaction submitted:', txHash)
    console.log('✅ Content registration transaction sent successfully')

    return {
      success: true,
      txHash: txHash
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
 * Check content access using external RPC (since Farcaster wallet doesn't support eth_call)
 */
export async function checkContentAccessWithExternalRPC(
  contentId: string,
  userAddress: string
): Promise<boolean> {
  try {
    console.log('🔍 Checking content access with external RPC...')
    
    // Use external RPC for contract reads (since Farcaster wallet doesn't support eth_call)
    const externalRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
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
export async function getContentDetailsWithExternalRPC(
  contentId: string
): Promise<{ price: string; creator: string; isActive: boolean; ipfsCid: string } | null> {
  try {
    console.log('📋 Getting content details with external RPC...')
    
    // Use external RPC for contract reads
    const externalRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
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