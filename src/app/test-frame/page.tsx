'use client'

import React, { useState, useEffect } from 'react'
import { getContent, getAllContent, generateFrameMetadata, generateShareText } from '../../lib/contentStorage'

export default function TestFramePage() {
  const [allContent, setAllContent] = useState<any[]>([])
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [frameMetadata, setFrameMetadata] = useState<any>(null)
  const [shareText, setShareText] = useState<string>('')

  useEffect(() => {
    // Get all stored content
    const content = getAllContent()
    setAllContent(content)
    
    if (content.length > 0) {
      setSelectedContent(content[0])
    }
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

  const handleContentSelect = (content: any) => {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Frame Test Page</h1>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Content List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Stored Content</h2>
            
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

          {/* Frame Preview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Frame Preview</h2>
            
            {selectedContent ? (
              <div className="space-y-4">
                {/* Content Details */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-2">Content Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><strong>ID:</strong> {selectedContent.contentId}</div>
                    <div><strong>Title:</strong> {selectedContent.title}</div>
                    <div><strong>Price:</strong> {selectedContent.price} USDC</div>
                    <div><strong>Type:</strong> {selectedContent.accessType}</div>
                    <div><strong>Creator:</strong> {selectedContent.creator}</div>
                  </div>
                </div>

                {/* Frame Metadata */}
                {frameMetadata && (
                  <div className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Frame Metadata</h3>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(frameMetadata, null, 2))}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Copy JSON
                      </button>
                    </div>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
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
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Copy Text
                      </button>
                    </div>
                    <div className="text-sm bg-gray-100 p-2 rounded whitespace-pre-wrap">
                      {shareText}
                    </div>
                  </div>
                )}

                {/* Frame URL */}
                <div className="border border-gray-200 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Frame URL</h3>
                    <button
                      onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_APP_URL}/content/${selectedContent.contentId}`)}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Copy URL
                    </button>
                  </div>
                  <div className="text-sm bg-gray-100 p-2 rounded break-all">
                    {process.env.NEXT_PUBLIC_APP_URL}/content/{selectedContent.contentId}
                  </div>
                </div>

                {/* Test Frame */}
                <div className="border border-gray-200 rounded p-4">
                  <h3 className="font-semibold mb-2">Test Frame</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Copy the Frame URL and paste it in Warpcast to test the frame:
                  </p>
                  <a
                    href={`https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/content/${selectedContent.contentId}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    🚀 Test in Warpcast
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select content to preview frame</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 