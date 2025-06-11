'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { USDC_CONTRACT_ADDRESS } from '../lib/constants'
import { getUSDCBalance, checkUSDCAllowance, transferUSDC } from '../lib/usdc'
import { formatUnits } from 'viem'

// Add Farcaster Mini App SDK import
let sdk: any = null
if (typeof window !== 'undefined') {
  try {
    // Dynamically import to avoid SSR issues
    sdk = require('@farcaster/frame-sdk').sdk
  } catch {}
}

interface ContentActionsProps {
  contentCreator: string
  contentId: string
  tipAmount: string
  isPaid: boolean
  onTipSuccess?: (txHash: string) => void
  onAccessGranted?: () => void
  recipientFid?: number // Optionally support FID
}

export default function ContentActions({ 
  contentCreator, 
  contentId, 
  tipAmount, 
  isPaid,
  onTipSuccess,
  onAccessGranted,
  recipientFid
}: ContentActionsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isTipping, setIsTipping] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>('0')
  const [error, setError] = useState<string | null>(null)
  const [isMiniApp, setIsMiniApp] = useState(false)
  
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  useEffect(() => {
    const checkAccessAndBalance = async () => {
      if (!address || !publicClient) return

      try {
        // Check if user has already paid for this content using the API
        const response = await fetch('/api/payments/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            userAddress: address,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to check payment status')
        }

        const { hasPaid } = await response.json()
        if (hasPaid) {
          setHasAccess(true)
          onAccessGranted?.()
        }

        // Get USDC balance
        const balance = await getUSDCBalance(address, publicClient)
        setUsdcBalance(formatUnits(balance, 6))
      } catch (err) {
        console.error('Error checking access and balance:', err)
        setError('Failed to check access and balance')
      }
    }

    checkAccessAndBalance()
  }, [address, contentId, publicClient, onAccessGranted])

  // Detect if running in Farcaster Mini App
  useEffect(() => {
    async function detectMiniApp() {
      if (sdk && sdk.isInMiniApp) {
        try {
          const result = await sdk.isInMiniApp()
          setIsMiniApp(result)
        } catch {
          setIsMiniApp(false)
        }
      }
    }
    detectMiniApp()
  }, [])

  const handleApprove = async () => {
    if (!address || !walletClient || !publicClient) {
      setError('Wallet not connected')
      return
    }

    setIsApproving(true)
    setError(null)

    try {
      // Check current allowance
      const currentAllowance = await checkUSDCAllowance(
        address,
        USDC_CONTRACT_ADDRESS,
        publicClient
      )

      const tipAmountBigInt = BigInt(Math.ceil(parseFloat(tipAmount) * 1000000)) // Convert to USDC units

      if (currentAllowance < tipAmountBigInt) {
        // Need to approve
        const approveData = {
          address: USDC_CONTRACT_ADDRESS as `0x${string}`,
          abi: [
            {
              name: 'approve',
              type: 'function',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }]
            }
          ],
          functionName: 'approve',
          args: [contentCreator as `0x${string}`, tipAmountBigInt]
        }

        const hash = await walletClient.writeContract(approveData)
        await publicClient.waitForTransactionReceipt({ hash })
        console.log('USDC approval successful')
      }
    } catch (err) {
      console.error('Error approving USDC:', err)
      setError('Failed to approve USDC transfer')
    } finally {
      setIsApproving(false)
    }
  }

  const handleTip = async () => {
    if (isMiniApp && sdk && sdk.actions && sdk.actions.sendToken) {
      // Use Farcaster Mini App sendToken action
      setIsTipping(true)
      setError(null)
      try {
        const token = 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
        const amount = (parseFloat(tipAmount) * 1_000_000).toString() // USDC 6 decimals
        const params: any = { token, amount }
        if (recipientFid) {
          params.recipientFid = recipientFid
        } else {
          params.recipientAddress = contentCreator
        }
        const result = await sdk.actions.sendToken(params)
        if (result && result.success && result.send && result.send.transaction) {
          // Record the payment in backend
          const recordResponse = await fetch('/api/payments/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentId,
              userAddress: address,
              txHash: result.send.transaction,
              amount: tipAmount,
              timestamp: Math.floor(Date.now() / 1000),
            }),
          })
          if (!recordResponse.ok) {
            throw new Error('Failed to record payment')
          }
          setHasAccess(true)
          onAccessGranted?.()
          onTipSuccess?.(result.send.transaction)
        } else if (result && result.reason === 'rejected_by_user') {
          setError('Payment rejected by user')
        } else {
          setError('Failed to send tip')
        }
      } catch (err) {
        console.error('Error sending tip via Farcaster Mini App:', err)
        setError('Failed to send tip')
      } finally {
        setIsTipping(false)
      }
      return
    }
    // Fallback: Use current Wagmi/contract-based method
    if (!address || !walletClient || !publicClient) {
      setError('Wallet not connected')
      return
    }

    setIsTipping(true)
    setError(null)

    try {
      // Check allowance first
      const allowance = await checkUSDCAllowance(
        address,
        USDC_CONTRACT_ADDRESS,
        publicClient
      )

      const tipAmountBigInt = BigInt(Math.ceil(parseFloat(tipAmount) * 1000000)) // Convert to USDC units

      if (allowance < tipAmountBigInt) {
        await handleApprove()
      }

      // Transfer USDC
      const hash = await transferUSDC(
        contentCreator,
        tipAmount,
        publicClient,
        walletClient
      )

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      // If this is paid content, record the payment
      if (isPaid) {
        const recordResponse = await fetch('/api/payments/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            userAddress: address,
            txHash: hash,
            amount: tipAmount,
            timestamp: Math.floor(Date.now() / 1000),
          }),
        })

        if (!recordResponse.ok) {
          throw new Error('Failed to record payment')
        }

        setHasAccess(true)
        onAccessGranted?.()
      }

      onTipSuccess?.(hash)
    } catch (err) {
      console.error('Error sending tip:', err)
      setError('Failed to send tip')
    } finally {
      setIsTipping(false)
    }
  }

  if (isPaid && !hasAccess) {
    return (
      <div className="mt-4 p-4 bg-white/50 rounded-lg">
        <h3 className="text-lg font-semibold text-pink-800 mb-2">Paid Content</h3>
        <p className="text-gray-600 mb-4">
          This content requires a tip of {tipAmount} USDC to access.
        </p>
        {error && (
          <div className="text-red-500 mb-4" role="alert">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Your Balance: {usdcBalance} USDC
          </div>
          <button
            onClick={handleTip}
            disabled={isTipping || isApproving}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTipping ? 'Sending Tip...' : isApproving ? 'Approving...' : `Tip ${tipAmount} USDC`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-white/50 rounded-lg">
      <h3 className="text-lg font-semibold text-pink-800 mb-2">Support Creator</h3>
      {error && (
        <div className="text-red-500 mb-4" role="alert">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Your Balance: {usdcBalance} USDC
        </div>
        <button
          onClick={handleTip}
          disabled={isTipping || isApproving}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTipping ? 'Sending Tip...' : isApproving ? 'Approving...' : `Tip ${tipAmount} USDC`}
        </button>
      </div>
    </div>
  )
} 