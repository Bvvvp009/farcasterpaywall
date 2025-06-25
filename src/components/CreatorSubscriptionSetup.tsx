'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

interface CreatorSubscriptionSetupProps {
  onSuccess?: () => void
}

export function CreatorSubscriptionSetup({ onSuccess }: CreatorSubscriptionSetupProps) {
  const { address } = useAccount()
  const [monthlyFee, setMonthlyFee] = useState('5.00')
  const [description, setDescription] = useState('')
  const [benefits, setBenefits] = useState<string[]>(['Access to all premium content', 'Exclusive updates'])
  const [newBenefit, setNewBenefit] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingSubscription, setExistingSubscription] = useState<any>(null)

  useEffect(() => {
    if (address) {
      loadExistingSubscription()
    }
  }, [address])

  const loadExistingSubscription = async () => {
    if (!address) return

    try {
      const response = await fetch(`/api/subscriptions/creator?creatorAddress=${address}`)
      if (response.ok) {
        const subscription = await response.json()
        setExistingSubscription(subscription)
        setMonthlyFee(subscription.monthlyFee)
        setDescription(subscription.description)
        setBenefits(subscription.benefits)
      }
    } catch (err) {
      console.error('Error loading existing subscription:', err)
    }
  }

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit('')
    }
  }

  const removeBenefit = (index: number) => {
    setBenefits(benefits.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!address) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/subscriptions/creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorAddress: address,
          monthlyFee,
          description,
          benefits,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        onSuccess?.()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }
    } catch (err) {
      console.error('Error creating subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to create subscription')
    } finally {
      setIsLoading(false)
    }
  }

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please connect your wallet to set up your subscription</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {existingSubscription ? 'Update Your Subscription' : 'Set Up Your Subscription'}
        </h2>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              {existingSubscription ? 'Subscription updated successfully!' : 'Subscription created successfully!'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="monthlyFee" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Subscription Fee (USDC)
            </label>
            <input
              type="number"
              id="monthlyFee"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              step="0.01"
              min="0.01"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="5.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Subscription Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Describe what subscribers will get access to..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benefits & Features
            </label>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                    {benefit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeBenefit(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Add a new benefit..."
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Subscribers pay {monthlyFee} USDC monthly to access your content</li>
              <li>• You'll receive payments directly to your wallet</li>
              <li>• Subscribers get access to all your premium content for the month</li>
              <li>• You can update your subscription settings anytime</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (existingSubscription ? 'Update Subscription' : 'Create Subscription')}
          </button>
        </form>
      </div>
    </div>
  )
} 