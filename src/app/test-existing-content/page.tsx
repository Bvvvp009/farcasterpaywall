'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { ethers } from 'ethers'
import { 
  getAllContent, 
  storeContent, 
  generateFrameMetadata, 
  generateShareText,
  type ContentMetadata 
} from '../../lib/contentStorage'
import { getContentDetails, checkContentAccess } from '../../lib/hybridWalletSystem'

interface ExistingContent {
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

export default function TestExistingContentPage() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')
  const [existingContent, setExistingContent] = useState<ExistingContent[]>([])
  const [selectedContent, setSelectedContent] = useState<ExistingContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [testResults, setTestResults] = useState<string[]>([])
  const [frameUrl, setFrameUrl] = useState<string>('')
  const [shareText, setShareText] = useState<string>('')
  const [frameMetadata, setFrameMetadata] = useState<any>(null)

  useEffect(() => {
    const initialize = async () => {
      const results: string[] = []
      
      try {
        setIsLoading(true)
        
        // Check Mini App environment
        const miniApp = await sdk.isInMiniApp()
        setIsMiniApp(miniApp)
        results.push(`✅ Mini App Environment: ${miniApp ? 'Yes' : 'No'}`)
        
        if (miniApp) {
          await sdk.actions.ready()
          results.push('✅ Mini App ready() called successfully')

          // Get user's wallet address
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            const address = await signer.getAddress()
            setUserAddress(address)
            results.push(`✅ User wallet address: ${address}`)
            
            // Fetch existing content from API
            await fetchExistingContent(address, results)
          }
        }

      } catch (error) {
        results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsLoading(false)
        setTestResults(results)
      }
    }

    initialize()
  }, [])

  const fetchExistingContent = async (address: string, results: string[]) => {
    try {
      results.push('🔍 Fetching existing content from API...')

      // Fetch created content
      const createdResponse = await fetch(`/api/user/content/created?address=${address}`)
      if (createdResponse.ok) {
        const created = await createdResponse.json()
        results.push(`✅ Found ${created.content?.length || 0} created content items`)
        
        // Convert to ExistingContent format
        const createdContent = (created.content || []).map((item: any) => ({
          contentId: item.contentId,
          originalContentId: item.contentId,
          title: item.title || 'Untitled Content',
          description: item.description || 'No description available',
          contentType: item.contentType || 'text',
          price: item.price || '0',
          creator: item.creator || address,
          ipfsCid: item.ipfsCid || '',
          createdAt: item.createdAt || new Date().toISOString(),
          hasAccess: true,
          isCreator: true
        }))
        
        setExistingContent(createdContent)
        
        if (createdContent.length > 0) {
          setSelectedContent(createdContent[0])
          results.push('✅ Set first content as selected')
        }
      } else {
        results.push(`❌ Failed to fetch created content: ${createdResponse.status}`)
      }

      // Fetch purchased content
      const purchasedResponse = await fetch(`/api/user/content/purchased?address=${address}`)
      if (purchasedResponse.ok) {
        const purchased = await purchasedResponse.json()
        results.push(`✅ Found ${purchased.content?.length || 0} purchased content items`)
        
        // Add purchased content to existing content
        const purchasedContent = (purchased.content || []).map((item: any) => ({
          contentId: item.contentId,
          originalContentId: item.contentId,
          title: item.title || 'Untitled Content',
          description: item.description || 'No description available',
          contentType: item.contentType || 'text',
          price: item.price || '0',
          creator: item.creator || 'Unknown',
          ipfsCid: item.ipfsCid || '',
          createdAt: item.createdAt || new Date().toISOString(),
          hasAccess: true,
          isCreator: false
        }))
        
        setExistingContent(prev => [...prev, ...purchasedContent])
      } else {
        results.push(`❌ Failed to fetch purchased content: ${purchasedResponse.status}`)
      }

    } catch (error) {
      results.push(`❌ Error fetching content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    if (selectedContent) {
      // Create ContentMetadata for frame generation
      const contentMetadata: ContentMetadata = {
        contentId: selectedContent.contentId,
        title: selectedContent.title,
        description: selectedContent.description,
        contentType: selectedContent.contentType,
        price: selectedContent.price,
        creator: selectedContent.creator,
        ipfsCid: selectedContent.ipfsCid,
        createdAt: selectedContent.createdAt,
        accessType: parseFloat(selectedContent.price) > 0 ? 'paid' : 'free',
        customEmbedText: `Check out this ${selectedContent.contentType} content!`
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'
      const url = `${baseUrl}/content/${selectedContent.contentId}`
      const text = generateShareText(contentMetadata, contentMetadata.customEmbedText)
      const metadata = generateFrameMetadata(contentMetadata, baseUrl)
      
      setFrameUrl(url)
      setShareText(text)
      setFrameMetadata(metadata)
    }
  }, [selectedContent])

  const handleContentSelect = (content: ExistingContent) => {
    setSelectedContent(content)
  }

  const handleTestFrameSharing = async () => {
    if (!selectedContent || !isMiniApp) return
    
    const results: string[] = []
    
    try {
      results.push('🎯 Testing frame sharing with existing content...')
      results.push(`📋 Content: ${selectedContent.title}`)
      results.push(`📋 Frame URL: ${frameUrl}`)
      results.push(`📝 Share Text: ${shareText.substring(0, 100)}...`)
      
      // Test frame sharing
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [frameUrl]
      })
      
      results.push('✅ Frame shared successfully via Farcaster SDK')
      results.push('📱 Check your Farcaster feed to see the frame')
      
    } catch (error) {
      results.push(`❌ Frame sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setTestResults(prev => [...prev, ...results])
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading existing content...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Existing Content</h1>
        
        {/* Environment Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${isMiniApp ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                <div className={`text-2xl mr-3 ${isMiniApp ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isMiniApp ? '✅' : '⚠️'}
                </div>
                <div>
                  <h3 className="font-semibold">Mini App Environment</h3>
                  <p className="text-sm">{isMiniApp ? 'Ready for testing' : 'Limited functionality'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3 text-blue-600">👤</div>
                <div>
                  <h3 className="font-semibold">User Address</h3>
                  <p className="text-sm">{userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not connected'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3 text-purple-600">📦</div>
                <div>
                  <h3 className="font-semibold">Existing Content</h3>
                  <p className="text-sm">{existingContent.length} items found</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Existing Content List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Your Existing Content</h2>
            
            {existingContent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>No existing content found.</p>
                <p className="text-sm mt-2">This could mean:</p>
                <ul className="text-sm text-left mt-2 space-y-1">
                  <li>• Content hasn't been registered yet</li>
                  <li>• API endpoints are not working</li>
                  <li>• Content is stored differently</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                {existingContent.map((content) => (
                  <div
                    key={content.contentId}
                    onClick={() => handleContentSelect(content)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedContent?.contentId === content.contentId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{content.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        content.isCreator ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {content.isCreator ? 'Created' : 'Purchased'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        parseFloat(content.price) > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {parseFloat(content.price) > 0 ? `$${content.price} USDC` : 'Free'}
                      </span>
                      <span className="text-xs text-gray-500">{content.contentType}</span>
                    </div>
                    {content.ipfsCid && (
                      <p className="text-xs text-gray-400 mt-1">IPFS: {content.ipfsCid}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Frame Testing */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Frame Testing</h2>
            
            {selectedContent ? (
              <div className="space-y-4">
                {/* Test Results */}
                <div className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Test Results</h3>
                    <button
                      onClick={handleTestFrameSharing}
                      disabled={!isMiniApp}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      Test Frame Share
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div key={index} className="text-sm py-1">
                        {result}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Frame URL */}
                <div className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Frame URL</h3>
                    <button
                      onClick={() => copyToClipboard(frameUrl)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-sm bg-gray-100 p-2 rounded break-all">
                    {frameUrl}
                  </div>
                </div>

                {/* Share Text */}
                <div className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Share Text</h3>
                    <button
                      onClick={() => copyToClipboard(shareText)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {shareText}
                  </div>
                </div>

                {/* Frame Preview */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-3">Frame Preview</h3>
                  <div className="bg-gray-100 p-4 rounded">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <h4 className="font-semibold text-lg mb-2">{selectedContent.title}</h4>
                      <p className="text-gray-600 mb-3">{selectedContent.description}</p>
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          parseFloat(selectedContent.price) > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {parseFloat(selectedContent.price) > 0 ? `Pay ${selectedContent.price} USDC` : 'View Content'}
                        </span>
                        <span className="text-xs text-gray-500">{selectedContent.contentType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Actions */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-3">Test Actions</h3>
                  <div className="space-y-2">
                    <a
                      href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      🚀 Test in Warpcast
                    </a>
                    
                    {isMiniApp && (
                      <button
                        onClick={handleTestFrameSharing}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        📱 Share via Mini App
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select content to test frame</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 