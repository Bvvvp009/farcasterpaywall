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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-pink-800">
            Farcaster Paywall Mini App
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Create and share exclusive content with your Farcaster followers.
            Monetize your content through individual tips or monthly subscriptions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/create" className="group">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Content</h3>
                <p className="text-gray-600 text-sm">Upload and encrypt premium content with USDC payments</p>
              </div>
            </Link>

            <Link href="/subscription-setup" className="group">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">💎</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Subscription Setup</h3>
                <p className="text-gray-600 text-sm">Set up creator subscription offerings</p>
              </div>
            </Link>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-blue-50 rounded-lg border border-pink-200">
            <h2 className="text-2xl font-semibold mb-4 text-pink-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">1. Create</h3>
                <p className="text-gray-600">
                  Upload your content and choose between individual tips or subscription access.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">2. Subscribe</h3>
                <p className="text-gray-600">
                  Set up monthly subscriptions for recurring revenue from your followers.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">3. Share</h3>
                <p className="text-gray-600">
                  Share your content with your Farcaster followers.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">4. Earn</h3>
                <p className="text-gray-600">
                  Receive USDC tips and subscription payments when followers access your content.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 text-blue-800">New: Subscription Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">For Creators</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Set monthly subscription fees</li>
                  <li>• Create exclusive content for subscribers</li>
                  <li>• Recurring revenue from loyal followers</li>
                  <li>• Manage subscription benefits and descriptions</li>
                </ul>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-blue-800">For Subscribers</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Subscribe to favorite creators</li>
                  <li>• Access all premium content for 30 days</li>
                  <li>• Easy payment through Farcaster</li>
                  <li>• Cancel anytime to stop future charges</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 

//ngrok http --url=rested-mastodon-truly.ngrok-free.app 3000