'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { sdk } from '@farcaster/frame-sdk'
import Link from 'next/link'

interface UserContent {
  contentId: string
  originalContentId: string
  title: string
  description: string
  contentType: 'text' | 'article' | 'video' | 'image'
  price: string
  creator: string
  ipfsCid: string
  preview?: {
    text?: string
    imageUrl?: string
    videoUrl?: string
  }
  content?: string
  imageUrl?: string
  videoUrl?: string
  createdAt: string
  hasAccess: boolean
  isCreator: boolean
}

interface UserProfileProps {
  onContentSelect?: (contentId: string) => void
}

export default function UserProfile({ onContentSelect }: UserProfileProps) {
  const [userAddress, setUserAddress] = useState('')
  const [isFarcasterApp, setIsFarcasterApp] = useState(false)
  const [createdContent, setCreatedContent] = useState<UserContent[]>([])
  const [purchasedContent, setPurchasedContent] = useState<UserContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'created' | 'purchased'>('created')
  const [stats, setStats] = useState({
    totalCreated: 0,
    totalPurchased: 0,
    totalEarnings: '0',
    totalSpent: '0'
  })

  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true)
        
        // Check if we're in Farcaster Mini App
        const isMiniApp = await sdk.isInMiniApp()
        setIsFarcasterApp(isMiniApp)
        
        if (isMiniApp) {
          // Get user's wallet address
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            const address = await signer.getAddress()
            setUserAddress(address)
            
            // Fetch user's content
            await fetchUserContent(address)
          }
        } else {
          setError('This app requires Farcaster Mini App environment')
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        setError('Failed to initialize app')
      } finally {
        setIsLoading(false)
      }
    }
    
    initApp()
  }, [])

  const fetchUserContent = async (address: string) => {
    try {
      console.log('🔍 Fetching content for user:', address)

      // Fetch created content
      const createdResponse = await fetch(`/api/user/content/created?address=${address}`)
      if (createdResponse.ok) {
        const created = await createdResponse.json()
        setCreatedContent(created)
        console.log('📝 Created content:', created)
      }

      // Fetch purchased content
      const purchasedResponse = await fetch(`/api/user/content/purchased?address=${address}`)
      if (purchasedResponse.ok) {
        const purchased = await purchasedResponse.json()
        setPurchasedContent(purchased)
        console.log('🛒 Purchased content:', purchased)
      }

      // Calculate stats
      const totalEarnings = createdContent.reduce((sum, content) => sum + parseFloat(content.price), 0)
      const totalSpent = purchasedContent.reduce((sum, content) => sum + parseFloat(content.price), 0)
      
      setStats({
        totalCreated: createdContent.length,
        totalPurchased: purchasedContent.length,
        totalEarnings: totalEarnings.toFixed(3),
        totalSpent: totalSpent.toFixed(3)
      })

    } catch (error) {
      console.error('Error fetching user content:', error)
      setError('Failed to fetch user content')
    }
  }

  const handleContentClick = (contentId: string) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    }
  }

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'text': return '📝'
      case 'article': return '📄'
      case 'video': return '🎥'
      case 'image': return '🖼️'
      default: return '📄'
    }
  }

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'text': return 'Text'
      case 'article': return 'Article'
      case 'video': return 'Video'
      case 'image': return 'Image'
      default: return 'Content'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentContent = activeTab === 'created' ? createdContent : purchasedContent

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            <p className="text-gray-600 mt-1">
              {isFarcasterApp ? 'Connected via Farcaster' : 'Farcaster Mini App Required'}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Connecting...'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCreated}</div>
            <div className="text-sm text-blue-600">Content Created</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalPurchased}</div>
            <div className="text-sm text-green-600">Content Purchased</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalEarnings}</div>
            <div className="text-sm text-purple-600">USDC Earned</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalSpent}</div>
            <div className="text-sm text-orange-600">USDC Spent</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('created')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'created'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Created Content ({createdContent.length})
            </button>
            <button
              onClick={() => setActiveTab('purchased')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'purchased'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🛒 Purchased Content ({purchasedContent.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Content Grid */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentContent.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'created' ? '📝' : '🛒'}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeTab === 'created' ? 'No Content Created Yet' : 'No Content Purchased Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'created' 
                ? 'Start creating amazing content to share with the world!'
                : 'Purchase some content to see it here.'
              }
            </p>
            {activeTab === 'created' && (
              <Link
                href="/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Content
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentContent.map((content) => (
              <div
                key={content.contentId}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleContentClick(content.contentId)}
              >
                {/* Content Preview */}
                {content.preview?.imageUrl && (
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={content.preview.imageUrl}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        {getContentTypeIcon(content.contentType)} {getContentTypeLabel(content.contentType)}
                      </span>
                    </div>
                    {content.hasAccess && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                          ✅ Unlocked
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {getContentTypeIcon(content.contentType)} {getContentTypeLabel(content.contentType)}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {content.price} USDC
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {content.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {content.description}
                  </p>

                  {/* Preview Text */}
                  {content.preview?.text && (
                    <div className="bg-gray-50 p-3 rounded mb-3">
                      <p className="text-sm text-gray-700 italic line-clamp-2">
                        "{content.preview.text}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                    {content.isCreator ? (
                      <span className="text-blue-600">Creator</span>
                    ) : (
                      <span className="text-green-600">Purchased</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-3">
                    <Link
                      href={`/content/${content.originalContentId}`}
                      className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      {content.hasAccess ? 'View Content' : 'Pay to Unlock'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 