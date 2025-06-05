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
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4 text-pink-800">
            Farcaster Paywall Mini App
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Create and share exclusive content with your Farcaster followers.
            Monetize your content by requiring USDC tips for access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/create"
              className="block p-6 bg-pink-50 rounded-lg border border-pink-200 hover:bg-pink-100 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-3 text-pink-800">Create Content</h2>
              <p className="text-gray-600">
                Upload your content and set a tip amount to monetize your work.
              </p>
            </Link>

            <Link
              href="/profile"
              className="block p-6 bg-pink-50 rounded-lg border border-pink-200 hover:bg-pink-100 transition-colors"
            >
              <h2 className="text-2xl font-semibold mb-3 text-pink-800">Your Profile</h2>
              <p className="text-gray-600">
                View your content and track your earnings.
              </p>
            </Link>
          </div>

          <div className="mt-8 p-6 bg-pink-50 rounded-lg border border-pink-200">
            <h2 className="text-2xl font-semibold mb-4 text-pink-800">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">1. Create</h3>
                <p className="text-gray-600">
                  Upload your content and set a tip amount in USDC.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">2. Share</h3>
                <p className="text-gray-600">
                  Share your content with your Farcaster followers.
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-pink-800">3. Earn</h3>
                <p className="text-gray-600">
                  Receive USDC tips when followers access your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 

//ngrok http --url=rested-mastodon-truly.ngrok-free.app 3000