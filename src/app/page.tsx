'use client'

import { useEffect } from 'react'
import { sdk } from '@farcaster/frame-sdk'
import Link from 'next/link'

export default function HomePage() {
  useEffect(() => {
    // Initialize the Mini App
    const initMiniApp = async () => {
      try {
        console.log('Initializing Mini App...')
        // Check if we're in a Mini App environment
        const isMiniApp = await sdk.isInMiniApp()
        console.log('Is Mini App environment:', isMiniApp)
        
        if (isMiniApp) {
          console.log('App loaded, calling ready()...')
          // Hide the splash screen when the app is ready
          await sdk.actions.ready()
          console.log('ready() called successfully')
        }
      } catch (error) {
        console.error('Failed to initialize Mini App:', error)
      }
    }

    // Call initMiniApp immediately when component mounts
    initMiniApp()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Farcaster Paywall</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Content
              </Link>
              
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Profile
              </Link>
              

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Premium Content
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access exclusive articles, videos, and insights from top creators in the blockchain space.
            Pay with USDC and unlock valuable content instantly.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">
          <Link href="/create" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Content</h3>
              <p className="text-gray-600 text-sm">Upload and encrypt premium content for monetization</p>
            </div>
          </Link>

          <Link href="/profile" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">👤</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Profile</h3>
              <p className="text-gray-600 text-sm">Manage your content and view analytics</p>
            </div>
          </Link>

          <Link href="/test-frame-sharing" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Frame Sharing</h3>
              <p className="text-gray-600 text-sm">Test frame generation and sharing functionality</p>
            </div>
          </Link>

          <Link href="/test-mini-app" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mini App Tests</h3>
              <p className="text-gray-600 text-sm">Comprehensive Mini App environment testing</p>
            </div>
          </Link>

          <Link href="/test-existing-content" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Existing Content</h3>
              <p className="text-gray-600 text-sm">Test your existing encrypted content as frames</p>
            </div>
          </Link>

          <Link href="/test-content-storage" className="group">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
              <div className="text-3xl mb-3">💾</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Content Storage Test</h3>
              <p className="text-gray-600 text-sm">Test content storage and frame generation</p>
            </div>
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">Pay with USDC on Base network for instant access to premium content.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Access</h3>
            <p className="text-gray-600">Get immediate access to content after payment confirmation.</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Quality Content</h3>
            <p className="text-gray-600">Curated content from verified creators in the blockchain space.</p>
          </div>
        </div>

        {/* Content Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Supported Content Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📝</div>
              <h3 className="font-semibold text-gray-900 mb-1">Text</h3>
              <p className="text-sm text-gray-600">Articles, guides, and written content</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">📄</div>
              <h3 className="font-semibold text-gray-900 mb-1">Articles</h3>
              <p className="text-sm text-gray-600">Long-form content with markdown support</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🎥</div>
              <h3 className="font-semibold text-gray-900 mb-1">Videos</h3>
              <p className="text-sm text-gray-600">Video content and tutorials</p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-2">🖼️</div>
              <h3 className="font-semibold text-gray-900 mb-1">Images</h3>
              <p className="text-sm text-gray-600">Visual content and graphics</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}