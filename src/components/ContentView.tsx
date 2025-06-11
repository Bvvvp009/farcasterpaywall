'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { USDC_CONTRACT_ADDRESS, PLATFORM_FEE_THRESHOLD, PLATFORM_FEE_PERCENTAGE } from '../lib/constants'
import { usdcABI } from '../lib/contracts'
import { formatUSDC, usdcToBigInt } from '../lib/utils'
import { getIPFSGatewayURL } from '../lib/ipfs'
import { 
  decryptContent, 
  decryptKeyForUser,
  generatePaymentProof
} from '../lib/encryption-secure'
import { useUSDCApprove, useUSDCTransfer } from '../lib/wallet'
import { FrameHandler } from './FrameHandler'
import { useSearchParams } from 'next/navigation'

type ContentMetadata = {
  title: string
  description: string
  contentType: 'image' | 'video' | 'text' | 'article'
  accessType: 'free' | 'paid'
  contentCid: string
  contentUrl: string
  encryptedContent?: string
  encryptionKey?: any
  creator: string
  tipAmount: string
  createdAt: string
  isEncrypted?: boolean
  originalFileType?: string
  revenue?: {
    totalTips: number
    totalAmount: number
    platformFees: number
    netAmount: number
  }
}

interface ContentViewProps {
  cid: string
}

