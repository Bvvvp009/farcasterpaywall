'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { SubscribeToCreator } from './SubscribeToCreator'

interface SubscriptionInfoProps {
  creatorAddress: string
  onSubscriptionChange?: () => void
}

interface CreatorSubscription {
  creatorAddress: string
  monthlyFee: string
  description: string
  benefits: string[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscription?: any
  expiresAt?: number
  daysRemaining?: number
}

export function SubscriptionInfo({ creatorAddress, onSubscriptionChange }: SubscriptionInfoProps) {
  const { address } = useAccount()
  const [creatorSubscription, setCreatorSubscription] = useState<CreatorSubscription | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (creatorAddress) {
      loadSubscriptionInfo()
    }
  }, [creatorAddress])

  useEffect(() => {
    if (address && creatorAddress) {
      checkSubscriptionStatus()
    }
  }, [address, creatorAddress])

  const loadSubscriptionInfo = async () => {
    try {
      const response = await fetch(`/api/subscriptions/creator?creatorAddress=${creatorAddress}`)
      if (response.ok) {
        const subscription = await response.json()
        setCreatorSubscription(subscription)
      } else if (response.status === 404) {
        // Creator doesn't have a subscription set up
        setCreatorSubscription(null)
      }
    } catch (err) {
      console.error('Error loading creator subscription:', err)
      setError('Failed to load subscription information')
    } finally {
      setIsLoading(false)
    }
  }

  const checkSubscriptionStatus = async () => {
    if (!address) return

    try {
      const response = await fetch('/api/subscriptions/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorAddress,
          subscriberAddress: address,
        }),
      })

      if (response.ok) {
        const status = await response.json()
        setSubscriptionStatus(status)
      }
    } catch (err) {
      console.error('Error checking subscription status:', err)
    }
  }

  const handleSubscriptionChange = () => {
    checkSubscriptionStatus()
    onSubscriptionChange?.()
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!creatorSubscription) {
    return null // Don't show anything if creator doesn't have a subscription
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Creator Subscription</h3>
        {subscriptionStatus?.hasActiveSubscription && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Monthly Fee</p>
          <p className="text-2xl font-bold text-gray-900">{creatorSubscription.monthlyFee} USDC</p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Description</p>
          <p className="text-gray-900">{creatorSubscription.description}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Benefits</p>
          <ul className="space-y-1">
            {creatorSubscription.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-900 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {subscriptionStatus?.hasActiveSubscription && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              <strong>Your Subscription</strong>
              {subscriptionStatus.daysRemaining && (
                <span className="block mt-1">
                  Expires in {subscriptionStatus.daysRemaining} days
                </span>
              )}
            </p>
          </div>
        )}

        <SubscribeToCreator 
          creatorAddress={creatorAddress} 
          onSuccess={handleSubscriptionChange}
        />
      </div>
    </div>
  )
} 