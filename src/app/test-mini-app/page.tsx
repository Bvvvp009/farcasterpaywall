'use client'

import React, { useState, useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import { 
  getAllContent, 
  storeContent, 
  generateFrameMetadata, 
  generateShareText,
  clearAllContent,
  type ContentMetadata 
} from '../../lib/contentStorage'

export default function TestMiniAppPage() {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [allContent, setAllContent] = useState<ContentMetadata[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null)
  const [frameMetadata, setFrameMetadata] = useState<any>(null)
  const [shareText, setShareText] = useState<string>('')
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    const initialize = async () => {
      const results: string[] = []
      
      try {
        // Test 1: Check Mini App environment
        const miniApp = await sdk.isInMiniApp()
        setIsMiniApp(miniApp)
        results.push(`✅ Mini App Environment: ${miniApp ? 'Yes' : 'No'}`)
        
        if (miniApp) {
          await sdk.actions.ready()
          results.push('✅ Mini App ready() called successfully')
        }

        // Test 2: Load existing content
        const content = getAllContent()
        setAllContent(content)
        results.push(`✅ Loaded ${content.length} content items`)
        
        if (content.length > 0) {
          setSelectedContent(content[0])
        }

        // Test 3: Create test content if none exists
        if (content.length === 0) {
          const testContent: ContentMetadata = {
            contentId: 'test-content-' + Date.now(),
            title: 'Test Premium Content',
            description: 'This is a test content for Mini App frame testing',
            contentType: 'text',
            price: '0.1',
            creator: '0x1234567890123456789012345678901234567890',
            ipfsCid: 'QmTestContentHash',
            createdAt: new Date().toISOString(),
            accessType: 'paid',
            customEmbedText: 'Check out this amazing test content!'
          }
          
          storeContent(testContent)
          setAllContent([testContent])
          setSelectedContent(testContent)
          results.push('✅ Created test content')
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
      const frame = generateFrameMetadata(selectedContent, baseUrl)
      const share = generateShareText(selectedContent, selectedContent.customEmbedText)
      
      setFrameMetadata(frame)
      setShareText(share)
    }
  }, [selectedContent])

  const handleContentSelect = (content: ContentMetadata) => {
    setSelectedContent(content)
  }

  const handleTestFrame = async () => {
    if (!selectedContent) return
    
    const results: string[] = []
    
    try {
      // Test frame URL
      const frameUrl = `${process.env.NEXT_PUBLIC_APP_URL}/content/${selectedContent.contentId}`
      results.push(`✅ Frame URL: ${frameUrl}`)
      
      // Test frame metadata
      if (frameMetadata) {
        results.push('✅ Frame metadata generated successfully')
        results.push(`   Button: ${frameMetadata.button.title}`)
        results.push(`   Action: ${frameMetadata.button.action.type}`)
      }
      
      // Test share functionality
      if (isMiniApp) {
        try {
          await sdk.actions.composeCast({
            text: shareText,
            embeds: [frameUrl]
          })
          results.push('✅ Share cast opened successfully')
        } catch (error) {
          results.push(`⚠️ Share test: ${error instanceof Error ? error.message : 'Share failed'}`)
        }
      }
      
    } catch (error) {
      results.push(`❌ Frame test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setTestResults(prev => [...prev, ...results])
  }

  const handleClearContent = () => {
    clearAllContent()
    setAllContent([])
    setSelectedContent(null)
    setTestResults(prev => [...prev, '🗑️ All content cleared'])
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mini App Frame Test</h1>
        
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
                  <p className="text-sm">{isMiniApp ? 'Running in Mini App' : 'Running in Browser'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="text-2xl mr-3 text-blue-600">📦</div>
                <div>
                  <h3 className="font-semibold">Content Storage</h3>
                  <p className="text-sm">{allContent.length} items stored</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Content Management */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Content Management</h2>
              <button
                onClick={handleClearContent}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
            
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
                      onClick={handleTestFrame}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Run Tests
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
                      onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_APP_URL}/content/${selectedContent.contentId}`)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="text-sm bg-gray-100 p-2 rounded break-all">
                    {process.env.NEXT_PUBLIC_APP_URL}/content/{selectedContent.contentId}
                  </div>
                </div>

                {/* Frame Metadata */}
                {frameMetadata && (
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Frame Metadata</h3>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(frameMetadata, null, 2))}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(frameMetadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Share Text */}
                {shareText && (
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Share Text</h3>
                      <button
                        onClick={() => copyToClipboard(shareText)}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                      >
                        Copy Text
                      </button>
                    </div>
                    <div className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {shareText}
                    </div>
                  </div>
                )}

                {/* Test Actions */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-3">Test Actions</h3>
                  <div className="space-y-2">
                    <a
                      href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/content/${selectedContent.contentId}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      🚀 Test in Warpcast
                    </a>
                    
                    {isMiniApp && (
                      <button
                        onClick={handleTestFrame}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        🎯 Test Frame in Mini App
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