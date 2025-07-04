'use client'

import { useState } from 'react'
import { 
  generateFrameUrl, 
  generateShareText, 
  generateWarpcastShareUrl, 
  generateFrameMetadata,
  copyToClipboard, 
  shareContent,
  type ContentMetadata 
} from '../lib/frame-utils'

interface FrameShareProps {
  contentCid: string
  content: ContentMetadata
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FrameShare({ contentCid, content, className = '', size = 'md' }: FrameShareProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)

  const frameUrl = generateFrameUrl(contentCid)
  const shareText = generateShareText(content, content.customEmbedText)
  // Always use the frameUrl as the embed for Warpcast
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds=${encodeURIComponent(frameUrl)}`
  
  // Generate the actual Frame metadata that will be used
  const frameMetadata = generateFrameMetadata(content, frameUrl, 'Farcaster Mini')
  const frameMetaTag = JSON.stringify(frameMetadata)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  }

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(frameUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyMetadata = async () => {
    const success = await copyToClipboard(frameMetaTag)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      await shareContent(content.title, shareText, frameUrl)
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <h4 className={`font-medium text-blue-800 mb-3 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
        🚀 Share as Farcaster Frame
      </h4>
      
      <p className={`text-blue-700 mb-3 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        Share your content as an interactive Frame in Farcaster feeds. When someone shares this URL in Farcaster, it will automatically display as a rich, interactive card.
      </p>

      {/* Frame URL */}
      <div className="mb-3">
        <label className={`block font-medium text-blue-700 mb-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          Frame URL (Share this link):
        </label>
        <div className="flex">
          <input
            type="text"
            value={frameUrl}
            readOnly
            className={`flex-1 p-2 border border-blue-300 rounded-l bg-white ${sizeClasses[size]}`}
            title="Frame URL to share"
            placeholder="Frame URL"
          />
          <button
            onClick={handleCopyUrl}
            className={`px-3 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 font-medium ${sizeClasses[size]}`}
            title="Copy Frame URL"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className={`text-blue-600 mt-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          This URL contains the Frame metadata and will display as an interactive card when shared in Farcaster
        </p>
      </div>

      {/* Frame Metadata Toggle */}
      <div className="mb-3">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className={`text-blue-600 hover:text-blue-800 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        >
          {showMetadata ? '🔽 Hide' : '🔼 Show'} Frame Metadata
        </button>
        
        {showMetadata && (
          <div className="mt-2 p-3 bg-gray-100 border border-gray-300 rounded">
            <div className="flex justify-between items-start mb-2">
              <label className={`block font-medium text-gray-700 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                fc:frame meta tag content:
              </label>
              <button
                onClick={handleCopyMetadata}
                className={`px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700`}
                title="Copy Frame metadata"
              >
                Copy
              </button>
            </div>
            <textarea
              value={frameMetaTag}
              readOnly
              rows={8}
              className={`w-full p-2 border border-gray-300 rounded bg-white font-mono ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
              title="Frame metadata JSON"
            />
            <p className={`text-gray-600 mt-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              This metadata is automatically included in the page and enables Frame functionality
            </p>
          </div>
        )}
      </div>

      {/* Share Buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={warpcastUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center bg-purple-600 text-white rounded hover:bg-purple-700 font-medium ${sizeClasses[size]}`}
          title="Share on Warpcast"
        >
          <svg className={`${iconSize[size]} mr-2`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          Share on Warpcast
        </a>
        
        <button
          onClick={handleShare}
          disabled={sharing}
          className={`inline-flex items-center bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50 ${sizeClasses[size]}`}
          title="Share via system share sheet"
        >
          <svg className={`${iconSize[size]} mr-2`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
          </svg>
          {sharing ? 'Sharing...' : 'Share'}
        </button>

        <a
          href={`/content/${contentCid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center bg-gray-600 text-white rounded hover:bg-gray-700 font-medium ${sizeClasses[size]}`}
          title="View content"
        >
          <svg className={`${iconSize[size]} mr-2`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          View Content
        </a>
      </div>

      {/* Frame Preview */}
      <div className="mt-4 p-3 bg-white border border-gray-200 rounded">
        <h5 className={`font-medium text-gray-800 mb-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          👀 How it appears in Farcaster
        </h5>
        <div className="bg-gray-50 border border-gray-300 rounded overflow-hidden">
          <div className="aspect-[3/2] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-center">
              <div className={`mb-2 ${size === 'sm' ? 'text-lg' : 'text-2xl'}`}>📄</div>
              <div className={`font-medium text-gray-800 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                {content.title}
              </div>
              <div className={`text-gray-600 mt-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                {content.description}
              </div>
            </div>
          </div>
          <div className="p-2 bg-gray-100 border-t">
            <button className={`w-full bg-blue-600 text-white py-1 px-3 rounded font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {content.accessType === 'paid' ? `Pay ${content.tipAmount} USDC` : 'View Content'}
            </button>
          </div>
        </div>
        <p className={`text-gray-600 mt-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          When shared in Farcaster, this will appear as an interactive Frame with the button above
        </p>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h6 className={`font-medium text-yellow-800 mb-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          📋 How to share as a Frame:
        </h6>
        <ol className={`text-yellow-700 space-y-1 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          <li>1. Copy the Frame URL above</li>
          <li>2. Paste it in any Farcaster client (Warpcast, etc.)</li>
          <li>3. The content will automatically display as an interactive Frame</li>
          <li>4. Users can click the button to view/pay for your content</li>
        </ol>
      </div>
    </div>
  )
} 