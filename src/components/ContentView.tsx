'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useParams } from 'next/navigation'
import { payForContentWithFarcasterWallet } from '../lib/farcasterWallet'

interface ContentData {
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
  isPaid: boolean
}

export default function ContentView() {
  const params = useParams()
  const contentId = params.cid as string
  
  const [content, setContent] = useState<ContentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    if (contentId) {
      fetchContent()
    }
  }, [contentId])

  const fetchContent = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching content:', contentId)

      // Fetch content from IPFS or API
      const response = await fetch(`/api/content/${contentId}`)
      if (!response.ok) {
        throw new Error('Content not found')
      }

      const contentData = await response.json()
      console.log('📄 Content data:', contentData)

      // Check if user has access
      const accessResponse = await fetch('/api/payments/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, userAddress: 'current-user' })
      })

      const accessData = await accessResponse.json()
      setHasAccess(accessData.hasPaid)

      setContent(contentData)
      setShowPreview(!accessData.hasPaid)
    } catch (error) {
      console.error('❌ Failed to fetch content:', error)
      setError(error instanceof Error ? error.message : 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      setIsPaying(true)
      console.log('💸 Processing payment for content:', contentId)

      const result = await payForContentWithFarcasterWallet(contentId)
      
      if (result.success) {
        console.log('✅ Payment successful:', result.txHash)
        setHasAccess(true)
        setShowPreview(false)
        
        // Record payment
        await fetch('/api/payments/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            userAddress: 'current-user',
            txHash: result.txHash,
            amount: content?.price || '0',
            timestamp: Date.now()
          })
        })
      } else {
        throw new Error(result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('❌ Payment failed:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Content Not Found</h1>
          <p className="text-gray-600">{error || 'The content you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Content Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
              <p className="text-gray-600 mt-2">{content.description}</p>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {content.contentType.toUpperCase()}
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {content.price} USDC
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            <span>By {content.creator}</span>
            <span className="mx-2">•</span>
            <span>{new Date(content.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Content Preview or Full Content */}
        {showPreview ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Preview Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🔒 Premium Content</h2>
                  <p className="text-purple-100">Unlock this exclusive content</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{content.price} USDC</div>
                  <div className="text-purple-100 text-sm">One-time payment</div>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6">
              {/* Content Type Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {content.contentType === 'text' && '📝 Text Content'}
                  {content.contentType === 'article' && '📄 Article'}
                  {content.contentType === 'video' && '🎥 Video'}
                  {content.contentType === 'image' && '🖼️ Image'}
                </span>
              </div>

              {/* Preview Display */}
              {content.preview?.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={content.preview.imageUrl} 
                    alt="Content preview"
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <p className="text-lg font-semibold">Premium Content</p>
                    </div>
                  </div>
                </div>
              )}

              {content.preview?.videoUrl && (
                <div className="mb-6 relative">
                  <video 
                    src={content.preview.videoUrl}
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                    muted
                    loop
                    autoPlay
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <p className="text-lg font-semibold">Premium Video</p>
                    </div>
                  </div>
                </div>
              )}

              {content.preview?.text && (
                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-700 italic">"{content.preview.text}"</p>
                  </div>
                </div>
              )}

              {/* Default Preview Text */}
              {!content.preview?.text && !content.preview?.imageUrl && !content.preview?.videoUrl && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-dashed border-blue-200">
                    <div className="text-center">
                      <div className="text-4xl mb-4">✨</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Exclusive {content.contentType} Content
                      </h3>
                      <p className="text-gray-600">
                        Unlock this premium {content.contentType} content to see what's inside.
                        This is exclusive content created by {content.creator}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <div className="text-center">
                <button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isPaying ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="mr-2">🔓</span>
                      Pay {content.price} USDC to Unlock
                    </div>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Secure payment via Farcaster wallet
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Full Content Display */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Content Type Badge */}
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✅ Unlocked
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 ml-2">
                  {content.contentType === 'text' && '📝 Text Content'}
                  {content.contentType === 'article' && '📄 Article'}
                  {content.contentType === 'video' && '🎥 Video'}
                  {content.contentType === 'image' && '🖼️ Image'}
                </span>
              </div>

              {/* Content Display */}
              {content.contentType === 'image' && content.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={content.imageUrl} 
                    alt="Content"
                    className="w-full max-h-96 object-contain rounded-lg shadow-md"
                  />
                </div>
              )}

              {content.contentType === 'video' && content.videoUrl && (
                <div className="mb-6">
                  <video 
                    src={content.videoUrl}
                    controls
                    className="w-full rounded-lg shadow-md"
                  />
                </div>
              )}

              {(content.contentType === 'text' || content.contentType === 'article') && content.content && (
                <div className="mb-6">
                  <div className="prose max-w-none">
                    {content.contentType === 'article' ? (
                      <div dangerouslySetInnerHTML={{ __html: content.content }} />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{content.content}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🎉</div>
                  <div>
                    <h3 className="font-semibold text-green-800">Content Unlocked!</h3>
                    <p className="text-green-600 text-sm">
                      You now have access to this premium content. Enjoy!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">❌</div>
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 