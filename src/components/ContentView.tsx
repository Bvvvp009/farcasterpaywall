'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useUSDCTransfer, formatUSDC } from '@/lib/wallet'
import { getIPFSGatewayURL } from '@/lib/ipfs'

type ContentMetadata = {
  title: string
  description: string
  contentType: 'image' | 'video' | 'text' | 'article'
  contentCid: string
  contentUrl: string
  creator: string
  tipAmount: string
  createdAt: string
}

type ContentViewProps = {
  metadataCid: string
}

export function ContentView({ metadataCid }: ContentViewProps) {
  const { address } = useAccount()
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)

  const { write: transferUSDC, isLoading: isTransferring } = useUSDCTransfer()

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(getIPFSGatewayURL(metadataCid))
        if (!response.ok) throw new Error('Failed to fetch metadata')
        const data = await response.json()
        setMetadata(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [metadataCid])

  const handleTip = async () => {
    if (!address || !metadata) return

    try {
      // TODO: Check if user has already tipped
      await transferUSDC({
        args: [metadata.creator, BigInt(metadata.tipAmount)],
      })
      setHasAccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process tip')
    }
  }

  const fetchContent = async () => {
    if (!metadata) return

    try {
      const response = await fetch(metadata.contentUrl)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      if (metadata.contentType === 'text' || metadata.contentType === 'article') {
        const text = await response.text()
        setContent(text)
      } else {
        // For images and videos, we'll use the URL directly
        setContent(metadata.contentUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content')
    }
  }

  useEffect(() => {
    if (hasAccess && metadata) {
      fetchContent()
    }
  }, [hasAccess, metadata])

  if (isLoading) {
    return (
      <div className="text-center p-4">
        Loading content...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4" role="alert">
        {error}
      </div>
    )
  }

  if (!metadata) {
    return (
      <div className="text-center p-4">
        Content not found
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-4">{metadata.title}</h1>
      <p className="text-gray-600 mb-6">{metadata.description}</p>

      {!hasAccess ? (
        <div className="text-center p-6 border rounded-lg bg-gray-50">
          <p className="mb-4">
            Tip {formatUSDC(metadata.tipAmount)} USDC to access this content
          </p>
          <button
            onClick={handleTip}
            disabled={!address || isTransferring}
            className="bg-primary-600 text-white py-2 px-6 rounded hover:bg-primary-700 disabled:opacity-50"
            aria-label={`Tip ${formatUSDC(metadata.tipAmount)} USDC to access content`}
            title="Tip to access content"
          >
            {isTransferring ? 'Processing...' : 'Tip to Access'}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {metadata.contentType === 'image' && content && (
            <img
              src={content}
              alt={metadata.title}
              className="max-w-full h-auto rounded-lg"
            />
          )}

          {metadata.contentType === 'video' && content && (
            <video
              src={content}
              controls
              className="max-w-full rounded-lg"
              title={metadata.title}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {metadata.contentType === 'text' && content && (
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          )}

          {metadata.contentType === 'article' && content && (
            <div className="prose max-w-none">
              <article>{content}</article>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>Created by: {metadata.creator}</p>
        <p>Created at: {new Date(metadata.createdAt).toLocaleString()}</p>
      </div>
    </div>
  )
} 