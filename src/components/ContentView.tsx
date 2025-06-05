'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { USDC_CONTRACT_ADDRESS, PLATFORM_FEE_THRESHOLD, PLATFORM_FEE_PERCENTAGE } from '../lib/constants'
import { usdcABI } from '../lib/contracts'
import { formatUSDC, usdcToBigInt } from '../lib/utils'
import { getIPFSGatewayURL } from '../lib/ipfs'
import { decryptContent, decryptKeyForUser } from '../lib/encryption'
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
  encryptionKey?: string
  creator: string
  tipAmount: string
  createdAt: string
  revenue?: {
    totalTips: number
    totalAmount: number
    platformFees: number
    netAmount: number
  }
}

export type ContentViewProps = {
  cid: string
}

export default function ContentView({ cid }: ContentViewProps) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [isTipping, setIsTipping] = useState(false)
  const [tipAmount, setTipAmount] = useState<bigint | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [tipSuccess, setTipSuccess] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const searchParams = useSearchParams()
  const isPaymentAction = searchParams.get('action') === 'pay'

  const { write: approveWrite, isLoading: isApproving, isSuccess: isApproveSuccess } = useUSDCApprove()
  const { write: transferWrite, isLoading: isTransferring, isSuccess: isTransferSuccess } = useUSDCTransfer()

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
        const response = await fetch(`/api/payments/check?cid=${cid}&address=${address}`)
        const data = await response.json()
        setHasAccess(data.hasPaid)

        // If this is a payment action from the frame, show the tip modal
        if (isPaymentAction && !data.hasPaid) {
          setShowTipModal(true)
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
        setError('Failed to check payment status')
      }
    }

    checkAccess()
  }, [metadata, address, cid, isPaymentAction])

  const handleTip = async () => {
    if (!address || !metadata) return

    setIsTipping(true)
    setError(null)

    try {
      const tipAmount = parseFloat(metadata.tipAmount)
      if (isNaN(tipAmount) || tipAmount <= 0) {
        throw new Error('Invalid tip amount')
      }

      // Calculate platform fee (10% for tips above $0.1)
      const platformFee = tipAmount > PLATFORM_FEE_THRESHOLD ? tipAmount * PLATFORM_FEE_PERCENTAGE : 0
      const creatorAmount = tipAmount - platformFee

      // Approve USDC transfer
      const approveTxHash = await approveWrite({ 
        args: [USDC_CONTRACT_ADDRESS as `0x${string}`, usdcToBigInt(tipAmount)] 
      })

      if (!isApproveSuccess) {
        throw new Error('Approval transaction failed')
      }

      // Transfer USDC to creator
      const transferTxHash = await transferWrite({ 
        args: [metadata.creator as `0x${string}`, usdcToBigInt(creatorAmount)] 
      })

      if (!isTransferSuccess) {
        throw new Error('Transfer transaction failed')
      }

      // If there's a platform fee, transfer it to the platform wallet
      if (platformFee > 0) {
        const platformWallet = process.env.NEXT_PUBLIC_PLATFORM_WALLET as `0x${string}`
        if (!platformWallet) {
          console.warn('Platform wallet not configured, skipping fee transfer')
        } else {
          const feeTxHash = await transferWrite({ 
            args: [platformWallet, usdcToBigInt(platformFee)] 
          })
          if (!isTransferSuccess) {
            throw new Error('Fee transfer failed')
          }
        }
      }

      // Update revenue tracking via API
      const updateResponse = await fetch('/api/content/update-revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: cid,
          creator: metadata.creator,
          tipAmount,
          platformFee,
          creatorAmount,
        }),
      })

      if (!updateResponse.ok) {
        console.warn('Failed to update revenue tracking')
      }

      // If content is encrypted, decrypt it
      if (metadata.encryptedContent && metadata.encryptionKey) {
        setIsDecrypting(true)
        try {
          const key = await decryptKeyForUser(metadata.encryptionKey, address)
          const decrypted = await decryptContent(metadata.encryptedContent, key)
          setDecryptedContent(decrypted)
        } catch (decryptError) {
          console.error('Failed to decrypt content:', decryptError)
          setError('Failed to decrypt content. Please try again.')
        } finally {
          setIsDecrypting(false)
        }
      }

      setHasAccess(true)
      setTipSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process tip')
    } finally {
      setIsTipping(false)
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

  const renderContent = () => {
    if (!content || !metadata) return null

    switch (metadata.contentType) {
      case 'image':
        return <img src={content} alt={metadata.title} className="max-w-full rounded-lg" />
      case 'video':
        return (
          <video controls className="max-w-full rounded-lg">
            <source src={content} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )
      case 'article':
        return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      case 'text':
        return <div className="whitespace-pre-wrap">{content}</div>
      default:
        return null
    }
  }

  const handleFrameAction = async (action: 'view' | 'pay') => {
    if (!metadata) return

    if (action === 'pay' && metadata.accessType === 'paid') {
      // Handle payment flow
      setIsTipping(true)
      try {
        await handleTip()
        setHasAccess(true)
      } catch (err) {
        console.error('Payment failed:', err)
        setError('Payment failed. Please try again.')
      } finally {
        setIsTipping(false)
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

            {content ? (
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
                onClick={handleTip}
                disabled={isTipping || !isConnected}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {isTipping ? 'Processing...' : `Pay ${metadata.tipAmount} USDC`}
              </button>
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