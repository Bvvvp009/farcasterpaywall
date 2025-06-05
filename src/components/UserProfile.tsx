'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getIPFSGatewayURL } from '../lib/ipfs'
import { getFarcasterProfileByAddress, isValidEthereumAddress, type FarcasterProfile } from '@/lib/farcaster'
import { sdk } from '@farcaster/frame-sdk'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ContentActions from './ContentActions'

type ContentMetadata = {
  contentCid: string
  title: string
  description: string
  createdAt: string
  accessType: 'free' | 'paid'
  tipAmount?: number
  revenue?: {
    totalTips: number
    netAmount: number
  }
  id: string
  price: number
}

type UserProfileProps = {
  address: string
}

export function UserProfile({ address: propAddress }: UserProfileProps) {
  const [userContent, setUserContent] = useState<ContentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<FarcasterProfile | null>(null)
  const [effectiveAddress, setEffectiveAddress] = useState<string | null>(null)
  const { address: wagmiAddress } = useAccount()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if we're in a Farcaster Mini App
        const isMiniApp = await sdk.isInMiniApp()
        
        // Determine which address to use
        let addressToUse = propAddress

        if (isMiniApp) {
          // If we're in a Mini App, try to get the address from the SDK context
          const context = await sdk.context
          if (context?.user?.fid) {
            // For now, we'll use the FID to identify the user
            // In a production app, you would want to map FID to address
            addressToUse = `0x${context.user.fid.toString(16).padStart(40, '0')}`
          }
        }

        // If no address from props or SDK, try Wagmi
        if (!addressToUse && wagmiAddress) {
          addressToUse = wagmiAddress
        }

        if (!addressToUse) {
          throw new Error('No address available. Please connect your wallet.')
        }

        if (!isValidEthereumAddress(addressToUse)) {
          throw new Error('Invalid Ethereum address')
        }

        setEffectiveAddress(addressToUse)

        // Fetch Farcaster profile data
        const farcasterProfile = await getFarcasterProfileByAddress(addressToUse)
        setProfile(farcasterProfile)

        // Fetch user content from API
        const response = await fetch(`/api/content?creator=${addressToUse}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user content')
        }
        const content = await response.json()
        setUserContent(content)

        // Hide splash screen if we're in a Mini App
        if (isMiniApp) {
          await sdk.actions.ready()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [propAddress, wagmiAddress])

  const handleBack = async () => {
    try {
      // Check if we're in a Mini App
      const isMiniApp = await sdk.isInMiniApp()
      
      // If we're in a Mini App, use router to navigate
      if (isMiniApp) {
        // Check if we can go back in history
        if (window.history.length > 1) {
          router.back()
        } else {
          // If no history, go to home
          router.push('/')
        }
      } else {
        // For regular web app, use standard navigation
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error handling back navigation:', error)
      // Fallback to home on error
      router.push('/')
    }
  }

  const isOwnProfile = wagmiAddress?.toLowerCase() === effectiveAddress?.toLowerCase()

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-700 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4" role="alert">
          {error}
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-pink-600 hover:text-pink-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-pink-600 hover:text-pink-700 transition-colors"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white/50 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center overflow-hidden">
            {profile?.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.displayName || 'Profile'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-pink-600">
                {effectiveAddress?.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">
              {profile?.displayName || (isOwnProfile ? 'Your Profile' : 'Creator Profile')}
            </h1>
            {profile?.bio && (
              <p className="text-gray-600 mt-1">{profile.bio}</p>
            )}
            <p className="text-gray-600 font-mono text-sm mt-1">
              {effectiveAddress}
            </p>
            {profile?.verifications && profile.verifications.length > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                {profile.verifications.map((verification, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    ✓ Verified
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <Link
            href="/create"
            className="inline-block bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Create New Content
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-pink-800">
          {isOwnProfile ? 'Your Content' : 'Creator Content'}
        </h2>

        {userContent.length === 0 ? (
          <div className="text-center p-8 bg-white/50 rounded-lg">
            <p className="text-gray-600">
              {isOwnProfile 
                ? "You haven't created any content yet. Start by creating your first piece!"
                : "This creator hasn't published any content yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userContent.map((content) => (
              <div key={content.id} className="bg-white rounded-lg shadow-md p-6 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
                    <p className="text-gray-600 mb-4">{content.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{content.accessType === 'free' ? 'Free' : 'Paid'}</span>
                      {content.accessType === 'paid' && (
                        <span>• {content.price} USDC</span>
                      )}
                    </div>
                  </div>
                  {content.accessType === 'paid' && effectiveAddress && (
                    <ContentActions
                      contentId={content.id}
                      contentCreator={effectiveAddress}
                      tipAmount={content.price.toString()}
                      isPaid={true}
                      onTipSuccess={(txHash) => {
                        console.log('Tip successful:', txHash)
                        // You can add additional logic here, like updating the UI or showing a success message
                      }}
                      onAccessGranted={() => {
                        console.log('Access granted to content:', content.id)
                        // You can add additional logic here, like updating the UI or showing a success message
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 