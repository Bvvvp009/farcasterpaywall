'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  getFarcasterUserContext,
  sendDecentralizedPayment,
  verifyPaymentDecentralized,
  getFarcasterWalletAddress,
  type DecentralizedPaymentProof
} from '../lib/decentralized-payments'
import { sdk } from '@farcaster/frame-sdk'

interface DecentralizedContentAccessProps {
  contentId: string
  creatorAddress: string
  tipAmount: string
  onAccessGranted?: (proof: DecentralizedPaymentProof) => void
  onError?: (error: string) => void
}

export default function DecentralizedContentAccess({
  contentId,
  creatorAddress,
  tipAmount,
  onAccessGranted,
  onError
}: DecentralizedContentAccessProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [userContext, setUserContext] = useState<any>(null)
  const [accessMethod, setAccessMethod] = useState<'onchain' | 'subscription' | 'none'>('none')
  const [proof, setProof] = useState<DecentralizedPaymentProof | null>(null)
  
  const { address: wagmiAddress } = useAccount()

  useEffect(() => {
    const initializeDecentralizedAccess = async () => {
      try {
        // Check if we're in a Farcaster Mini App
        const miniAppCheck = await sdk.isInMiniApp()
        setIsMiniApp(miniAppCheck)

        if (miniAppCheck) {
          // Get Farcaster user context
          const context = await getFarcasterUserContext()
          setUserContext(context)

          // Get wallet address from Farcaster
          const farcasterAddress = await getFarcasterWalletAddress()
          const effectiveAddress = farcasterAddress || wagmiAddress

          if (effectiveAddress) {
            // Verify access using decentralized methods
            const verification = await verifyPaymentDecentralized(
              effectiveAddress,
              contentId,
              creatorAddress,
              tipAmount
            )

            if (verification.hasAccess) {
              setHasAccess(true)
              setAccessMethod(verification.method)
              if (verification.proof) {
                setProof(verification.proof)
                onAccessGranted?.(verification.proof)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error initializing decentralized access:', error)
        onError?.('Failed to initialize access verification')
      }
    }

    initializeDecentralizedAccess()
  }, [contentId, creatorAddress, tipAmount, wagmiAddress, onAccessGranted, onError])

  const handleDecentralizedPayment = async () => {
    setIsLoading(true)
    try {
      // Use Farcaster's native payment system
      const paymentProof = await sendDecentralizedPayment(
        creatorAddress,
        tipAmount,
        contentId
      )

      setHasAccess(true)
      setAccessMethod('onchain')
      setProof(paymentProof)
      onAccessGranted?.(paymentProof)
    } catch (error) {
      console.error('Error with decentralized payment:', error)
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComposeCast = async () => {
    try {
      // Use Farcaster's native cast composition
      await sdk.actions.composeCast({
        text: `Just unlocked exclusive content! 🎉`,
        embeds: [`${window.location.origin}/content/${contentId}`]
      })
    } catch (error) {
      console.error('Error composing cast:', error)
    }
  }

  if (hasAccess) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              ✅ Access Granted
            </h3>
            <p className="text-green-600 text-sm">
              Method: {accessMethod === 'onchain' ? 'On-chain Payment' : 'Subscription'}
            </p>
            {proof && (
              <p className="text-green-600 text-xs mt-1">
                TX: {proof.txHash.slice(0, 10)}...{proof.txHash.slice(-8)}
              </p>
            )}
          </div>
          <button
            onClick={handleComposeCast}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
          >
            Share
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-white/50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            🔒 Premium Content
          </h3>
          <p className="text-gray-600 text-sm">
            Unlock this content with {tipAmount} USDC
          </p>
        </div>
        {isMiniApp && userContext && (
          <div className="text-right">
            <p className="text-xs text-gray-500">FID: {userContext.fid}</p>
            {userContext.username && (
              <p className="text-xs text-gray-500">@{userContext.username}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isMiniApp ? (
          <button
            onClick={handleDecentralizedPayment}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Pay ${tipAmount} USDC via Farcaster`}
          </button>
        ) : (
          <div className="text-center text-gray-600">
            <p>Please open this content in a Farcaster client to make payments</p>
          </div>
        )}

        {isMiniApp && (
          <div className="text-xs text-gray-500 text-center">
            <p>✨ Using Farcaster's native payment system</p>
            <p>🔗 Transaction verified on-chain</p>
            <p>🛡️ No centralized database required</p>
          </div>
        )}
      </div>
    </div>
  )
} 