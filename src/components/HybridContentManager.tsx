'use client'

import React, { useState, useEffect } from 'react'
import { 
  getHybridWalletStatus, 
  registerContentWithUserWallet,
  registerContentWithExternalRPC, 
  accessContent,
  getFarcasterUserAddress,
  checkContentAccess,
  getContentDetails,
  payForContentWithNativePayment
} from '../lib/hybridWalletSystem'
import { storeContent, getContent, type ContentMetadata } from '../lib/contentStorage'

interface HybridContentManagerProps {
  contentId?: string
  creatorAddress?: string
  onContentCreated?: (txHash: string) => void
  onAccessGranted?: () => void
  onError?: (error: string) => void
}

export default function HybridContentManager({ 
  contentId, 
  creatorAddress, 
  onContentCreated, 
  onAccessGranted, 
  onError 
}: HybridContentManagerProps) {
  const [walletStatus, setWalletStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [contentDetails, setContentDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Content creation form state
  const [contentTitle, setContentTitle] = useState('')
  const [contentDescription, setContentDescription] = useState('')
  const [contentPrice, setContentPrice] = useState('0.1')
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [contentText, setContentText] = useState('')

  useEffect(() => {
    initializeWallet()
  }, [])

  useEffect(() => {
    if (contentId) {
      checkAccessForContent()
    }
  }, [contentId, walletStatus])

  const initializeWallet = async () => {
    try {
      const status = await getHybridWalletStatus()
      setWalletStatus(status)
      
      if (status.error) {
        setError(status.error)
      }
    } catch (error) {
      console.error('Error initializing wallet:', error)
      setError('Failed to initialize wallet')
    }
  }

  const checkAccessForContent = async () => {
    if (!contentId || !walletStatus?.address) return

    try {
      setIsLoading(true)
      setError(null)

      // Check if user has access
      const hasAccess = await checkContentAccess(contentId, walletStatus.address)
      setHasAccess(hasAccess)

      if (!hasAccess) {
        // Get content details for payment
        const details = await getContentDetails(contentId)
        setContentDetails(details)
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setError('Failed to check content access')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletStatus?.isConnected) {
      setError('Wallet not connected')
      return
    }

    if (parseFloat(contentPrice) < 0.1) {
      setError('Minimum price is 0.1 USDC')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Generate unique content ID
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // For demo purposes, we'll use a placeholder IPFS CID
      // In production, you would upload the content to IPFS first
      const ipfsCid = `ipfs://${contentId}`

      console.log('📝 Creating content:', {
        contentId,
        title: contentTitle,
        description: contentDescription,
        price: contentPrice,
        ipfsCid
      })

      // Try user wallet first, fallback to external RPC if needed
      let result
      try {
        result = await registerContentWithUserWallet(
          contentId,
          contentPrice,
          ipfsCid
        )
      } catch (error) {
        console.log('User wallet registration failed, trying external RPC fallback...')
        result = await registerContentWithExternalRPC(
          contentId,
          contentPrice,
          ipfsCid
        )
      }

      if (result.success) {
        console.log('✅ Content created successfully:', result.txHash)
        
        // Store content metadata for frame generation
        const contentMetadata: ContentMetadata = {
          contentId: contentId,
          title: contentTitle,
          description: contentDescription,
          contentType: contentFile ? 'image' : 'text',
          price: contentPrice,
          creator: walletStatus.address || '',
          ipfsCid: ipfsCid,
          createdAt: new Date().toISOString(),
          accessType: parseFloat(contentPrice) > 0 ? 'paid' : 'free',
          customEmbedText: contentText
        }
        
        storeContent(contentMetadata)
        console.log('📦 Content metadata stored for frame generation')
        
        onContentCreated?.(result.txHash!)
        
        // Reset form
        setContentTitle('')
        setContentDescription('')
        setContentPrice('0.1')
        setContentFile(null)
        setContentText('')
      } else {
        throw new Error(result.error || 'Content creation failed')
      }
    } catch (error) {
      console.error('Error creating content:', error)
      setError(error instanceof Error ? error.message : 'Content creation failed')
      onError?.(error instanceof Error ? error.message : 'Content creation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayForContent = async () => {
    if (!contentId || !contentDetails) {
      setError('No content to pay for')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await payForContentWithNativePayment(
        contentId,
        contentDetails.creator,
        contentDetails.price
      )

      if (result.success) {
        console.log('✅ Payment successful:', result.txHash)
        setHasAccess(true)
        onAccessGranted?.()
      } else {
        throw new Error(result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('Error paying for content:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
      onError?.(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessContent = async () => {
    if (!contentId) {
      setError('No content ID provided')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await accessContent(contentId)

      if (result.success) {
        console.log('✅ Content access successful')
        setHasAccess(true)
        onAccessGranted?.()
      } else {
        throw new Error(result.error || 'Content access failed')
      }
    } catch (error) {
      console.error('Error accessing content:', error)
      setError(error instanceof Error ? error.message : 'Content access failed')
      onError?.(error instanceof Error ? error.message : 'Content access failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!walletStatus) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wallet Status */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Wallet Status</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center">
            <span className="font-medium">Connected:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              walletStatus.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {walletStatus.isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium">Mini App:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              walletStatus.isMiniApp ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {walletStatus.isMiniApp ? 'Yes' : 'No'}
            </span>
          </div>
          {walletStatus.address && (
            <div className="flex items-center">
              <span className="font-medium">Address:</span>
              <span className="ml-2 font-mono text-xs">{walletStatus.address}</span>
            </div>
          )}
          {walletStatus.error && (
            <div className="text-red-600 text-sm">{walletStatus.error}</div>
          )}
        </div>
      </div>

      {/* Content Creation Form */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Create Content</h3>
        <form onSubmit={handleCreateContent} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter content title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={contentDescription}
              onChange={(e) => setContentDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter content description"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (USDC)
            </label>
            <input
              type="number"
              value={contentPrice}
              onChange={(e) => setContentPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.1"
              min="0.1"
              step="0.1"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Text
            </label>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your content"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content File
            </label>
            <input
              type="file"
              onChange={(e) => setContentFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !walletStatus.isConnected}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Content...' : 'Create Content'}
          </button>
        </form>
      </div>

      {/* Content Access */}
      {contentId && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Access Content</h3>
          
          {hasAccess ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-800">✅ You have access to this content</span>
              </div>
              <button
                onClick={handleAccessContent}
                disabled={isLoading}
                className="mt-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'View Content'}
              </button>
            </div>
          ) : contentDetails ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-800">Price:</span>
                  <span className="font-semibold">{contentDetails.price} USDC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-800">Creator:</span>
                  <span className="font-mono text-xs">{contentDetails.creator}</span>
                </div>
              </div>
              <button
                onClick={handlePayForContent}
                disabled={isLoading || !walletStatus.isConnected}
                className="mt-3 w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing Payment...' : `Pay ${contentDetails.price} USDC`}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-gray-600">Loading content details...</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}
    </div>
  )
} 