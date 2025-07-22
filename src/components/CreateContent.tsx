'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { sdk } from '@farcaster/frame-sdk'

type ContentType = 'text' | 'article' | 'video' | 'image'

interface CreateContentProps {
  onContentCreated?: (contentId: string) => void
}

export default function CreateContent({ onContentCreated }: CreateContentProps) {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [price, setPrice] = useState('0.001')
  const [isProcessing, setIsProcessing] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  const [isFarcasterApp, setIsFarcasterApp] = useState(false)
  const [showFarcasterRequired, setShowFarcasterRequired] = useState(false)
  
  // Preview fields
  const [previewText, setPreviewText] = useState('')
  const [previewImage, setPreviewImage] = useState<File | null>(null)
  const [previewVideo, setPreviewVideo] = useState<File | null>(null)
  const [showPreviewSection, setShowPreviewSection] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [createdContentId, setCreatedContentId] = useState('')

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if we're in Farcaster Mini App
        const isMiniApp = await sdk.isInMiniApp()
        setIsFarcasterApp(isMiniApp)
        
        if (isMiniApp) {
          // Get user's wallet address
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            setUserAddress(await signer.getAddress())
          }
        } else {
          // Not in Farcaster environment - show requirement message
          setShowFarcasterRequired(true)
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        setShowFarcasterRequired(true)
      }
    }
    
    initApp()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Generate unique content ID
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Here you would integrate with your actual upload/encrypt function
      console.log('Creating content:', {
        contentId,
        title,
        description,
        content,
        contentType,
        price,
        userAddress
      })

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Auto-cast the new content on Farcaster
      if (isFarcasterApp) {
        try {
          console.log('🎭 Composing cast for new content...')
          
          // Generate the content URL with Frame metadata
          const contentUrl = `${window.location.origin}/content/${contentId}`
          
          // Create cast text based on content type
          const castText = `🎉 Just created new ${contentType} content: "${title}"\n\n${description}\n\n${price !== '0' ? `💰 Price: ${price} USDC` : '🆓 Free content'}\n\nCheck it out! 👇`
          
          // Compose the cast with the content Frame
          await sdk.actions.composeCast({
            text: castText,
            embeds: [contentUrl]
          })
          
          console.log('✅ Cast composed successfully!')
        } catch (castError) {
          console.error('❌ Error composing cast:', castError)
          // Don't fail the content creation if casting fails
        }
      }

      // Show success message
      setCreatedContentId(contentId)
      setShowSuccessMessage(true)

      // Call the callback
      if (onContentCreated) {
        onContentCreated(contentId)
      }

      // Reset form
      setTitle('')
      setDescription('')
      setContent('')
      setPrice('0.001')
      setPreviewText('')
      setPreviewImage(null)
      setPreviewVideo(null)

    } catch (error) {
      console.error('Error creating content:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getContentPlaceholder = () => {
    switch (contentType) {
      case 'text':
        return 'Enter your text content here...'
      case 'article':
        return 'Write your article in markdown format...'
      case 'video':
        return 'Enter video URL (YouTube, Vimeo, etc.)...'
      case 'image':
        return 'Enter image URL...'
      default:
        return 'Enter content...'
    }
  }

  // Show Farcaster requirement message if not in Mini App
  if (showFarcasterRequired) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Farcaster Mini App Required</h2>
            <p className="text-gray-600 mb-6">
              Content creation is only available within the Farcaster Mini App environment.
              Please open this app through Farcaster to create and manage content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-semibold">How to access:</p>
              <ul className="text-blue-600 text-sm mt-2 space-y-1">
                <li>• Open Farcaster app</li>
                <li>• Navigate to Mini Apps</li>
                <li>• Find and open this app</li>
                <li>• Connect your wallet to start creating content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Content</h2>
        
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎉</div>
              <div>
                <p className="text-green-800 font-semibold">Content Created Successfully!</p>
                <p className="text-green-600 text-sm">Your content has been created and shared on Farcaster.</p>
                <div className="mt-2 space-x-2">
                  <a 
                    href={`/content/${createdContentId}`}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    View Content →
                  </a>
                  {isFarcasterApp && (
                    <button
                      onClick={async () => {
                        try {
                          const contentUrl = `${window.location.origin}/content/${createdContentId}`
                          const castText = `🎉 Check out my new ${contentType} content: "${title}"\n\n${description}\n\n${price !== '0' ? `💰 Price: ${price} USDC` : '🆓 Free content'}\n\nCheck it out! 👇`
                          
                          await sdk.actions.composeCast({
                            text: castText,
                            embeds: [contentUrl]
                          })
                        } catch (error) {
                          console.error('Error sharing content:', error)
                        }
                      }}
                      className="text-purple-600 hover:text-purple-800 underline text-sm"
                    >
                      Share Again →
                    </button>
                  )}
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="text-gray-600 hover:text-gray-800 underline text-sm"
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isFarcasterApp && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-semibold">🎉 Running in Farcaster Mini App!</p>
            <p className="text-blue-600 text-sm">Wallet: {userAddress || 'Connecting...'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="text">Text</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter content title..."
              required
            />
          </div>

          {/* Preview Section Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">🎯 Content Preview</h3>
                <p className="text-blue-600 text-sm">
                  Add a preview to attract users and increase conversion
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewSection(!showPreviewSection)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {showPreviewSection ? 'Hide Preview' : 'Add Preview'}
              </button>
            </div>
          </div>

          {/* Preview Fields */}
          {showPreviewSection && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview Content</h3>
              
              {/* Preview Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Text (Optional)
                </label>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a compelling preview text to entice users..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This text will be shown to users before they pay
                </p>
              </div>

              {/* Preview Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPreviewImage(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A preview image to show users (will be blurred/watermarked)
                </p>
                {previewImage && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      ✅ {previewImage.name} ({(previewImage.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Video */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview Video (Optional, max 5 seconds)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setPreviewVideo(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A short preview video (will be limited to 5 seconds)
                </p>
                {previewVideo && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800">
                      ✅ {previewVideo.name} ({(previewVideo.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}
              </div>

              {/* Preview Preview */}
              {(previewText || previewImage || previewVideo) && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Preview Preview:</h4>
                  <div className="space-y-3">
                    {previewText && (
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                        <p className="text-gray-700 italic">"{previewText}"</p>
                      </div>
                    )}
                    {previewImage && (
                      <div className="relative">
                        <img 
                          src={URL.createObjectURL(previewImage)} 
                          alt="Preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl mb-1">🔒</div>
                            <p className="text-sm font-semibold">Preview</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {previewVideo && (
                      <div className="relative">
                        <video 
                          src={URL.createObjectURL(previewVideo)}
                          className="w-full h-32 object-cover rounded"
                          muted
                          loop
                          autoPlay
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl mb-1">🔒</div>
                            <p className="text-sm font-semibold">Preview Video</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your content..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={contentType === 'article' ? 12 : 6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={getContentPlaceholder()}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (USDC)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.001"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Set the price users will pay to access this content
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Content Preview</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Type:</strong> {contentType}</p>
              <p><strong>Title:</strong> {title || 'No title'}</p>
              <p><strong>Price:</strong> {price} USDC</p>
              <p><strong>Content Length:</strong> {content.length} characters</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isProcessing ? 'Creating Content...' : 'Create Content'}
          </button>
        </form>
      </div>
    </div>
  )
} 