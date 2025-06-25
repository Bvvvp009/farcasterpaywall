import { sdk } from '@farcaster/frame-sdk'
import { 
  checkSpecificPayment,
  checkSubscriptionStatus as indexerCheckSubscription,
  indexTransaction,
  verifyAndIndexTransaction,
  type IndexedTransaction
} from './blockchain-indexer'

export interface DecentralizedPaymentProof {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: string
  timestamp: number
  contentId?: string
  subscriptionId?: string
  signature?: string
  fid?: number
}

export interface OnChainPaymentVerification {
  isValid: boolean
  amount: string
  timestamp: number
  transactionHash: string
  blockNumber?: number
  gasUsed?: string
}

export interface FarcasterUserContext {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  address?: string
}

/**
 * Get Farcaster user context from SDK
 */
export async function getFarcasterUserContext(): Promise<FarcasterUserContext | null> {
  try {
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      return null
    }

    const context = await sdk.context
    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
      // Note: Address would need to be obtained through wallet connection
    }
  } catch (error) {
    console.error('Error getting Farcaster user context:', error)
    return null
  }
}

/**
 * Verify payment on-chain using transaction hash
 */
export async function verifyOnChainPayment(
  txHash: string,
  expectedToAddress: string,
  expectedAmount: string,
  chainId: number = 8453 // Base
): Promise<OnChainPaymentVerification> {
  try {
    // Get Ethereum provider from Farcaster SDK
    const provider = await sdk.wallet.getEthereumProvider()
    
    if (!provider) {
      throw new Error('Ethereum provider not available')
    }

    // Get transaction receipt
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash as `0x${string}`]
    })

    if (!receipt || !receipt.status) {
      return {
        isValid: false,
        amount: '0',
        timestamp: 0,
        transactionHash: txHash
      }
    }

    // Get transaction details
    const tx = await provider.request({
      method: 'eth_getTransactionByHash',
      params: [txHash as `0x${string}`]
    })

    // Verify USDC transfer (you'd need to decode the transaction data)
    // For now, we'll do basic verification
    const isValid = tx?.to?.toLowerCase() === expectedToAddress.toLowerCase()

    return {
      isValid: !!isValid,
      amount: expectedAmount, // In production, decode from transaction data
      timestamp: Math.floor(Date.now() / 1000),
      transactionHash: txHash,
      blockNumber: receipt.blockNumber ? parseInt(receipt.blockNumber, 16) : undefined,
      gasUsed: receipt.gasUsed
    }
  } catch (error) {
    console.error('Error verifying on-chain payment:', error)
    return {
      isValid: false,
      amount: '0',
      timestamp: 0,
      transactionHash: txHash
    }
  }
}

/**
 * Create a decentralized payment proof using Farcaster context
 */
export async function createDecentralizedPaymentProof(
  txHash: string,
  toAddress: string,
  amount: string,
  contentId?: string,
  subscriptionId?: string
): Promise<DecentralizedPaymentProof> {
  const userContext = await getFarcasterUserContext()
  
  const proof: DecentralizedPaymentProof = {
    txHash,
    fromAddress: '', // Would be obtained from wallet
    toAddress,
    amount,
    timestamp: Math.floor(Date.now() / 1000),
    contentId,
    subscriptionId,
    fid: userContext?.fid
  }

  // In a more advanced implementation, you could sign this proof
  // using the user's wallet or Farcaster credentials
  
  return proof
}

/**
 * Verify access using decentralized methods
 */
export async function verifyDecentralizedAccess(
  userAddress: string,
  contentId: string,
  creatorAddress: string
): Promise<{ hasAccess: boolean; proof?: DecentralizedPaymentProof }> {
  try {
    // Method 1: Check indexed on-chain transactions
    const indexedPayment = await checkSpecificPayment(
      userAddress,
      creatorAddress,
      contentId,
      '0' // We'll check for any payment amount
    )

    if (indexedPayment) {
      return { 
        hasAccess: true, 
        proof: {
          txHash: indexedPayment.txHash,
          fromAddress: indexedPayment.fromAddress,
          toAddress: indexedPayment.toAddress,
          amount: indexedPayment.amount,
          timestamp: indexedPayment.timestamp,
          contentId: indexedPayment.contentId,
          subscriptionId: indexedPayment.subscriptionId
        }
      }
    }

    // Method 2: Check subscription status
    const subscriptionPayment = await checkSubscriptionStatus(
      userAddress,
      creatorAddress
    )

    if (subscriptionPayment) {
      return { 
        hasAccess: true, 
        proof: {
          txHash: subscriptionPayment.txHash,
          fromAddress: subscriptionPayment.fromAddress,
          toAddress: subscriptionPayment.toAddress,
          amount: subscriptionPayment.amount,
          timestamp: subscriptionPayment.timestamp,
          contentId: subscriptionPayment.contentId,
          subscriptionId: subscriptionPayment.subscriptionId
        }
      }
    }

    return { hasAccess: false }
  } catch (error) {
    console.error('Error verifying decentralized access:', error)
    return { hasAccess: false }
  }
}

