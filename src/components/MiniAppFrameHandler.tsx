'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { getContent, type ContentMetadata } from '../lib/contentStorage'
import { payForContentWithNativePayment, checkContentAccess } from '../lib/hybridWalletSystem'

interface MiniAppFrameHandlerProps {
  contentId: string
  onContentLoaded?: (content: ContentMetadata) => void
  onPaymentSuccess?: (txHash: string) => void
  onError?: (error: string) => void
}

export function MiniAppFrameHandler({ 
  contentId, 
  onContentLoaded, 
  onPaymentSuccess, 
  onError 
}: MiniAppFrameHandlerProps) {
  const [content, setContent] = useState<ContentMetadata | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    const initializeFrame = async () => {
      try {
        console.log('🎯 Initializing Mini App Frame for content:', contentId)
        
        // Check if we're in a Mini App environment
        const isMiniApp = await sdk.isInMiniApp()
        if (!isMiniApp) {
          console.log('⚠️ Not in Mini App environment')
          return
        }

        // Hide splash screen
        await sdk.actions.ready()
        console.log('✅ Mini App ready')

        // Get content from storage
        const storedContent = getContent(contentId)
        if (!storedContent) {
          throw new Error('Content not found')
        }

        setContent(storedContent)
        onContentLoaded?.(storedContent)

        // Check if user has access
        const access = await checkContentAccess(contentId, '')
        setHasAccess(access)

        console.log('📦 Content loaded:', storedContent.title)
        console.log('🔐 Access status:', access)

      } catch (error) {
        console.error('❌ Frame initialization error:', error)
        onError?.(error instanceof Error ? error.message : 'Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    initializeFrame()
  }, [contentId, onContentLoaded, onError])

  const handlePayment = async () => {
    if (!content) return

    try {
      setIsPaying(true)
      console.log('💳 Processing payment for:', content.title)

      const result = await payForContentWithNativePayment(
        content.creator,
        content.price,
        content.contentId
      )

      if (result.success) {
        console.log('✅ Payment successful:', result.txHash)
        setHasAccess(true)
        onPaymentSuccess?.(result.txHash!)
      } else {
        throw new Error(result.error || 'Payment failed')
      }

    } catch (error) {
      console.error('❌ Payment error:', error)
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsPaying(false)
    }
  }

  const handleShare = async () => {
    if (!content) return

    try {
      const shareText = `${content.title}\n\n${content.description}\n\n💰 Premium Content - ${content.price} USDC\n\nCheck out this exclusive content!`
      const frameUrl = `${process.env.NEXT_PUBLIC_APP_URL}/content/${content.contentId}`

      console.log('📢 Sharing content:', content.title)
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [frameUrl]
      })

    } catch (error) {
      console.error('❌ Share error:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to share')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-4">The requested content could not be found.</p>
          <button
            onClick={() => sdk.actions.close()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Farcaster Mini</h1>
          <button
            onClick={() => sdk.actions.close()}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Content Preview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{content.title}</h2>
          <p className="text-gray-600 mb-4">{content.description}</p>
          
          {content.contentType === 'image' && content.ipfsCid && (
            <div className="mb-4">
              <img
                src={`https://gateway.pinata.cloud/ipfs/${content.ipfsCid}`}
                alt={content.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              content.accessType === 'paid' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {content.accessType === 'paid' ? `$${content.price} USDC` : 'Free'}
            </span>
            <span className="text-sm text-gray-500 capitalize">{content.contentType}</span>
          </div>
        </div>

        {/* Access Status */}
        {hasAccess ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <div>
                <h3 className="font-semibold text-green-800">Access Granted</h3>
                <p className="text-green-600 text-sm">You can now view this content</p>
              </div>
            </div>
          </div>
        ) : content.accessType === 'paid' ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">🔒</div>
              <div>
                <h3 className="font-semibold text-yellow-800">Premium Content</h3>
                <p className="text-yellow-600 text-sm">Pay {content.price} USDC to unlock</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!hasAccess && content.accessType === 'paid' && (
            <button
              onClick={handlePayment}
              disabled={isPaying}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPaying ? 'Processing Payment...' : `Pay ${content.price} USDC`}
            </button>
          )}

          {hasAccess && (
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">🎉 Content Unlocked!</h3>
              <p className="text-gray-600 text-sm mb-3">
                Here's your exclusive content. Enjoy!
              </p>
              <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                <p>✨ This is your premium content that you just unlocked!</p>
                <p className="mt-2">📝 Content details and full access are now available.</p>
              </div>
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
          >
            📢 Share This Content
          </button>

          <button
            onClick={() => sdk.actions.close()}
            className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 