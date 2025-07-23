'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'

interface FarcasterProfile {
  fid: number
  username: string
  displayName: string
  pfp: string
  bio: string
  followers: number
  following: number
}

interface FarcasterUserProfileProps {
  onProfileLoaded?: (profile: FarcasterProfile) => void
  className?: string
}

export function FarcasterUserProfile({ onProfileLoaded, className = '' }: FarcasterUserProfileProps) {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('🔍 Fetching Farcaster user profile...')
        
        // Check if we're in a Mini App environment
        const isMiniApp = await sdk.isInMiniApp()
        if (!isMiniApp) {
          throw new Error('Not in Farcaster Mini App environment')
        }

        // Get user context from Farcaster SDK
        const context = await sdk.context
        
        if (!context) {
          throw new Error('No user context available')
        }

        console.log('✅ Farcaster context:', context)

        // Extract profile information
        const userProfile: FarcasterProfile = {
          fid: context.user?.fid || 0,
          username: context.user?.username || 'unknown',
          displayName: context.user?.displayName || context.user?.username || 'Unknown User',
          pfp: '', // Will be fetched separately if needed
          bio: '', // Will be fetched separately if needed
          followers: 0, // Will be fetched separately if needed
          following: 0 // Will be fetched separately if needed
        }

        setProfile(userProfile)
        onProfileLoaded?.(userProfile)
        
        console.log('✅ Profile loaded:', userProfile)

      } catch (error) {
        console.error('❌ Error fetching Farcaster profile:', error)
        setError(error instanceof Error ? error.message : 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [onProfileLoaded])

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        ⚠️ {error}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        No profile data available
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Profile Picture */}
      <div className="relative">
        {profile.pfp ? (
          <img
            src={profile.pfp}
            alt={profile.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-sm">
              {profile.displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900 truncate">
            {profile.displayName}
          </h3>
          <span className="text-gray-500 text-sm">
            @{profile.username}
          </span>
        </div>
        
        {profile.bio && (
          <p className="text-gray-600 text-sm truncate">
            {profile.bio}
          </p>
        )}
        
        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
          <span>{profile.followers} followers</span>
          <span>{profile.following} following</span>
          <span>FID: {profile.fid}</span>
        </div>
      </div>
    </div>
  )
}

export default FarcasterUserProfile 