/**
 * Check subscription status using decentralized methods
 */
async function checkSubscriptionStatus(
  userAddress: string,
  creatorAddress: string
): Promise<IndexedTransaction | null> {
  try {
    // This would check for recurring payments or subscription contracts
    // For now, we'll use the indexer to check for recent payments
    return await indexerCheckSubscription(userAddress, creatorAddress, '0')
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return null
  }
}

/**
 * Send payment using Farcaster's native sendToken action
 */
export async function sendDecentralizedPayment(
  toAddress: string,
  amount: string,
  contentId?: string
): Promise<DecentralizedPaymentProof> {
  try {
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      throw new Error('Not in Farcaster Mini App environment')
    }

    // Get user's wallet address
    const userAddress = await getFarcasterWalletAddress()
    if (!userAddress) {
      throw new Error('No wallet address available')
    }

    // Use Farcaster's native sendToken action
    const result = await sdk.actions.sendToken({
      token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      amount: (parseFloat(amount) * 1_000_000).toString(), // Convert to USDC units
      recipientAddress: toAddress
    })

    if (!result.success || !result.send?.transaction) {
      throw new Error('Payment failed')
    }

    // Index the transaction for future verification
    await indexTransaction(
      result.send.transaction,
      userAddress,
      toAddress,
      amount,
      contentId
    )

    // Create decentralized proof
    const proof = await createDecentralizedPaymentProof(
      result.send.transaction,
      toAddress,
      amount,
      contentId
    )

    return proof
  } catch (error) {
    console.error('Error sending decentralized payment:', error)
    throw error
  }
}

/**
 * Get user's wallet address from Farcaster context
 */
export async function getFarcasterWalletAddress(): Promise<string | null> {
  try {
    const isMiniApp = await sdk.isInMiniApp()
    if (!isMiniApp) {
      return null
    }

    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      return null
    }

    const accounts = await provider.request({
      method: 'eth_accounts'
    })

    return accounts[0] || null
  } catch (error) {
    console.error('Error getting Farcaster wallet address:', error)
    return null
  }
}

/**
 * Verify payment using multiple decentralized methods
 */
export async function verifyPaymentDecentralized(
  userAddress: string,
  contentId: string,
  creatorAddress: string,
  expectedAmount: string
): Promise<{
  hasAccess: boolean
  method: 'onchain' | 'subscription' | 'none'
  proof?: DecentralizedPaymentProof
}> {
  try {
    // Method 1: Check indexed on-chain payment
    const indexedPayment = await checkSpecificPayment(
      userAddress,
      creatorAddress,
      contentId,
      expectedAmount
    )

    if (indexedPayment) {
      // Verify the transaction on-chain
      const verification = await verifyOnChainPayment(
        indexedPayment.txHash,
        creatorAddress,
        expectedAmount
      )

      if (verification.isValid) {
        return {
          hasAccess: true,
          method: 'onchain',
          proof: {
            txHash: indexedPayment.txHash,
            fromAddress: indexedPayment.fromAddress,
            toAddress: indexedPayment.toAddress,
            amount: indexedPayment.amount,
            timestamp: indexedPayment.timestamp,
            contentId: indexedPayment.contentId,
            subscriptionId: indexedPayment.subscriptionId
          }
        }
      }
    }

    // Method 2: Check subscription
    const subscriptionPayment = await checkSubscriptionStatus(
      userAddress,
      creatorAddress
    )

    if (subscriptionPayment) {
      return {
        hasAccess: true,
        method: 'subscription',
        proof: {
          txHash: subscriptionPayment.txHash,
          fromAddress: subscriptionPayment.fromAddress,
          toAddress: subscriptionPayment.toAddress,
          amount: subscriptionPayment.amount,
          timestamp: subscriptionPayment.timestamp,
          contentId: subscriptionPayment.contentId,
          subscriptionId: subscriptionPayment.subscriptionId
        }
      }
    }

    return {
      hasAccess: false,
      method: 'none'
    }
  } catch (error) {
    console.error('Error in decentralized payment verification:', error)
    return {
      hasAccess: false,
      method: 'none'
    }
  }
} 