import { sdk } from '@farcaster/frame-sdk'

export interface IndexedTransaction {
  txHash: string
  fromAddress: string
  toAddress: string
  amount: string
  blockNumber: number
  timestamp: number
  tokenAddress: string
  contentId?: string
  subscriptionId?: string
}

export interface PaymentIndex {
  [userAddress: string]: {
    [creatorAddress: string]: IndexedTransaction[]
  }
}

// In-memory index for demo purposes
// In production, this would be a proper database or use services like The Graph
const paymentIndex: PaymentIndex = {}

/**
 * Index a USDC transaction for payment tracking
 */
export async function indexTransaction(
  txHash: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  contentId?: string,
  subscriptionId?: string
): Promise<void> {
  try {
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error('Ethereum provider not available')
    }

    // Get transaction details
    const tx = await provider.request({
      method: 'eth_getTransactionByHash',
      params: [txHash as `0x${string}`]
    })

    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash as `0x${string}`]
    })

    if (!tx || !receipt || !receipt.status) {
      throw new Error('Invalid transaction')
    }

    const indexedTx: IndexedTransaction = {
      txHash,
      fromAddress: fromAddress.toLowerCase(),
      toAddress: toAddress.toLowerCase(),
      amount,
      blockNumber: parseInt(receipt.blockNumber, 16),
      timestamp: Math.floor(Date.now() / 1000), // In production, get from block
      tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
      contentId,
      subscriptionId
    }

    // Add to index
    if (!paymentIndex[fromAddress.toLowerCase()]) {
      paymentIndex[fromAddress.toLowerCase()] = {}
    }

    if (!paymentIndex[fromAddress.toLowerCase()][toAddress.toLowerCase()]) {
      paymentIndex[fromAddress.toLowerCase()][toAddress.toLowerCase()] = []
    }

    paymentIndex[fromAddress.toLowerCase()][toAddress.toLowerCase()].push(indexedTx)

    console.log('Transaction indexed:', indexedTx)
  } catch (error) {
    console.error('Error indexing transaction:', error)
    throw error
  }
}

/**
 * Query indexed transactions for payment verification
 */
export async function queryPaymentHistory(
  fromAddress: string,
  toAddress: string,
  sinceTimestamp?: number
): Promise<IndexedTransaction[]> {
  try {
    const userPayments = paymentIndex[fromAddress.toLowerCase()]
    if (!userPayments) {
      return []
    }

    const creatorPayments = userPayments[toAddress.toLowerCase()]
    if (!creatorPayments) {
      return []
    }

    if (sinceTimestamp) {
      return creatorPayments.filter(tx => tx.timestamp >= sinceTimestamp)
    }

    return creatorPayments
  } catch (error) {
    console.error('Error querying payment history:', error)
    return []
  }
}

/**
 * Check if a specific payment exists
 */
export async function checkSpecificPayment(
  fromAddress: string,
  toAddress: string,
  contentId: string,
  expectedAmount: string
): Promise<IndexedTransaction | null> {
  try {
    const payments = await queryPaymentHistory(fromAddress, toAddress)
    
    return payments.find(tx => 
      tx.contentId === contentId && 
      tx.amount === expectedAmount
    ) || null
  } catch (error) {
    console.error('Error checking specific payment:', error)
    return null
  }
}

/**
 * Check subscription status by looking for recurring payments
 */
export async function checkSubscriptionStatus(
  fromAddress: string,
  toAddress: string,
  monthlyFee: string
): Promise<IndexedTransaction | null> {
  try {
    const payments = await queryPaymentHistory(fromAddress, toAddress)
    
    // Look for recent payments matching the subscription fee
    const recentPayments = payments.filter(tx => 
      tx.amount === monthlyFee &&
      tx.timestamp >= Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60) // Last 30 days
    )

    // Return the most recent subscription payment
    return recentPayments.length > 0 ? recentPayments[recentPayments.length - 1] : null
  } catch (error) {
    console.error('Error checking subscription status:', error)
    return null
  }
}

/**
 * Get all payments for a user
 */
export async function getUserPaymentHistory(
  userAddress: string
): Promise<IndexedTransaction[]> {
  try {
    const userPayments = paymentIndex[userAddress.toLowerCase()]
    if (!userPayments) {
      return []
    }

    const allPayments: IndexedTransaction[] = []
    Object.values(userPayments).forEach(creatorPayments => {
      allPayments.push(...creatorPayments)
    })

    return allPayments.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error getting user payment history:', error)
    return []
  }
}

/**
 * Get all payments received by a creator
 */
export async function getCreatorPaymentHistory(
  creatorAddress: string
): Promise<IndexedTransaction[]> {
  try {
    const allPayments: IndexedTransaction[] = []
    
    Object.values(paymentIndex).forEach(userPayments => {
      const creatorPayments = userPayments[creatorAddress.toLowerCase()]
      if (creatorPayments) {
        allPayments.push(...creatorPayments)
      }
    })

    return allPayments.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error getting creator payment history:', error)
    return []
  }
}

/**
 * Verify transaction on-chain and index it
 */
export async function verifyAndIndexTransaction(
  txHash: string,
  expectedFromAddress: string,
  expectedToAddress: string,
  expectedAmount: string,
  contentId?: string
): Promise<IndexedTransaction> {
  try {
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error('Ethereum provider not available')
    }

    // Verify transaction on-chain
    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash as `0x${string}`]
    })

    if (!receipt || !receipt.status) {
      throw new Error('Transaction not found or failed')
    }

    // Index the verified transaction
    await indexTransaction(
      txHash,
      expectedFromAddress,
      expectedToAddress,
      expectedAmount,
      contentId
    )

    // Return the indexed transaction
    const indexedTx = await checkSpecificPayment(
      expectedFromAddress,
      expectedToAddress,
      contentId || '',
      expectedAmount
    )

    if (!indexedTx) {
      throw new Error('Failed to retrieve indexed transaction')
    }

    return indexedTx
  } catch (error) {
    console.error('Error verifying and indexing transaction:', error)
    throw error
  }
}

/**
 * Export index data (for backup or migration)
 */
export function exportPaymentIndex(): PaymentIndex {
  return JSON.parse(JSON.stringify(paymentIndex))
}

/**
 * Import index data (for backup or migration)
 */
export function importPaymentIndex(data: PaymentIndex): void {
  Object.assign(paymentIndex, data)
}

/**
 * Clear index (for testing or reset)
 */
export function clearPaymentIndex(): void {
  Object.keys(paymentIndex).forEach(key => {
    delete paymentIndex[key]
  })
} 