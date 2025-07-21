'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface ContentViewProps {
  cid: string
}

export default function ContentView({ cid }: ContentViewProps) {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const action = searchParams.get('action')

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/content/${cid}`)
        
        if (!res.ok) {
          throw new Error('Content not found')
        }
        
        const contentData = await res.json()
        setContent(contentData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [cid])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Content Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">This content may be encrypted or no longer available.</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Content Not Available</h1>
          <p className="text-gray-600">The requested content could not be loaded.</p>
        </div>
      </div>
    )
  }

  // If this is a payment action, show payment interface
  if (action === 'pay' && content.accessType === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{content.title}</h1>
            <p className="text-gray-600 mb-6">{content.description}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-semibold">
                Unlock this content for {content.tipAmount} USDC
              </p>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Pay with Farcaster Wallet
            </button>
            
            <p className="text-sm text-gray-500 mt-4">
              This content is encrypted and requires payment to access.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show the actual content
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{content.title}</h1>
        <p className="text-gray-600 mb-6">{content.description}</p>
        
        {content.contentType === 'image' && (
          <div className="mb-6">
            <img 
              src={content.contentUrl} 
              alt={content.title}
              className="max-w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        )}
        
        {content.contentType === 'text' && (
          <div className="prose max-w-none">
            <div className="bg-gray-50 p-6 rounded-lg">
              <pre className="whitespace-pre-wrap text-gray-800">{content.content}</pre>
            </div>
          </div>
        )}
        
        {content.contentType === 'json' && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <pre className="text-sm text-gray-800 overflow-auto">
              {JSON.stringify(content.content, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Content ID: {cid}
          </p>
          {content.creator && (
            <p className="text-sm text-gray-500">
              Created by: {content.creator}
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 