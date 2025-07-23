'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { 
  getAllContent, 
  storeContent, 
  generateFrameMetadata, 
  generateShareText,
  type ContentMetadata 
} from '../../lib/contentStorage'

export default function TestFrameSharingPage() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [allContent, setAllContent] = useState<ContentMetadata[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null)
  const [frameUrl, setFrameUrl] = useState<string>('')
  const [shareText, setShareText] = useState<string>('')
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    const initialize = async () => {
      const results: string[] = []
      
      try {
        // Check Mini App environment
        const miniApp = await sdk.isInMiniApp()
        setIsMiniApp(miniApp)
        results.push(`✅ Mini App Environment: ${miniApp ? 'Yes' : 'No'}`)
        
        if (miniApp) {
          await sdk.actions.ready()
          results.push('✅ Mini App ready() called successfully')
        }

        // Load existing content
        const content = getAllContent()
        setAllContent(content)
        results.push(`✅ Loaded ${content.length} content items`)
        
        if (content.length > 0) {
          setSelectedContent(content[0])
        }

        // Create test content if none exists
        if (content.length === 0) {
          const testContent: ContentMetadata = {
            contentId: 'test-frame-' + Date.now(),
            title: 'Test Frame Content',
            description: 'This is a test content for frame sharing verification',
            contentType: 'text',
            price: '0.1',
            creator: '0x1234567890123456789012345678901234567890',
            ipfsCid: 'QmTestFrameContent',
            createdAt: new Date().toISOString(),
            accessType: 'paid',
            customEmbedText: 'Check out this amazing test frame!'
          }
          
          storeContent(testContent)
          setAllContent([testContent])
          setSelectedContent(testContent)
          results.push('✅ Created test content for frame sharing')
        }

      } catch (error) {
        results.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      setTestResults(results)
    }

    initialize()
  }, [])

  useEffect(() => {
    if (selectedContent) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'
      const url = `${baseUrl}/content/${selectedContent.contentId}`
      const text = generateShareText(selectedContent, selectedContent.customEmbedText)
      
      setFrameUrl(url)
      setShareText(text)
    }
  }, [selectedContent])

  const handleTestFrameSharing = async () => {
    if (!selectedContent || !isMiniApp) return
    
    const results: string[] = []
    
    try {
      results.push('🎯 Testing frame sharing...')
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

  const handleContentSelect = (content: ContentMetadata) => {
    setSelectedContent(content)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frame Sharing Test</h1>
        
        {/* Environment Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Environment Status</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${isMiniApp ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center">
                <div className={`text-2xl mr-3 ${isMiniApp ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isMiniApp ? '✅' : '⚠️'}
                </div>
                <div>
                  <h3 className="font-semibold">Mini App Environment</h3>
                  <p className="text-sm">{isMiniApp ? 'Ready for frame sharing' : 'Frame sharing limited'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3 text-blue-600">📦</div>
                <div>
                  <h3 className="font-semibold">Content Available</h3>
                  <p className="text-sm">{allContent.length} items ready for sharing</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Content Selection */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Select Content to Share</h2>
            
            {allContent.length === 0 ? (
              <p className="text-gray-500">No content found. Create some content first!</p>
            ) : (
              <div className="space-y-3">
                {allContent.map((content) => (
                  <div
                    key={content.contentId}
                    onClick={() => handleContentSelect(content)}
                    className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedContent?.contentId === content.contentId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <h3 className="font-semibold">{content.title}</h3>
                    <p className="text-sm text-gray-600">{content.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        content.accessType === 'paid' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {content.accessType === 'paid' ? `$${content.price} USDC` : 'Free'}
                      </span>
                      <span className="text-xs text-gray-500">{content.contentType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Frame Sharing Test */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Frame Sharing Test</h2>
            
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
                          selectedContent.accessType === 'paid' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedContent.accessType === 'paid' ? `Pay ${selectedContent.price} USDC` : 'View Content'}
                        </span>
                        <span className="text-xs text-gray-500">{selectedContent.contentType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Test */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-3">Manual Test</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Copy the Frame URL and paste it in Warpcast to test the frame:
                  </p>
                  <a
                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🚀 Test in Warpcast
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select content to test frame sharing</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 