export default function ContentView({ cid }: ContentViewProps) {
  const { address } = useAccount()
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedFileType, setDecryptedFileType] = useState<string | null>(null)
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<{hasPaid: boolean, amount?: string} | null>(null)
  
  const searchParams = useSearchParams()
  const isPaymentAction = searchParams.get('action') === 'pay'

  useEffect(() => {
    let cancelled = false;
    const fetchMetadata = async () => {
      setIsLoading(true);
      setError(null);
      let metadataFetched = false;
      for (let i = 0; i < 10; i++) { // Try for up to ~5 seconds
        try {
          const response = await fetch(`/api/content/${cid}`);
          if (response.ok) {
            const content = await response.json();
            setMetadata(content);
            metadataFetched = true;
            break;
          }
        } catch (err) {
          // Ignore and retry
        }
        await new Promise(res => setTimeout(res, 500));
        if (cancelled) return;
      }
      if (!metadataFetched) {
        setError('Content not found or still saving. Please try again in a few seconds.');
      }
      setIsLoading(false);
    };

    fetchMetadata();
    return () => { cancelled = true; };
  }, [cid]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!metadata) return

      if (metadata.accessType === 'free') {
        setHasAccess(true)
        return
      }

      if (!address) {
        setHasAccess(false)
        return
      }

      try {
        const response = await fetch('/api/payments/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: cid,
            userAddress: address,
          }),
        })
        
        if (response.ok) {
          const data = await response.json()
          setPaymentStatus(data)
          setHasAccess(data.hasPaid)

          // If this is a payment action from the frame, show the tip modal
          if (isPaymentAction && !data.hasPaid) {
            setShowTipModal(true)
          }
        } else {
          console.error('Failed to check payment status:', response.status)
          setHasAccess(false)
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
        setError('Failed to check payment status')
        setHasAccess(false)
      }
    }

    checkAccess()
  }, [metadata, address, cid, isPaymentAction])

  // If the user navigates to the page with ?action=pay and hasn't paid, show the tip modal
  useEffect(() => {
    if (isPaymentAction && metadata && metadata.accessType === 'paid' && !hasAccess) {
      setShowTipModal(true)
    }
  }, [isPaymentAction, metadata, hasAccess])

  const handleDecrypt = async () => {
    if (!metadata || !metadata.encryptedContent || !metadata.encryptionKey || !address) {
      setError('No encrypted content or key available for decryption')
      return
    }

    setIsDecrypting(true)
    setError(null)
    setDecryptedContent(null)
    setDecryptedFileType(null)
    setDecryptedImageUrl(null)

    try {
      console.log('=== DECRYPTING CONTENT ===')
      console.log('Decrypting content for user:', address)

      // Check if user has paid
      if (paymentStatus && !paymentStatus.hasPaid) {
        throw new Error('Payment required to decrypt this content')
      }

      // Use the stored payment proof from the encryption key metadata
      const storedPaymentProof = metadata.encryptionKey.paymentProof
      console.log('Using stored payment proof for decryption')

      // Decrypt the key for the user
      const decryptedKey = await decryptKeyForUser(
        metadata.encryptionKey, 
        address,
        cid,
        storedPaymentProof
      )
      console.log('Key decrypted successfully')

      // Decrypt the content
      const decrypted = await decryptContent(metadata.encryptedContent, decryptedKey)
      console.log('Content decrypted successfully')

      // Determine if this is an image based on the original file type
      const isImage = metadata.contentType === 'image' || 
                     metadata.originalFileType?.startsWith('image/')

      if (isImage) {
        console.log('Detected image content, converting from base64')
        setDecryptedFileType('image')
        
        // Convert base64 back to image
        const imageBlob = new Blob([Buffer.from(decrypted, 'base64')], { 
          type: metadata.originalFileType || 'image/jpeg' 
        })
        const imageUrl = URL.createObjectURL(imageBlob)
        setDecryptedImageUrl(imageUrl)
        setDecryptedContent(decrypted) // Keep base64 for verification
        console.log('Image URL created:', imageUrl)
      } else {
        console.log('Detected text content')
        setDecryptedFileType('text')
        setDecryptedContent(decrypted)
      }

      console.log('=== DECRYPTION COMPLETE ===')

    } catch (err) {
      console.error('Decrypt failed:', err)
      setError(err instanceof Error ? err.message : 'Decrypt failed')
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleTipSuccess = async (txHash: string) => {
    try {
      // Record the payment
      const recordResponse = await fetch('/api/payments/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: cid,
          userAddress: address,
          txHash,
          amount: metadata?.tipAmount || '0',
          timestamp: Math.floor(Date.now() / 1000),
        }),
      })

      if (recordResponse.ok) {
        console.log('Payment recorded successfully')
        setHasAccess(true)
        setPaymentStatus({ hasPaid: true, amount: metadata?.tipAmount })
        setShowTipModal(false)
        
        // If this is encrypted content, automatically decrypt it
        if (metadata?.isEncrypted) {
          await handleDecrypt()
        }
      } else {
        console.error('Failed to record payment')
        setError('Payment successful but failed to record. Please contact support.')
      }
    } catch (err) {
      console.error('Error recording payment:', err)
      setError('Payment successful but failed to record. Please contact support.')
    }
  }

  const fetchContent = async () => {
    if (!metadata) return

    try {
      const response = await fetch(metadata.contentUrl)
      if (!response.ok) throw new Error('Failed to fetch content')
      
      if (metadata.contentType === 'text' || metadata.contentType === 'article') {
        const text = await response.text()
        setDecryptedContent(text)
      } else {
        // For images and videos, we'll use the URL directly
        setDecryptedContent(metadata.contentUrl)
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

  const renderContent = () => {
    if (!decryptedContent || !metadata) return null

    switch (metadata.contentType) {
      case 'image':
        return <img src={decryptedContent} alt={metadata.title} className="max-w-full rounded-lg" />
      case 'video':
        return (
          <video controls className="max-w-full rounded-lg">
            <source src={decryptedContent} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )
      case 'article':
        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: decryptedContent }} />
      case 'text':
        return <div className="whitespace-pre-wrap">{decryptedContent}</div>
      default:
        return null
    }
  }

  const handleFrameAction = async (action: 'view' | 'pay') => {
    if (!metadata) return

    if (action === 'pay' && metadata.accessType === 'paid') {
      // Handle payment flow
      setIsDecrypting(true)
      try {
        await handleDecrypt()
        setHasAccess(true)
      } catch (err) {
        console.error('Payment failed:', err)
        setError('Payment failed. Please try again.')
      } finally {
        setIsDecrypting(false)
      }
    } else if (action === 'view') {
      // Handle view action
      if (metadata.accessType === 'free' || hasAccess) {
        // Load content if it's free or user has paid
        await fetchContent()
      }
    }
  }

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
    <div className="max-w-4xl mx-auto p-4">
      <FrameHandler cid={cid} onFrameAction={handleFrameAction} />
      
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : metadata ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-2">{metadata.title}</h1>
            <p className="text-gray-600 mb-4">{metadata.description}</p>
            
            {metadata.accessType === 'paid' && !hasAccess && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">This is paid content</p>
                <p className="text-sm mt-1">Tip {metadata.tipAmount} USDC to access this content</p>
                <button
                  onClick={() => setShowTipModal(true)}
                  className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                >
                  Pay to Access
                </button>
              </div>
            )}

            {decryptedContent ? (
              <div className="mt-4">
                {renderContent()}
              </div>
            ) : (
              <div className="text-center py-8">
                <button
                  onClick={() => handleFrameAction('view')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                >
                  View Content
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">Content not found</div>
      )}

      {/* Tip Modal */}
      {showTipModal && metadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Pay to Access Content</h2>
            <p className="text-gray-600 mb-4">
              Tip {metadata.tipAmount} USDC to access this content
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setShowTipModal(false)}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 