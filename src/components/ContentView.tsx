'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ethers } from 'ethers'
import { sdk } from '@farcaster/frame-sdk'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { decryptToString } from '@lit-protocol/encryption'
import { createSiweMessage, generateAuthSig, LitAccessControlConditionResource } from '@lit-protocol/auth-helpers'
import { LIT_NETWORK, LIT_ABILITY } from '@lit-protocol/constants'
import { payForContentWithFarcasterWallet } from '../lib/farcasterWallet'
import { getContent, type ContentMetadata } from '../lib/contentStorage'

interface Content {
  originalContentId: string
  creator: string
  price: string
  contentType: string
  title: string
  description: string
  dataToEncryptHash: string
  ciphertext: string
  preview: {
    text: string
    imageUrl?: string
    videoUrl?: string
  }
  createdAt: string
}

export default function ContentView() {
  const params = useParams()
  const contentId = params.cid as string
  
  const [content, setContent] = useState<Content | null>(null)
  const [decryptedContent, setDecryptedContent] = useState<string>('')
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [usdcBalance, setUsdcBalance] = useState<string>('0')

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get user's wallet address
        const provider = await sdk.wallet.getEthereumProvider()
        if (provider) {
          const ethersProvider = new ethers.BrowserProvider(provider)
          const signer = await ethersProvider.getSigner()
          const address = await signer.getAddress()
          setUserAddress(address)

          // Check USDC balance
          const usdcContract = new ethers.Contract(
            process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
            ['function balanceOf(address) view returns (uint256)'],
            ethersProvider
          )
          const balance = await usdcContract.balanceOf(address)
          setUsdcBalance(ethers.formatUnits(balance, 6))
        }

        // Check if user has access
        const accessResponse = await fetch('/api/payments/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId,
            userAddress: userAddress || 'unknown',
          }),
        })

        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          setHasAccess(accessData.hasPaid)
          setShowPreview(!accessData.hasPaid)
        }

        // Get content from our storage system
        const storedContent = getContent(contentId)
        
        if (storedContent) {
          // Convert stored content to Content interface
          const contentData: Content = {
            originalContentId: storedContent.contentId,
            creator: storedContent.creator,
            price: storedContent.price,
            contentType: storedContent.contentType,
            title: storedContent.title,
            description: storedContent.description,
            dataToEncryptHash: storedContent.ipfsCid,
            ciphertext: 'encrypted_content_placeholder', // This would be the actual encrypted content
            preview: {
              text: storedContent.description,
              imageUrl: storedContent.contentType === 'image' ? `https://gateway.pinata.cloud/ipfs/${storedContent.ipfsCid}` : '',
              videoUrl: storedContent.contentType === 'video' ? `https://gateway.pinata.cloud/ipfs/${storedContent.ipfsCid}` : ''
            },
            createdAt: storedContent.createdAt
          }
          
          setContent(contentData)
        } else {
          // Fallback to mock content if not found
          const mockContent: Content = {
            originalContentId: contentId,
            creator: '0x1234567890123456789012345678901234567890',
            price: '0.1',
            contentType: 'text',
            title: 'Sample Lit Protocol Encrypted Content',
            description: 'This is a sample content encrypted with Lit Protocol that requires payment to access.',
            dataToEncryptHash: 'sample_data_hash',
            ciphertext: 'sample_ciphertext',
            preview: {
              text: 'This is a preview of the Lit Protocol encrypted content. Pay 0.1 USDC to unlock the full content.',
              imageUrl: '',
              videoUrl: ''
            },
            createdAt: new Date().toISOString()
          }
          
          setContent(mockContent)
        }

        // If user has access, decrypt the content
        if (hasAccess && content) {
          try {
            const decrypted = await decryptWithLitProtocol(
              content.ciphertext,
              content.dataToEncryptHash,
              contentId
            )
            setDecryptedContent(decrypted)
          } catch (decryptError) {
            console.error('Decryption failed:', decryptError)
            setError('Failed to decrypt content')
          }
        }

      } catch (error) {
        console.error('Error loading content:', error)
        setError('Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    if (contentId) {
      loadContent()
    }
  }, [contentId, hasAccess, userAddress])

  const decryptWithLitProtocol = async (
    ciphertext: string,
    dataToEncryptHash: string,
    contentId: string
  ): Promise<string> => {
    console.log('🔓 Starting Lit Protocol decryption...')
    
    const litNodeClient = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilTest })
    await litNodeClient.connect()

    // Get user's wallet
    const provider = await sdk.wallet.getEthereumProvider()
    if (!provider) {
      throw new Error('No Ethereum provider available')
    }

    const ethersProvider = new ethers.BrowserProvider(provider)
    const walletClient = await ethersProvider.getSigner()

    console.log('👤 Decrypting with wallet address:', walletClient.address)

    // Handle contentId format
    let bytes32ContentId: string
    if (contentId.startsWith('0x') && contentId.length === 66) {
      bytes32ContentId = contentId
    } else {
      bytes32ContentId = ethers.encodeBytes32String(contentId)
    }

    // EVM access control conditions
    const evmContractConditions = [
      {
        contractAddress: process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT || '0xe7880e2aDd0429296dfFC12cb8c14726fbE5De29',
        functionName: "checkAccess",
        functionParams: [":userAddress", bytes32ContentId],
        functionAbi: {
          "inputs": [
            {
              "internalType": "address",
              "name": "user",
              "type": "address"
            },
            {
              "internalType": "bytes32",
              "name": "contentId",
              "type": "bytes32"
            }
          ],
          "name": "checkAccess",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        chain: "base",
        returnValueTest: {
          key: "",
          comparator: '=',
          value: 'true'
        }
      }
    ]

    console.log('🔐 EVM Contract Conditions:', JSON.stringify(evmContractConditions, null, 2))

    const sessionSigs = await litNodeClient.getSessionSigs({
      chain: "base",
      expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      resourceAbilityRequests: [
        {
          resource: new LitAccessControlConditionResource(
            await LitAccessControlConditionResource.generateResourceString(
              evmContractConditions,
              dataToEncryptHash
            )
          ),
          ability: LIT_ABILITY.AccessControlConditionDecryption
        }
      ],
      authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
        const toSign = await createSiweMessage({
          uri,
          expiration,
          resources: resourceAbilityRequests,
          walletAddress: walletClient.address,
          nonce: await litNodeClient.getLatestBlockhash(),
          litNodeClient
        })
        return await generateAuthSig({ signer: walletClient, toSign })
      }
    })

    console.log('✅ Session signatures generated successfully')

    const decrypted = await decryptToString(
      {
        chain: "base",
        ciphertext: ciphertext,
        dataToEncryptHash: dataToEncryptHash,
        evmContractConditions,
        sessionSigs
      },
      litNodeClient
    )

    console.log('🎉 Lit Protocol decryption successful:', decrypted)
    return decrypted
  }

  const handlePayment = async () => {
    if (!content) return

    try {
      setIsPaying(true)
      setError(null)

      console.log('💸 Processing payment for content:', contentId)
      console.log('💰 Price:', content.price, 'USDC')
      console.log('👤 User address:', userAddress)
      console.log('💵 USDC Balance:', usdcBalance)

      // Check if user has sufficient balance
      const priceNum = parseFloat(content.price)
      const balanceNum = parseFloat(usdcBalance)
      
      if (balanceNum < priceNum) {
        throw new Error(`Insufficient USDC balance. Required: ${content.price}, Available: ${usdcBalance}`)
      }

      // Process payment using improved Farcaster wallet function
      console.log('🚀 Starting Farcaster wallet payment...')
      const result = await payForContentWithFarcasterWallet(contentId)
      
      if (result.success && result.txHash) {
        console.log('✅ Payment successful:', result.txHash)
        
        // Record payment
        const recordResponse = await fetch('/api/payments/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId,
            userAddress,
            txHash: result.txHash,
            amount: content.price,
            timestamp: Date.now()
          })
        })

        if (!recordResponse.ok) {
          throw new Error('Failed to record payment')
        }

        // Decrypt content using Lit Protocol
        try {
          console.log('🔓 Decrypting content after successful payment...')
          const decryptedContent = await decryptWithLitProtocol(
            content.ciphertext,
            content.dataToEncryptHash,
            contentId
          )
          
          setDecryptedContent(decryptedContent)
          setHasAccess(true)
          setShowPreview(false)
          
          console.log('🔓 Content decrypted successfully with Lit Protocol')
        } catch (decryptError) {
          console.error('❌ Lit Protocol decryption failed:', decryptError)
          throw new Error('Payment successful but failed to decrypt content')
        }
      } else {
        throw new Error(result.error || 'Payment failed')
      }
    } catch (error) {
      console.error('❌ Payment failed:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Content Not Found</h1>
          <p className="text-gray-600">{error || 'The content you\'re looking for doesn\'t exist.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                <p className="text-blue-100">{content.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{content.price} USDC</div>
                <div className="text-blue-100 text-sm">
                  {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)} Content
                </div>
              </div>
            </div>
          </div>

          {/* Content Type Badge */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {content.contentType === 'text' && '📝'}
                {content.contentType === 'article' && '📄'}
                {content.contentType === 'video' && '🎥'}
                {content.contentType === 'image' && '🖼️'}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {content.contentType.charAt(0).toUpperCase() + content.contentType.slice(1)} Content
              </span>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                🔐 Lit Protocol
              </span>
              {hasAccess && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  🔓 Unlocked
                </span>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔒 Preview</h3>
                
                {content.preview.text && (
                  <p className="text-gray-600 mb-4 italic">"{content.preview.text}"</p>
                )}

                {content.preview.imageUrl && (
                  <div className="relative mb-4">
                    <img
                      src={content.preview.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-3xl mb-2">🔒</div>
                        <p className="font-semibold">Preview</p>
                      </div>
                    </div>
                  </div>
                )}

                {content.preview.videoUrl && (
                  <div className="relative mb-4">
                    <video
                      src={content.preview.videoUrl}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      PREVIEW
                    </div>
                  </div>
                )}

                {/* Payment Section */}
                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">Unlock Full Content</h4>
                      <p className="text-sm text-gray-600">Pay {content.price} USDC to access the complete content</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{content.price} USDC</div>
                      <div className="text-xs text-gray-500">Your Balance: {usdcBalance} USDC</div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-800 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePayment}
                    disabled={isPaying || parseFloat(usdcBalance) < parseFloat(content.price)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isPaying ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing Payment...</span>
                      </div>
                    ) : parseFloat(usdcBalance) < parseFloat(content.price) ? (
                      'Insufficient Balance'
                    ) : (
                      `Pay ${content.price} USDC to Unlock`
                    )}
                  </button>

                  {parseFloat(usdcBalance) < parseFloat(content.price) && (
                    <p className="text-red-600 text-sm mt-2 text-center">
                      💡 You need at least {content.price} USDC to unlock this content
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Full Content */}
          {!showPreview && decryptedContent && (
            <div className="p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-green-800 font-medium">Content Unlocked Successfully!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  You now have access to the full Lit Protocol encrypted content.
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Full Content</h3>
                
                {content.contentType === 'image' ? (
                  <div className="text-center">
                    <img
                      src={decryptedContent}
                      alt="Content"
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                ) : content.contentType === 'video' ? (
                  <div className="text-center">
                    <video
                      src={decryptedContent}
                      controls
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-4 rounded-lg border">
                      {decryptedContent}
                    </pre>
                  </div>
                )}
              </div>

              {/* Content Details */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Content Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Creator:</span>
                    <span className="ml-2 font-mono text-gray-800">{content.creator}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 text-gray-800">
                      {new Date(content.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 text-gray-800 capitalize">{content.contentType}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Price:</span>
                    <span className="ml-2 text-gray-800">{content.price} USDC</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Encryption:</span>
                    <span className="ml-2 text-gray-800">Lit Protocol</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 