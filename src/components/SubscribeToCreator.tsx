'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { sdk } from '@farcaster/frame-sdk'

interface SubscribeToCreatorProps {
  creatorFid: number
  creatorUsername?: string
  creatorDisplayName?: string
  monthlyFee: string
  description?: string
  benefits?: string[]
  onSubscriptionSuccess?: (subscriptionId: string) => void
  onError?: (error: string) => void
}

export default function SubscribeToCreator({
  creatorFid,
  creatorUsername,
  creatorDisplayName,
  monthlyFee,
  description = "Access to all premium content",
  benefits = ["Exclusive posts", "Early access", "Direct messages"],
  onSubscriptionSuccess,
  onError
}: SubscribeToCreatorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)
  const [isMiniApp, setIsMiniApp] = useState(false)
  const { address } = useAccount()

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      try {
        const isMiniAppCheck = await sdk.isInMiniApp()
        setIsMiniApp(isMiniAppCheck)

        if (isMiniAppCheck) {
          const context = await sdk.context
          const userFid = context.user.fid

          // Check if user already has a subscription
          const response = await fetch('/api/subscriptions/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscriberFid: userFid,
              creatorFid: creatorFid,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.hasSubscription) {
              setHasSubscription(true)
              setSubscriptionDetails(data.subscription)
            }
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
      }
    }

    checkSubscriptionStatus()
  }, [creatorFid])

  const handleSubscribe = async () => {
    if (!isMiniApp) {
      onError?.('Please open this in a Farcaster client to subscribe')
      return
    }

    setIsLoading(true)
    try {
      const context = await sdk.context
      const userFid = context.user.fid

      // Use Farcaster's native payment system
      const result = await sdk.actions.sendToken({
        token: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
        amount: (parseFloat(monthlyFee) * 1_000_000).toString(), // Convert to USDC units
        recipientFid: creatorFid // Send to creator's FID
      })

      if (result.success && result.send?.transaction) {
        // Record the subscription
        const subscriptionResponse = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriberFid: userFid,
            creatorFid: creatorFid,
            monthlyFee: monthlyFee,
            txHash: result.send.transaction,
          }),
        })

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json()
          setHasSubscription(true)
          setSubscriptionDetails(subscriptionData.subscription)
          onSubscriptionSuccess?.(subscriptionData.subscription.id)
        } else {
          throw new Error('Failed to record subscription')
        }
      } else {
        throw new Error('Payment failed')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      onError?.(error instanceof Error ? error.message : 'Subscription failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionDetails?.id) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionDetails.id,
        }),
      })

      if (response.ok) {
        setHasSubscription(false)
        setSubscriptionDetails(null)
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (hasSubscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              ✅ Subscribed to {creatorDisplayName || `@${creatorUsername}`}
            </h3>
            <p className="text-green-600 text-sm">
              {monthlyFee} USDC/month • Active until {subscriptionDetails?.endDate ? new Date(subscriptionDetails.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <button
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Cancelling...' : 'Cancel'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Your Benefits:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💎</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Subscribe to {creatorDisplayName || `@${creatorUsername}`}
        </h3>
        <p className="text-gray-600 mb-4">{description}</p>
        
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {monthlyFee} USDC
        </div>
        <p className="text-sm text-gray-500">per month</p>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">What you'll get:</h4>
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <span className="text-purple-500 mr-2">✨</span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      {isMiniApp ? (
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : `Subscribe for ${monthlyFee} USDC/month`}
        </button>
      ) : (
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 text-sm">
            💡 Open this in a Farcaster client to subscribe
          </p>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Powered by Farcaster • Cancel anytime
        </p>
      </div>
    </div>
  )
} 