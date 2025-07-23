'use client'

import React, { useState } from 'react'
import HybridContentManager from '../../components/HybridContentManager'

export default function HybridDemoPage() {
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [createdContent, setCreatedContent] = useState<any>(null)
  const [accessGranted, setAccessGranted] = useState(false)

  const handleContentCreated = (txHash: string) => {
    setCreatedContent({
      txHash,
      contentId: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    })
    setSelectedContentId(`content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  }

  const handleAccessGranted = () => {
    setAccessGranted(true)
  }

  const handleError = (error: string) => {
    console.error('Demo error:', error)
    // You could show a toast notification here
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hybrid Wallet System Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demo showcases the hybrid approach combining Farcaster's native capabilities 
            with external RPC for reliable contract interactions.
          </p>
        </div>

        {/* Demo Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">How It Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">✅ What Works</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Farcaster user authentication</li>
                <li>• Native USDC payments via sendToken</li>
                <li>• External RPC for contract reads</li>
                <li>• Reliable gas estimation</li>
                <li>• Transaction confirmation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Architecture</h3>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Content Creation: External RPC</li>
                <li>• Payments: Farcaster Native</li>
                <li>• Access Verification: External RPC</li>
                <li>• User Auth: Farcaster Context</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Demo */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Content Manager */}
          <div>
            <HybridContentManager
              contentId={selectedContentId}
              onContentCreated={handleContentCreated}
              onAccessGranted={handleAccessGranted}
              onError={handleError}
            />
          </div>

          {/* Demo Status */}
          <div className="space-y-6">
            {/* Created Content */}
            {createdContent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  ✅ Content Created Successfully
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Content ID:</span>
                    <span className="font-mono">{createdContent.contentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Transaction:</span>
                    <span className="font-mono text-xs">{createdContent.txHash}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{new Date(createdContent.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContentId(createdContent.contentId)}
                  className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Test Access to This Content
                </button>
              </div>
            )}

            {/* Access Status */}
            {accessGranted && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">
                  🎉 Content Access Granted
                </h3>
                <p className="text-purple-700 text-sm mb-4">
                  Payment was successful and access has been granted. 
                  The content would now be decrypted and displayed here.
                </p>
                <div className="bg-purple-100 p-4 rounded-md">
                  <h4 className="font-semibold text-purple-800 mb-2">Sample Decrypted Content:</h4>
                  <p className="text-purple-700 text-sm">
                    "This is the premium content that was encrypted and is now accessible 
                    after successful payment verification. The hybrid system worked perfectly!"
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Demo Instructions
              </h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. <strong>Create Content:</strong> Fill out the form and create premium content</li>
                <li>2. <strong>Test Access:</strong> Use the generated content ID to test access</li>
                <li>3. <strong>Make Payment:</strong> Use Farcaster's native payment system</li>
                <li>4. <strong>Verify Access:</strong> See the content after payment verification</li>
              </ol>
            </div>

            {/* Technical Details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                🔧 Technical Implementation
              </h3>
              <div className="space-y-2 text-sm text-yellow-800">
                <div>
                  <strong>Content Creation:</strong> Uses external RPC with proper gas estimation
                </div>
                <div>
                  <strong>Payments:</strong> Uses Farcaster's native sendToken action
                </div>
                <div>
                  <strong>Access Verification:</strong> Uses external RPC for contract reads
                </div>
                <div>
                  <strong>User Authentication:</strong> Uses Farcaster context and wallet
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            This demo showcases the hybrid approach that combines the best of both worlds: 
            Farcaster's native capabilities for user experience and external RPC for reliability.
          </p>
        </div>
      </div>
    </div>
  )
} 