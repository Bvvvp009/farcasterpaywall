import { Buffer } from 'buffer'
import { kv } from '@vercel/kv'

// Subscription types
export interface Subscription {
  id: string
  creatorAddress: string
  subscriberAddress: string
  monthlyFee: string
  startDate: number
  endDate: number
  status: 'active' | 'expired' | 'cancelled'
  txHash: string
  lastPaymentDate: number
  nextPaymentDate: number
}

export interface CreatorSubscription {
  creatorAddress: string
  monthlyFee: string
  description: string
  benefits: string[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

// Subscription verification result
export interface SubscriptionVerification {
  hasActiveSubscription: boolean
  subscription?: Subscription
  expiresAt?: number
  daysRemaining?: number
}

// Generate subscription ID
export function generateSubscriptionId(creatorAddress: string, subscriberAddress: string): string {
  const timestamp = Date.now().toString()
  const data = `${creatorAddress}:${subscriberAddress}:${timestamp}`
  return Buffer.from(data).toString('base64').slice(0, 16)
}

// Create a new subscription
export async function createSubscription(
  creatorAddress: string,
  subscriberAddress: string,
  monthlyFee: string,
  txHash: string
): Promise<Subscription> {
  const now = Date.now()
  const oneMonthFromNow = now + (30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds
  
  const subscription: Subscription = {
    id: generateSubscriptionId(creatorAddress, subscriberAddress),
    creatorAddress: creatorAddress.toLowerCase(),
    subscriberAddress: subscriberAddress.toLowerCase(),
    monthlyFee,
    startDate: now,
    endDate: oneMonthFromNow,
    status: 'active',
    txHash,
    lastPaymentDate: now,
    nextPaymentDate: oneMonthFromNow
  }

  const subscriptionKey = `subscription:${creatorAddress.toLowerCase()}:${subscriberAddress.toLowerCase()}`
  await kv.set(subscriptionKey, subscription)

  // Also store in a list for the creator
  const creatorSubscriptionsKey = `creator_subscriptions:${creatorAddress.toLowerCase()}`
  const existingSubscriptions = await kv.get<string[]>(creatorSubscriptionsKey) || []
  existingSubscriptions.push(subscriberAddress.toLowerCase())
  await kv.set(creatorSubscriptionsKey, existingSubscriptions)

  return subscription
}

// Check if user has active subscription to a creator
export async function checkSubscription(
  creatorAddress: string,
  subscriberAddress: string
): Promise<SubscriptionVerification> {
  const subscriptionKey = `subscription:${creatorAddress.toLowerCase()}:${subscriberAddress.toLowerCase()}`
  const subscription = await kv.get<Subscription>(subscriptionKey)

  if (!subscription) {
    return { hasActiveSubscription: false }
  }

  const now = Date.now()
  const isActive = subscription.status === 'active' && subscription.endDate > now
  const daysRemaining = isActive ? Math.ceil((subscription.endDate - now) / (24 * 60 * 60 * 1000)) : 0

  return {
    hasActiveSubscription: isActive,
    subscription: isActive ? subscription : undefined,
    expiresAt: subscription.endDate,
    daysRemaining
  }
}

// Renew subscription
export async function renewSubscription(
  creatorAddress: string,
  subscriberAddress: string,
  txHash: string
): Promise<Subscription> {
  const subscriptionKey = `subscription:${creatorAddress.toLowerCase()}:${subscriberAddress.toLowerCase()}`
  const existingSubscription = await kv.get<Subscription>(subscriptionKey)

  if (!existingSubscription) {
    throw new Error('No existing subscription found')
  }

  const now = Date.now()
  const newEndDate = Math.max(existingSubscription.endDate, now) + (30 * 24 * 60 * 60 * 1000)

  const updatedSubscription: Subscription = {
    ...existingSubscription,
    endDate: newEndDate,
    status: 'active',
    txHash,
    lastPaymentDate: now,
    nextPaymentDate: newEndDate
  }

  await kv.set(subscriptionKey, updatedSubscription)
  return updatedSubscription
}

// Cancel subscription
export async function cancelSubscription(
  creatorAddress: string,
  subscriberAddress: string
): Promise<void> {
  const subscriptionKey = `subscription:${creatorAddress.toLowerCase()}:${subscriberAddress.toLowerCase()}`
  const subscription = await kv.get<Subscription>(subscriptionKey)

  if (!subscription) {
    throw new Error('No subscription found')
  }

  const updatedSubscription: Subscription = {
    ...subscription,
    status: 'cancelled'
  }

  await kv.set(subscriptionKey, updatedSubscription)
}

// Get all active subscriptions for a creator
export async function getCreatorSubscriptions(creatorAddress: string): Promise<Subscription[]> {
  const creatorSubscriptionsKey = `creator_subscriptions:${creatorAddress.toLowerCase()}`
  const subscriberAddresses = await kv.get<string[]>(creatorSubscriptionsKey) || []

  const subscriptions: Subscription[] = []
  for (const subscriberAddress of subscriberAddresses) {
    const subscriptionKey = `subscription:${creatorAddress.toLowerCase()}:${subscriberAddress}`
    const subscription = await kv.get<Subscription>(subscriptionKey)
    if (subscription && subscription.status === 'active' && subscription.endDate > Date.now()) {
      subscriptions.push(subscription)
    }
  }

  return subscriptions
}

// Get all subscriptions for a subscriber
export async function getSubscriberSubscriptions(subscriberAddress: string): Promise<Subscription[]> {
  // This is a simplified implementation - in production you'd want a more efficient query
  const pattern = `subscription:*:${subscriberAddress.toLowerCase()}`
  
  // Note: This is a simplified approach. In production, you'd want to use a proper database
  // with indexed queries for better performance
  const subscriptions: Subscription[] = []
  
  // For now, we'll return an empty array and implement proper querying later
  // This would require a different data structure or database query
  return subscriptions
}

// Create or update creator subscription settings
export async function setCreatorSubscription(
  creatorAddress: string,
  monthlyFee: string,
  description: string,
  benefits: string[]
): Promise<CreatorSubscription> {
  const now = Date.now()
  const creatorSubscription: CreatorSubscription = {
    creatorAddress: creatorAddress.toLowerCase(),
    monthlyFee,
    description,
    benefits,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }

  const creatorKey = `creator_subscription_settings:${creatorAddress.toLowerCase()}`
  await kv.set(creatorKey, creatorSubscription)

  return creatorSubscription
}

// Get creator subscription settings
export async function getCreatorSubscription(creatorAddress: string): Promise<CreatorSubscription | null> {
  const creatorKey = `creator_subscription_settings:${creatorAddress.toLowerCase()}`
  return await kv.get<CreatorSubscription>(creatorKey)
}

// Check if content should be accessible via subscription
export async function checkSubscriptionAccess(
  creatorAddress: string,
  subscriberAddress: string,
  contentId: string
): Promise<boolean> {
  const verification = await checkSubscription(creatorAddress, subscriberAddress)
  return verification.hasActiveSubscription
}

// Generate subscription payment proof (similar to existing payment proof)
export function generateSubscriptionPaymentProof(
  subscriberAddress: string,
  creatorAddress: string,
  monthlyFee: string
): string {
  const timestamp = new Date().toISOString()
  const data = `${subscriberAddress}:${creatorAddress}:${monthlyFee}:subscription:${timestamp}`
  return Buffer.from(data).toString('base64')
}

// Verify subscription payment proof
export function verifySubscriptionPaymentProof(
  proof: string,
  subscriberAddress: string,
  creatorAddress: string,
  monthlyFee: string
): boolean {
  try {
    const decoded = Buffer.from(proof, 'base64').toString()
    const parts = decoded.split(':')
    
    if (parts.length !== 5) return false
    
    const [proofSubscriber, proofCreator, proofFee, proofType, proofTimestamp] = parts
    
    return (
      proofSubscriber === subscriberAddress &&
      proofCreator === creatorAddress &&
      proofFee === monthlyFee &&
      proofType === 'subscription'
    )
  } catch {
    return false
  }
} 