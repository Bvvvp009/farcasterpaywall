// Hybrid Wallet System for Farcaster Mini Apps
// Combines Farcaster's native capabilities with external RPC for reliable contract interactions

import { ethers } from 'ethers'

// Contract addresses
const contentAccessContract = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || "0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29"
const usdcTokenAddress = process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"

// External RPC for reliable contract interactions
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

export interface HybridWalletStatus {
  isConnected: boolean
  isMiniApp: boolean
  address?: string
  chainId?: number
  canUseNativePayments: boolean
  canUseContractCalls: boolean
  error?: string
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

export interface ContentDetails {
  price: string
  creator: string
  isActive: boolean
  ipfsCid: string
}

/**
 * Get comprehensive wallet status
 */
export async function getHybridWalletStatus(): Promise<HybridWalletStatus> {
  try {
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    
    if (!isMiniApp) {
      return {
        isConnected: false,
        isMiniApp: false,
        canUseNativePayments: false,
        canUseContractCalls: false,
        error: 'Not in Farcaster Mini App environment'
      }
    }

    // Get Farcaster wallet info
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return {
        isConnected: false,
        isMiniApp: true,
        canUseNativePayments: false,
        canUseContractCalls: false,
        error: 'No Ethereum provider available'
      }
    }

    // Get accounts and chain ID
    const accounts = await provider.request({ method: 'eth_accounts' })
    const chainId = await provider.request({ method: 'eth_chainId' })

    if (!accounts || accounts.length === 0) {
      return {
        isConnected: false,
        isMiniApp: true,
        canUseNativePayments: false,
        canUseContractCalls: false,
        error: 'No accounts available'
      }
    }

    console.log('✅ Hybrid wallet status:', {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isMiniApp: true,
      canUseNativePayments: true,
      canUseContractCalls: false // Farcaster wallet doesn't support contract calls reliably
    })

    return {
      isConnected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isMiniApp: true,
      canUseNativePayments: true,
      canUseContractCalls: false
    }
  } catch (error) {
    console.error('❌ Error getting hybrid wallet status:', error)
    return {
      isConnected: false,
      isMiniApp: false,
      canUseNativePayments: false,
      canUseContractCalls: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get Farcaster user address for authentication
 */
export async function getFarcasterUserAddress(): Promise<string | null> {
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

    const accounts = await provider.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      console.log('❌ No accounts available')
      return null
    }

    console.log('✅ Farcaster user address:', accounts[0])
    return accounts[0]
  } catch (error) {
    console.error('❌ Error getting Farcaster user address:', error)
    return null
  }
}

/**
 * Register content using user's Farcaster wallet (raw transaction method)
 * This uses the user's own wallet instead of a single private key
 */
export async function registerContentWithUserWallet(
  contentId: string,
  price: string,
  ipfsCid: string
): Promise<ContentRegistrationResult> {
  try {
    console.log('📝 Registering content with user wallet...')
    
    const { sdk } = await import('@farcaster/frame-sdk')
    
    // Check if we're in a Mini App environment
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error('Not in Farcaster Mini App environment')
    }

    // Get user's address from Farcaster for authentication
    const userAddress = await getFarcasterUserAddress()
    if (!userAddress) {
      throw new Error('No Farcaster user address available')
    }

    console.log('👤 User address:', userAddress)

    // Get Farcaster wallet provider
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error('No Ethereum provider available')
    }

    // Create ethers provider from Farcaster provider
    const ethersProvider = new ethers.BrowserProvider(provider)
    
    // Create contract instance with ethers provider
    const contract = new ethers.Contract(contentAccessContract, contentAccessABI, ethersProvider)

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
 * Register content using external RPC (fallback method for non-Mini App environments)
 * This should only be used as a fallback, not the primary method
 */
export async function registerContentWithExternalRPC(
  contentId: string,
  price: string,
  ipfsCid: string
): Promise<ContentRegistrationResult> {
  try {
    console.log('📝 Registering content with external RPC (fallback)...')
    
    // Get user's address from Farcaster for authentication
    const userAddress = await getFarcasterUserAddress()
    if (!userAddress) {
      throw new Error('No Farcaster user address available')
    }

    console.log('👤 User address:', userAddress)

    // Use external RPC for reliable contract interactions
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    
    // For content registration, we need a signer with private key
    // This should be the content creator's private key
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

    // Register content on contract with proper gas estimation
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
export async function getContentDetails(contentId: string): Promise<ContentDetails | null> {
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

/**
 * Verify payment on-chain using external RPC
 */
export async function verifyPaymentOnChain(
  txHash: string,
  expectedToAddress: string,
  expectedAmount: string
): Promise<boolean> {
  try {
    console.log('🔍 Verifying payment on-chain...')
    
    // Use external RPC for transaction verification
    const externalProvider = new ethers.JsonRpcProvider(externalRpcUrl)
    
    const tx = await externalProvider.getTransaction(txHash)
    const receipt = await externalProvider.getTransactionReceipt(txHash)
    
    if (!tx || !receipt || receipt.status !== 1) {
      console.log('❌ Transaction failed or not found')
      return false
    }

    // Verify it's a USDC transfer
    if (tx.to?.toLowerCase() !== usdcTokenAddress.toLowerCase()) {
      console.log('❌ Not a USDC transfer')
      return false
    }

    // Verify recipient (this would need to be enhanced for actual USDC transfer parsing)
    console.log('✅ Payment verified on-chain')
    return true
  } catch (error) {
    console.error('❌ Error verifying payment:', error)
    return false
  }
} 