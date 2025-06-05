'use client'

import { useState } from 'react'

export default function TestPage() {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTestContent = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/test-content')
      if (!response.ok) throw new Error('Failed to generate test content')
      const data = await response.json()
      setShareUrl(data.shareUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test content')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Frame Preview Test</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Generate Test Content</h2>
          <p className="text-gray-600 mb-4">
            Click the button below to generate a test content item that you can use to verify frame functionality.
          </p>
          
          <button
            onClick={generateTestContent}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Test Content'}
          </button>

          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}

          {shareUrl && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Share URL:</h3>
              <div className="flex items-center space-x-2">
                <label htmlFor="shareUrl" className="sr-only">Share URL</label>
                <input
                  id="shareUrl"
                  type="text"
                  value={shareUrl}
                  readOnly
                  aria-label="Share URL for testing frame preview"
                  className="flex-1 p-2 border rounded bg-gray-50"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="bg-gray-100 px-3 py-2 rounded hover:bg-gray-200"
                  aria-label="Copy share URL to clipboard"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Copy this URL and share it in a Farcaster cast to test the frame preview.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Click "Generate Test Content" to create a test article</li>
            <li>Copy the generated share URL</li>
            <li>Share the URL in a Farcaster cast</li>
            <li>Verify that the frame preview shows:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>Correct title and description</li>
                <li>"Pay 1.00 USDC" button for paid content</li>
                <li>Proper preview image with paid overlay</li>
              </ul>
            </li>
            <li>Click the button in the frame to test the interaction</li>
          </ol>
        </div>
      </div>
    </div>
  )
} 