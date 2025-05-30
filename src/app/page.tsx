'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Farcaster Paywall Mini App
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Create and share exclusive content with your Farcaster followers.
            Monetize your content by requiring USDC tips for access.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/create"
              className="block p-8 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <h2 className="text-2xl font-semibold mb-4">Create Content</h2>
              <p className="text-gray-600">
                Upload your content and set a tip amount to monetize your work.
              </p>
            </Link>

            <div className="p-8 bg-white rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">View Content</h2>
              <p className="text-gray-600 mb-4">
                Enter a content ID to view paywalled content.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter content ID"
                  className="flex-1 p-2 border rounded"
                  aria-label="Content ID"
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input')
                    if (input?.value) {
                      window.location.href = `/content/${input.value}`
                    }
                  }}
                  className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
                  aria-label="View content"
                >
                  View
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 p-8 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Create</h3>
                <p className="text-gray-600">
                  Upload your content and set a tip amount in USDC.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">2. Share</h3>
                <p className="text-gray-600">
                  Share your content with your Farcaster followers.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">3. Earn</h3>
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