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
} from '../lib/contentStorage'
import { getContentDetails, checkContentAccess } from '../lib/hybridWalletSystem'

interface ContentTestSuiteProps {
  className?: string
}

interface TestResult {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  details?: any
}

export default function ContentTestSuite({ className = '' }: ContentTestSuiteProps) {
  const [isMiniApp, setIsMiniApp] = useState(false)
  const [userAddress, setUserAddress] = useState<string>('')
  const [allContent, setAllContent] = useState<ContentMetadata[]>([])
  const [userContent, setUserContent] = useState<ContentMetadata[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentMetadata | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [frameUrl, setFrameUrl] = useState<string>('')
  const [shareText, setShareText] = useState<string>('')
  const [frameMetadata, setFrameMetadata] = useState<any>(null)

  useEffect(() => {
    const initialize = async () => {
      const results: TestResult[] = []
      
      try {
        setIsLoading(true)
        
        // Test 1: Check Mini App environment
        const miniApp = await sdk.isInMiniApp()
        setIsMiniApp(miniApp)
        results.push({
          id: 'mini-app-check',
          type: miniApp ? 'success' : 'warning',
          message: `Mini App Environment: ${miniApp ? 'Yes' : 'No'}`,
          timestamp: new Date()
        })
        
        if (miniApp) {
          await sdk.actions.ready()
          results.push({
            id: 'mini-app-ready',
            type: 'success',
            message: 'Mini App ready() called successfully',
            timestamp: new Date()
          })

          // Get user's wallet address
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            const address = await signer.getAddress()
            setUserAddress(address)
            
            results.push({
              id: 'wallet-address',
              type: 'success',
              message: `User wallet address: ${address}`,
              timestamp: new Date(),
              details: { address }
            })
          }
        }

        // Test 2: Load all content from storage
        const content = getAllContent()
        setAllContent(content)
        results.push({
          id: 'content-load',
          type: 'info',
          message: `Loaded ${content.length} content items from storage`,
          timestamp: new Date(),
          details: { count: content.length }
        })

        // Test 3: Filter user's content
        if (userAddress) {
          const userCreated = content.filter(c => 
            c.creator.toLowerCase() === userAddress.toLowerCase()
          )
          setUserContent(userCreated)
          results.push({
            id: 'user-content',
            type: 'success',
            message: `Found ${userCreated.length} content items created by user`,
            timestamp: new Date(),
            details: { count: userCreated.length, content: userCreated }
          })
        }

        // Test 4: Create test content if none exists
        if (content.length === 0) {
          const testContent: ContentMetadata = {
            contentId: 'test-content-' + Date.now(),
            title: 'Test Premium Content',
            description: 'This is a test content for comprehensive testing',
            contentType: 'text',
            price: '0.1',
            creator: userAddress || '0x1234567890123456789012345678901234567890',
            ipfsCid: 'QmTestContentHash',
            createdAt: new Date().toISOString(),
            accessType: 'paid',
            customEmbedText: 'Check out this amazing test content!'
          }
          
          storeContent(testContent)
          setAllContent([testContent])
          setUserContent([testContent])
          results.push({
            id: 'test-content-created',
            type: 'success',
            message: 'Created test content for testing',
            timestamp: new Date(),
            details: { content: testContent }
          })
        }

        if (userContent.length > 0) {
          setSelectedContent(userContent[0])
        }

      } catch (error) {
        results.push({
          id: 'initialization-error',
          type: 'error',
          message: `Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          details: { error }
        })
      } finally {
        setIsLoading(false)
        setTestResults(results)
      }
    }

    initialize()
  }, [userAddress])

  useEffect(() => {
    if (selectedContent) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'
      const url = `${baseUrl}/content/${selectedContent.contentId}`
      const text = generateShareText(selectedContent, selectedContent.customEmbedText)
      const metadata = generateFrameMetadata(selectedContent, baseUrl)
      
      setFrameUrl(url)
      setShareText(text)
      setFrameMetadata(metadata)
    }
  }, [selectedContent])

  const runComprehensiveTest = async () => {
    const results: TestResult[] = []
    
    try {
      results.push({
        id: 'test-start',
        type: 'info',
        message: 'Starting comprehensive content test suite...',
        timestamp: new Date()
      })

      // Test 1: Content Storage
      results.push({
        id: 'storage-test',
        type: 'info',
        message: 'Testing content storage system...',
        timestamp: new Date()
      })

      const allContent = getAllContent()
      results.push({
        id: 'storage-result',
        type: 'success',
        message: `Content storage working: ${allContent.length} items found`,
        timestamp: new Date(),
        details: { count: allContent.length }
      })

      // Test 2: Frame Generation
      if (selectedContent) {
        results.push({
          id: 'frame-generation',
          type: 'info',
          message: 'Testing frame generation...',
          timestamp: new Date()
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.farcasterpaywall.fun'
        const metadata = generateFrameMetadata(selectedContent, baseUrl)
        
        results.push({
          id: 'frame-result',
          type: 'success',
          message: 'Frame metadata generated successfully',
          timestamp: new Date(),
          details: { metadata }
        })

        // Test 3: Share Text Generation
        const shareText = generateShareText(selectedContent, selectedContent.customEmbedText)
        results.push({
          id: 'share-text',
          type: 'success',
          message: 'Share text generated successfully',
          timestamp: new Date(),
          details: { shareText }
        })

        // Test 4: Frame Sharing (if in Mini App)
        if (isMiniApp) {
          results.push({
            id: 'frame-sharing',
            type: 'info',
            message: 'Testing frame sharing via Farcaster SDK...',
            timestamp: new Date()
          })

          try {
            await sdk.actions.composeCast({
              text: shareText,
              embeds: [frameUrl]
            })
            
            results.push({
              id: 'share-success',
              type: 'success',
              message: 'Frame shared successfully via Farcaster SDK',
              timestamp: new Date()
            })
          } catch (error) {
            results.push({
              id: 'share-error',
              type: 'error',
              message: `Frame sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              details: { error }
            })
          }
        }

        // Test 5: Content Access Check
        if (userAddress) {
          results.push({
            id: 'access-check',
            type: 'info',
            message: 'Testing content access verification...',
            timestamp: new Date()
          })

          try {
            const hasAccess = await checkContentAccess(selectedContent.contentId, userAddress)
            results.push({
              id: 'access-result',
              type: hasAccess ? 'success' : 'warning',
              message: `Content access check: ${hasAccess ? 'Has access' : 'No access'}`,
              timestamp: new Date(),
              details: { hasAccess, contentId: selectedContent.contentId }
            })
          } catch (error) {
            results.push({
              id: 'access-error',
              type: 'error',
              message: `Access check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              timestamp: new Date(),
              details: { error }
            })
          }
        }
      }

      // Test 6: API Endpoints
      results.push({
        id: 'api-test',
        type: 'info',
        message: 'Testing API endpoints...',
        timestamp: new Date()
      })

      if (userAddress) {
        try {
          const createdResponse = await fetch(`/api/user/content/created?address=${userAddress}`)
          const created = await createdResponse.json()
          
          results.push({
            id: 'api-created',
            type: createdResponse.ok ? 'success' : 'error',
            message: `Created content API: ${createdResponse.ok ? 'Working' : 'Failed'}`,
            timestamp: new Date(),
            details: { response: created, status: createdResponse.status }
          })

          const purchasedResponse = await fetch(`/api/user/content/purchased?address=${userAddress}`)
          const purchased = await purchasedResponse.json()
          
          results.push({
            id: 'api-purchased',
            type: purchasedResponse.ok ? 'success' : 'error',
            message: `Purchased content API: ${purchasedResponse.ok ? 'Working' : 'Failed'}`,
            timestamp: new Date(),
            details: { response: purchased, status: purchasedResponse.status }
          })
        } catch (error) {
          results.push({
            id: 'api-error',
            type: 'error',
            message: `API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            details: { error }
          })
        }
      }

    } catch (error) {
      results.push({
        id: 'comprehensive-error',
        type: 'error',
        message: `Comprehensive test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        details: { error }
      })
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

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  const getResultColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading test suite...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Test Suite</h2>
      
      {/* Environment Status */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${isMiniApp ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center">
            <div className={`text-2xl mr-3 ${isMiniApp ? 'text-green-600' : 'text-yellow-600'}`}>
              {isMiniApp ? '✅' : '⚠️'}
            </div>
            <div>
              <h3 className="font-semibold">Mini App</h3>
              <p className="text-sm">{isMiniApp ? 'Ready' : 'Limited'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3 text-blue-600">📦</div>
            <div>
              <h3 className="font-semibold">Total Content</h3>
              <p className="text-sm">{allContent.length} items</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3 text-purple-600">👤</div>
            <div>
              <h3 className="font-semibold">Your Content</h3>
              <p className="text-sm">{userContent.length} items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Content Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Content</h3>
          
          {userContent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>No content found. Create some content first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userContent.map((content) => (
                <div
                  key={content.contentId}
                  onClick={() => handleContentSelect(content)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedContent?.contentId === content.contentId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <h4 className="font-semibold">{content.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                  <div className="flex justify-between items-center">
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

        {/* Test Results */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <button
              onClick={runComprehensiveTest}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              🧪 Run Tests
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-2">
            {testResults.map((result) => (
              <div key={result.id} className="p-3 border border-gray-200 rounded">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">{getResultIcon(result.type)}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${getResultColor(result.type)}`}>
                      {result.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">View Details</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frame Information */}
      {selectedContent && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Frame Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Frame URL</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={frameUrl}
                  readOnly
                  className="flex-1 p-2 border rounded text-sm bg-white"
                />
                <button
                  onClick={() => copyToClipboard(frameUrl)}
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Share Text</h4>
              <div className="flex items-center space-x-2">
                <textarea
                  value={shareText}
                  readOnly
                  rows={3}
                  className="flex-1 p-2 border rounded text-sm bg-white resize-none"
                />
                <button
                  onClick={() => copyToClipboard(shareText)}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Frame Preview */}
          {frameMetadata && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Frame Metadata</h4>
              <div className="bg-white p-3 border rounded">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(frameMetadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Test Actions */}
          <div className="mt-4 flex space-x-2">
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              🚀 Test in Warpcast
            </a>
            
            {isMiniApp && (
              <button
                onClick={async () => {
                  try {
                    await sdk.actions.composeCast({
                      text: shareText,
                      embeds: [frameUrl]
                    })
                    alert('Frame shared successfully!')
                  } catch (error) {
                    alert(`Failed to share frame: ${error}`)
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                📱 Share via SDK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 