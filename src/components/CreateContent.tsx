'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { sdk } from '@farcaster/frame-sdk'
import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { encryptString } from '@lit-protocol/encryption'
import { LIT_NETWORK } from '@lit-protocol/constants'
import { uploadToIPFS, uploadJSONToIPFS } from '../lib/ipfs'
import contractAbi from '../../contracts/contractABI.json'

type ContentType = 'text' | 'article' | 'video' | 'image'

interface CreateContentProps {
  onContentCreated?: (contentId: string) => void
}

export default function CreateContent({ onContentCreated }: CreateContentProps) {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [contentFile, setContentFile] = useState<File | null>(null) // For file uploads
  const [price, setPrice] = useState('0.1') // Set minimum to 0.1 USDC
  const [isProcessing, setIsProcessing] = useState(false)
  const [userAddress, setUserAddress] = useState('')
  const [isFarcasterApp, setIsFarcasterApp] = useState(false)
  const [showFarcasterRequired, setShowFarcasterRequired] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  
  // Preview fields
  const [previewText, setPreviewText] = useState('')
  const [previewImage, setPreviewImage] = useState<File | null>(null)
  const [previewVideo, setPreviewVideo] = useState<File | null>(null)
  const [showPreviewSection, setShowPreviewSection] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [createdContentId, setCreatedContentId] = useState('')

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🔍 Checking Farcaster Mini App environment...')
        // Check if we're in Farcaster Mini App
        const isMiniApp = await sdk.isInMiniApp()
        setIsFarcasterApp(isMiniApp)
        console.log('📱 Farcaster Mini App detected:', isMiniApp)
        
        if (isMiniApp) {
          console.log('🔗 Connecting to Farcaster wallet...')
          // Get user's wallet address
          const provider = await sdk.wallet.getEthereumProvider()
          if (provider) {
            const ethersProvider = new ethers.BrowserProvider(provider)
            const signer = await ethersProvider.getSigner()
            const address = await signer.getAddress()
            setUserAddress(address)
            setWalletConnected(true)
            console.log('✅ Wallet connected:', address)
            
            // Call ready to hide splash screen
            await sdk.actions.ready()
            console.log('✅ Farcaster Mini App ready')
          } else {
            console.error('❌ No Ethereum provider available')
            setShowFarcasterRequired(true)
          }
        } else {
          // Not in Farcaster environment - show requirement message
          console.log('❌ Not in Farcaster Mini App environment')
          setShowFarcasterRequired(true)
        }
      } catch (error) {
        console.error('❌ Error initializing app:', error)
        setShowFarcasterRequired(true)
      }
    }
    
    initApp()
  }, [])

  const handleContentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setContentFile(file)
      setContent('') // Clear text content when file is selected
      console.log('📁 Content file selected:', file.name, file.type, file.size)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      console.log('🚀 Starting content creation process...')
      
      // Validate minimum price
      const priceNum = parseFloat(price)
      if (priceNum < 0.1) {
        throw new Error('Minimum price is 0.1 USDC')
      }

      // Validate wallet connection
      if (!walletConnected) {
        throw new Error('Wallet not connected. Please ensure you are in the Farcaster Mini App.')
      }

      // Generate unique content ID
      const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('📝 Creating content:', {
        contentId,
        title,
        description,
        contentType,
        price,
        hasFile: !!contentFile,
        hasText: !!content
      })

      // Get user's wallet for mainnet interaction
      console.log('🔗 Getting Farcaster wallet provider...')
      const provider = await sdk.wallet.getEthereumProvider()
      if (!provider) {
        throw new Error('No Ethereum provider available. Please ensure you are in the Farcaster Mini App.')
      }

      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const userAddress = await signer.getAddress()

      console.log('✅ Connected wallet:', userAddress)

      // Contract setup for mainnet
      const contractAddress = process.env.NEXT_PUBLIC_BASE_LIT_CONTRACT
      if (!contractAddress) {
        throw new Error('Mainnet contract address not configured')
      }

      const contentAccessContract = new ethers.Contract(contractAddress, contractAbi, signer)
      console.log('📋 Contract connected:', contractAddress)

      // Generate bytes32 contentId
      const bytes32ContentId = ethers.encodeBytes32String(contentId)
      console.log('🆔 Generated bytes32 contentId:', bytes32ContentId)

      // Convert price to USDC units (6 decimals)
      const priceInUSDC = ethers.parseUnits(price, 6)
      console.log('💰 Price in USDC units:', priceInUSDC.toString())

      // Handle content based on type
      let contentToEncrypt = content
      let contentUrl = ''

      if (contentFile) {
        console.log('📤 Uploading content file to IPFS...')
        const fileUploadResult = await uploadToIPFS(contentFile)
        contentUrl = `https://gateway.pinata.cloud/ipfs/${fileUploadResult}`
        contentToEncrypt = contentUrl
        console.log('✅ Content file uploaded:', fileUploadResult)
      } else if (contentType === 'image' && content.startsWith('http')) {
        // For image URLs, use the URL directly
        contentToEncrypt = content
        contentUrl = content
        console.log('🖼️ Using image URL:', content)
      } else if (contentType === 'video' && content.startsWith('http')) {
        // For video URLs, use the URL directly
        contentToEncrypt = content
        contentUrl = content
        console.log('🎥 Using video URL:', content)
      } else {
        // For text and article content, use the text directly
        contentToEncrypt = content
        console.log('📄 Using text content')
      }

      // Initialize Lit Protocol
      console.log('🔐 Initializing Lit Protocol...')
      const litNodeClient = new LitNodeClient({ litNetwork: LIT_NETWORK.DatilTest })
      await litNodeClient.connect()
      console.log('✅ Lit Protocol connected')

      // Use EVM Access Control Conditions for smart contract
      const evmContractConditions = [
        {
          contractAddress: contractAddress,
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

      console.log('🔐 EVM Contract Conditions configured')
      console.log('📄 Encrypting content with Lit Protocol...')

      // Encrypt content using Lit Protocol
      const { ciphertext, dataToEncryptHash } = await encryptString(
        { evmContractConditions, dataToEncrypt: contentToEncrypt },
        litNodeClient
      )

      console.log('✅ Content encrypted with Lit Protocol')
      console.log('🔑 Data to encrypt hash:', dataToEncryptHash)

      // Upload preview content to IPFS if provided
      let previewImageUrl = ''
      let previewVideoUrl = ''
      
      if (previewImage) {
        console.log('🖼️ Uploading preview image to IPFS...')
        const previewImageUploadResult = await uploadToIPFS(previewImage)
        previewImageUrl = previewImageUploadResult.url // Use the URL directly
        console.log('✅ Preview image uploaded:', previewImageUploadResult.cid)
      }

      if (previewVideo) {
        console.log('🎥 Uploading preview video to IPFS...')
        const previewVideoUploadResult = await uploadToIPFS(previewVideo)
        previewVideoUrl = previewVideoUploadResult.url // Use the URL directly
        console.log('✅ Preview video uploaded:', previewVideoUploadResult.cid)
      }

      // Create content metadata
      const contentMetadata = {
        originalContentId: contentId,
        creator: userAddress,
        price: price,
        contentType: contentType,
        title: title,
        description: description,
        dataToEncryptHash: dataToEncryptHash,
        ciphertext: ciphertext,
        contentUrl: contentUrl,
        preview: {
          text: previewText || `Preview of ${title}`,
          imageUrl: previewImageUrl,
          videoUrl: previewVideoUrl
        },
        createdAt: new Date().toISOString()
      }

      // Upload metadata to IPFS
      console.log('📤 Uploading content metadata to IPFS...')
      const metadataUploadResult = await uploadJSONToIPFS(contentMetadata)
      const ipfsCid = metadataUploadResult.cid // Extract the CID from the result object
      console.log('✅ Metadata uploaded to IPFS:', ipfsCid)

      // Register content on mainnet contract
      console.log('📝 Registering content on mainnet contract...')
      console.log('⏳ Waiting for wallet signature...')
      
      const tx = await contentAccessContract.registerContent(
        bytes32ContentId,
        priceInUSDC,
        ipfsCid
      )
      console.log('⏳ Transaction submitted:', tx.hash)
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      console.log('✅ Content registered on mainnet:', receipt.hash)

      // Auto-cast with Frame embed
      try {
        console.log('📢 Composing Farcaster cast...')
        const contentUrl = `${window.location.origin}/content/${contentId}`
        const castText = `🎉 Just created "${title}" - ${description}\n\n💰 Price: ${price} USDC\n\nCheck it out: ${contentUrl}`
        
        await sdk.actions.composeCast({
          text: castText,
          embeds: [contentUrl]
        })
        console.log('✅ Farcaster cast composed successfully')
      } catch (castError) {
        console.warn('⚠️ Failed to compose cast:', castError)
      }

      // Show success message
      setCreatedContentId(contentId)
      setShowSuccessMessage(true)
      onContentCreated?.(contentId)

      console.log('💾 Content successfully uploaded and registered on mainnet!')
      console.log('📊 Summary:', {
        contentId: contentId,
        bytes32ContentId: bytes32ContentId,
        ipfsCid: ipfsCid,
        txHash: receipt.hash,
        price: price,
        contentType: contentType,
        encrypted: true,
        litProtocol: true
      })

    } catch (error) {
      console.error('❌ Content creation failed:', error)
      alert(`Content creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setPreviewImage(file)
    }
  }

  const handlePreviewVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setPreviewVideo(file)
    }
  }

  const getContentInput = () => {
    switch (contentType) {
      case 'text':
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your text content here..."
          />
        )
      case 'article':
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Write your article content here..."
          />
        )
      case 'video':
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('video-file')?.click()}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
              >
                📁 Upload Video File
              </button>
              <span className="text-gray-500 self-center text-center sm:text-left">or</span>
                              <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video URL..."
                />
            </div>
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleContentFileChange}
              className="hidden"
            />
            {contentFile && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">✅ File selected: {contentFile.name}</p>
              </div>
            )}
          </div>
        )
      case 'image':
        return (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('image-file')?.click()}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors whitespace-nowrap"
              >
                📁 Upload Image File
              </button>
              <span className="text-gray-500 self-center text-center sm:text-left">or</span>
                              <input
                  type="url"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter image URL..."
                />
            </div>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={handleContentFileChange}
              className="hidden"
            />
            {contentFile && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">✅ File selected: {contentFile.name}</p>
              </div>
            )}
          </div>
        )
      default:
        return (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your content here..."
          />
        )
    }
  }

  if (showFarcasterRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Farcaster Mini App Required</h1>
          <p className="text-gray-600 mb-6">
            This content creation feature is only available within the Farcaster Mini App environment.
            Please open this app from within Farcaster to create content.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Tip: Use the Farcaster app to access this feature and create encrypted content with real payments.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Content Created Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your content has been encrypted with Lit Protocol, uploaded to IPFS, and registered on the blockchain.
          </p>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-green-800">
              <strong>Content ID:</strong> {createdContentId}
            </p>
            <p className="text-sm text-green-800">
              <strong>Price:</strong> {price} USDC
            </p>
            <p className="text-sm text-green-800">
              <strong>Type:</strong> {contentType}
            </p>
            <p className="text-sm text-green-800">
              <strong>Encryption:</strong> Lit Protocol
            </p>
          </div>
          <div className="space-y-3">
            <a
              href={`/content/${createdContentId}`}
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Content
            </a>
            <button
              onClick={() => {
                setShowSuccessMessage(false)
                setCreatedContentId('')
                // Reset form
                setTitle('')
                setDescription('')
                setContent('')
                setContentFile(null)
                setPrice('0.1')
                setContentType('text')
                setPreviewText('')
                setPreviewImage(null)
                setPreviewVideo(null)
                setShowPreviewSection(false)
              }}
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create Encrypted Content</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Upload your content, encrypt it with Lit Protocol, and set a price. Users will need to pay to decrypt and access your content.
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-800">
                🔐 Lit Protocol encryption • 💰 Minimum price: 0.1 USDC • 🌐 Stored on IPFS • ⛓️ Registered on Base mainnet
              </p>
            </div>
            {walletConnected && (
              <div className="mt-2 p-2 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-green-800">
                  ✅ Wallet Connected: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                {(['text', 'article', 'video', 'image'] as ContentType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setContentType(type)
                      setContentFile(null) // Clear file when changing type
                      setContent('') // Clear content when changing type
                    }}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      contentType === type
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {type === 'text' && '📝'}
                      {type === 'article' && '📄'}
                      {type === 'video' && '🎥'}
                      {type === 'image' && '🖼️'}
                    </div>
                    <div className="text-sm font-medium capitalize">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter content title..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your content..."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              {getContentInput()}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USDC) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0.1"
                  step="0.01"
                  className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.1"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  USDC
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                💰 Minimum price: 0.1 USDC
              </div>
            </div>

            {/* Preview Section Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowPreviewSection(!showPreviewSection)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <span>{showPreviewSection ? '−' : '+'}</span>
                <span>Add Preview Content (Optional)</span>
              </button>
            </div>

            {/* Preview Section */}
            {showPreviewSection && (
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Preview Content</h3>
                
                {/* Preview Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Text
                  </label>
                  <textarea
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter preview text to show before payment..."
                  />
                </div>

                {/* Preview Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePreviewImageChange}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    💡 Upload a preview image to show before payment
                  </div>
                </div>

                {/* Preview Video */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview Video (Max 5 seconds)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handlePreviewVideoChange}
                    className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    💡 Upload a short preview video to show before payment
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Live Preview</h4>
                  <div className="space-y-2">
                    {previewText && (
                      <p className="text-sm text-gray-600">{previewText}</p>
                    )}
                    {previewImage && (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(previewImage)}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          PREVIEW
                        </div>
                      </div>
                    )}
                    {previewVideo && (
                      <div className="relative">
                        <video
                          src={URL.createObjectURL(previewVideo)}
                          className="w-full h-32 object-cover rounded"
                          controls
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          PREVIEW
                        </div>
                      </div>
                    )}
                    {!previewText && !previewImage && !previewVideo && (
                      <p className="text-sm text-gray-400 italic">
                        Preview content will appear here...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isProcessing || !walletConnected}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Encrypted Content...</span>
                  </div>
                ) : !walletConnected ? (
                  'Connecting Wallet...'
                ) : (
                  'Create Encrypted Content with Lit Protocol'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 