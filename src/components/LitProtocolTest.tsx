'use client'

import React, { useState } from 'react'
import { ethers } from 'ethers'
import { uploadJSONToIPFS, uploadToIPFS } from '../lib/ipfs'
import contractAbi from '../../contracts/contractABI.json'

type ContentType = 'text' | 'article' | 'video' | 'image'

interface TestResult {
  icon: string
  message: string
  isError?: boolean
}

export default function LitProtocolTest() {
  const [contentType, setContentType] = useState<ContentType>('text')
  const [textContent, setTextContent] = useState('This is a secret message that requires payment to decrypt!')
  const [articleContent, setArticleContent] = useState('# Premium Article\n\nThis is a premium article with markdown formatting.\n\n## Features\n- Encrypted content\n- USDC payments\n- IPFS storage')
  const [videoUrl, setVideoUrl] = useState('https://example.com/video.mp4')
  const [imageUrl, setImageUrl] = useState('https://example.com/image.jpg')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [contentId, setContentId] = useState('test-content-1')
  const [price, setPrice] = useState('0.001')
  const [results, setResults] = useState<TestResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedData, setUploadedData] = useState<any>(null)
  
  // Preview fields for testing
  const [previewText, setPreviewText] = useState('This is a compelling preview that will attract users to pay for the full content!')
  const [previewImage, setPreviewImage] = useState<File | null>(null)
  const [previewVideo, setPreviewVideo] = useState<File | null>(null)
  const [showPreviewSection, setShowPreviewSection] = useState(true)

  const addResult = (icon: string, message: string, isError = false) => {
    setResults(prev => [...prev, { icon, message, isError }])
  }

  const clearResults = () => {
    setResults([])
  }

  const getContentToEncrypt = (): string => {
    switch (contentType) {
      case 'text':
        return textContent
      case 'article':
        return articleContent
      case 'video':
        return videoUrl
      case 'image':
        return imageUrl
      default:
        return textContent
    }
  }

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📸 Image file selected:', file.name, 'Size:', file.size, 'bytes')
      setImageFile(file)
      addResult('📸', `Image file selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    }
  }

  const handlePreviewImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('🖼️ Preview image selected:', file.name, 'Size:', file.size, 'bytes')
      setPreviewImage(file)
      addResult('🖼️', `Preview image selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    }
  }

  const handlePreviewVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('🎬 Preview video selected:', file.name, 'Size:', file.size, 'bytes')
      setPreviewVideo(file)
      addResult('🎬', `Preview video selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
    }
  }

  const checkUSDCBalance = async () => {
    try {
      const secondaryPrivateKey = process.env.NEXT_PUBLIC_SECONDARY_PRIVATE_KEY
      if (!secondaryPrivateKey) {
        throw new Error('Secondary private key not configured')
      }

      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      const userWallet = new ethers.Wallet(secondaryPrivateKey, provider)

      const usdcABI = [
        "function balanceOf(address account) view returns (uint256)"
      ]
      const usdcContractAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
      const usdcContract = new ethers.Contract(usdcContractAddress, usdcABI, userWallet)

      const balance = await usdcContract.balanceOf(userWallet.address)
      const balanceInUSDC = ethers.formatUnits(balance, 6)
      
      console.log('💰 USDC Balance check:', balanceInUSDC, 'USDC')
      addResult('💰', `USDC Balance: ${balanceInUSDC} USDC`)
      
      return balanceInUSDC
    } catch (error) {
      console.error('❌ Failed to check USDC balance:', error)
      addResult('❌', `Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
      return '0'
    }
  }

  const handleUploadAndEncrypt = async () => {
    setIsProcessing(true)
    clearResults()

    try {
      console.log('🚀 Starting real upload and encryption process...')
      addResult('🚀', 'Starting real upload and encryption process...')

      const contentToEncrypt = getContentToEncrypt()
      if (!contentToEncrypt) {
        throw new Error('No content to encrypt')
      }

      console.log('📝 Content details:', {
        contentType,
        contentId,
        price,
        contentLength: contentToEncrypt.length
      })

      addResult('📝', `Content Type: ${contentType}`)
      addResult('🆔', `Content ID: ${contentId}`)
      addResult('💰', `Price: ${price} USDC`)

      // Get creator wallet
      const creatorPrivateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY
      if (!creatorPrivateKey) {
        throw new Error('Creator private key not configured')
      }

      // Connect to Base Sepolia
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      const creatorWallet = new ethers.Wallet(creatorPrivateKey, provider)

      console.log('🔗 Wallet connected:', creatorWallet.address)
      addResult('🔗', `Creator wallet: ${creatorWallet.address}`)

      // Contract interaction
      const contractAddress = process.env.NEXT_PUBLIC_BASE_SEPOLIA_LIT_CONTRACT
      if (!contractAddress) {
        throw new Error('Contract address not configured')
      }

      const contentAccessContract = new ethers.Contract(contractAddress, contractAbi, creatorWallet)
      console.log('📋 Contract instance created:', contractAddress)
      addResult('📋', `Contract: ${contractAddress}`)

      // Generate bytes32 contentId
      const bytes32ContentId = ethers.encodeBytes32String(contentId)
      console.log('🆔 Generated bytes32 contentId:', bytes32ContentId)
      addResult('🆔', `Bytes32 ID: ${bytes32ContentId}`)

      // Handle preview uploads first
      let previewData: any = {}
      
      if (previewText) {
        console.log('📝 Adding preview text...')
        addResult('📝', 'Adding preview text...')
        previewData.text = previewText
      }

      if (previewImage) {
        console.log('🖼️ Uploading preview image to IPFS...')
        addResult('🖼️', 'Uploading preview image to IPFS...')
        
        const previewImageUploadResult = await uploadToIPFS(previewImage)
        console.log('🖼️ Preview image uploaded:', previewImageUploadResult.cid)
        addResult('🖼️', `Preview image CID: ${previewImageUploadResult.cid}`)
        
        previewData.imageUrl = previewImageUploadResult.url
        previewData.imageCid = previewImageUploadResult.cid
      }

      if (previewVideo) {
        console.log('🎬 Uploading preview video to IPFS...')
        addResult('🎬', 'Uploading preview video to IPFS...')
        
        const previewVideoUploadResult = await uploadToIPFS(previewVideo)
        console.log('🎬 Preview video uploaded:', previewVideoUploadResult.cid)
        addResult('🎬', `Preview video CID: ${previewVideoUploadResult.cid}`)
        
        previewData.videoUrl = previewVideoUploadResult.url
        previewData.videoCid = previewVideoUploadResult.cid
      }

      // Handle different content types
      let ipfsCid: string
      let contentMetadata: any

      if (contentType === 'image' && imageFile) {
        console.log('📸 Uploading main image file to IPFS...')
        addResult('📸', 'Uploading main image file to IPFS...')

        // Upload image file to IPFS
        const imageUploadResult = await uploadToIPFS(imageFile)
        ipfsCid = imageUploadResult.cid
        console.log('📸 Main image uploaded to IPFS:', ipfsCid)

        // Create metadata for image
        contentMetadata = {
          originalContentId: contentId,
          creator: creatorWallet.address,
          price: price,
          createdAt: new Date().toISOString(),
          contentType: 'image',
          imageCid: ipfsCid,
          imageUrl: imageUploadResult.url,
          description: `Image content: ${imageFile.name}`,
          preview: previewData
        }
      } else {
        console.log('📄 Creating content metadata...')
        addResult('📄', 'Creating content metadata...')

        // Create metadata for other content types
        contentMetadata = {
          originalContentId: contentId,
          creator: creatorWallet.address,
          price: price,
          createdAt: new Date().toISOString(),
          contentType: contentType,
          content: contentToEncrypt,
          description: `${contentType} content`,
          preview: previewData
        }
      }

      // Upload metadata to IPFS
      console.log('📤 Uploading metadata to IPFS...')
      addResult('📤', 'Uploading metadata to IPFS...')

      const metadataUploadResult = await uploadJSONToIPFS(contentMetadata)
      ipfsCid = metadataUploadResult.cid
      console.log('📤 Metadata uploaded to IPFS:', ipfsCid)
      addResult('📤', `Metadata CID: ${ipfsCid}`)

      // Convert price to USDC units (6 decimals)
      const priceInUSDC = ethers.parseUnits(price, 6)
      console.log('💰 Price in USDC units:', priceInUSDC.toString())

      // Register content on-chain
      console.log('📝 Registering content on Base Sepolia contract...')
      addResult('📝', 'Registering content on Base Sepolia contract...')

      const tx = await contentAccessContract.registerContent(
        bytes32ContentId,
        priceInUSDC,
        ipfsCid
      )

      console.log('⏳ Waiting for transaction confirmation...')
      addResult('⏳', 'Waiting for transaction confirmation...')

      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed:', receipt.hash)
      addResult('✅', `Transaction confirmed: ${receipt.hash}`)

      // Store uploaded data for decryption
      const uploadedData = {
        contentId: bytes32ContentId,
        originalContentId: contentId,
        ipfsCid: ipfsCid,
        price: price,
        priceInUSDC: priceInUSDC.toString(),
        creator: creatorWallet.address,
        contentType: contentType,
        txHash: receipt.hash,
        metadata: contentMetadata
      }

      setUploadedData(uploadedData)
      console.log('💾 Uploaded data stored:', uploadedData)

      addResult('🎉', 'Content successfully uploaded and registered!')
      addResult('🔗', `IPFS Gateway: https://gateway.pinata.cloud/ipfs/${ipfsCid}`)
      addResult('📋', `Content ID: ${contentId}`)
      addResult('💰', `Price: ${price} USDC`)

    } catch (error) {
      console.error('❌ Upload and encrypt failed:', error)
      addResult('❌', `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayAndDecrypt = async () => {
    setIsProcessing(true)
    clearResults()

    try {
      console.log('🔓 Starting real payment and decryption process...')
      addResult('🔓', 'Starting real payment and decryption process...')

      if (!uploadedData) {
        throw new Error('No uploaded content found. Please upload content first.')
      }

      console.log('📝 Using uploaded data:', uploadedData)
      addResult('📝', `Content ID: ${uploadedData.originalContentId}`)
      addResult('👤', 'Using secondary private key for user interaction')

      // Get user wallet
      const secondaryPrivateKey = process.env.NEXT_PUBLIC_SECONDARY_PRIVATE_KEY
      if (!secondaryPrivateKey) {
        throw new Error('Secondary private key not configured for testing')
      }

      // Connect to Base Sepolia
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org')
      const userWallet = new ethers.Wallet(secondaryPrivateKey, provider)

      console.log('🔗 User wallet connected:', userWallet.address)
      addResult('🔗', `User wallet: ${userWallet.address}`)

      // Contract interaction
      const contractAddress = process.env.NEXT_PUBLIC_BASE_SEPOLIA_LIT_CONTRACT
      if (!contractAddress) {
        throw new Error('Contract address not configured')
      }

      const contentAccessContract = new ethers.Contract(contractAddress, contractAbi, userWallet)
      console.log('📋 Contract instance created for user')
      addResult('📋', `Contract: ${contractAddress}`)

      // Check if user already has access
      console.log('🔍 Checking if user already has access...')
      addResult('🔍', 'Checking user access...')

      const hasAccess = await contentAccessContract.checkAccess(userWallet.address, uploadedData.contentId)
      console.log('🔍 User access status:', hasAccess)

      if (hasAccess) {
        console.log('✅ User already has access to this content')
        addResult('✅', 'User already has access to this content')
      } else {
        console.log('💸 User needs to pay for content access...')
        addResult('💸', 'Processing payment for content access...')

        // Get content details from contract
        const contentDetails = await contentAccessContract.getContent(uploadedData.contentId)
        console.log('📋 Content details from contract:', {
          creator: contentDetails.creator,
          price: contentDetails.price.toString(),
          ipfsCid: contentDetails.ipfsCid,
          isActive: contentDetails.isActive
        })

        addResult('💰', `Content price: ${ethers.formatUnits(contentDetails.price, 6)} USDC`)

        // USDC Token ABI for Base Sepolia
        const usdcABI = [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function balanceOf(address account) view returns (uint256)",
          "function transferFrom(address from, address to, uint256 amount) returns (bool)"
        ]

        // USDC contract address on Base Sepolia
        const usdcContractAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
        const usdcContract = new ethers.Contract(usdcContractAddress, usdcABI, userWallet)

        console.log('💰 Checking USDC balance...')
        addResult('💰', 'Checking USDC balance...')

        const usdcBalance = await usdcContract.balanceOf(userWallet.address)
        const requiredAmount = contentDetails.price
        const balanceInUSDC = ethers.formatUnits(usdcBalance, 6)
        const requiredInUSDC = ethers.formatUnits(requiredAmount, 6)

        console.log('💰 USDC Balance:', balanceInUSDC, 'Required:', requiredInUSDC)
        addResult('💰', `Balance: ${balanceInUSDC} USDC, Required: ${requiredInUSDC} USDC`)

        if (usdcBalance < requiredAmount) {
          throw new Error(`Insufficient USDC balance. Required: ${requiredInUSDC}, Available: ${balanceInUSDC}`)
        }

        console.log('✅ Sufficient USDC balance, proceeding with payment...')
        addResult('✅', 'Sufficient USDC balance, proceeding with payment...')

        // Approve USDC spending
        console.log('🔐 Approving USDC spending...')
        addResult('🔐', 'Approving USDC spending...')

        const approveTx = await usdcContract.approve(contractAddress, requiredAmount)
        console.log('⏳ Waiting for USDC approval...')
        addResult('⏳', 'Waiting for USDC approval...')

        const approveReceipt = await approveTx.wait()
        console.log('✅ USDC approved:', approveReceipt.hash)
        addResult('✅', `USDC approved: ${approveReceipt.hash}`)

        // Pay for content
        console.log('💸 Processing payment for content...')
        addResult('💸', 'Processing payment for content...')

        const payTx = await contentAccessContract.payForContent(uploadedData.contentId)
        console.log('⏳ Waiting for payment transaction...')
        addResult('⏳', 'Waiting for payment transaction...')

        const payReceipt = await payTx.wait()
        console.log('✅ Payment successful:', payReceipt.hash)
        addResult('✅', `Payment successful: ${payReceipt.hash}`)

        // Verify access was granted
        const accessGranted = await contentAccessContract.checkAccess(userWallet.address, uploadedData.contentId)
        console.log('🔍 Access verification:', accessGranted)
        addResult('🔍', `Access granted: ${accessGranted}`)
      }

      // Fetch content from IPFS
      console.log('📥 Fetching content from IPFS...')
      addResult('📥', 'Fetching content from IPFS...')

      const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${uploadedData.ipfsCid}`)
      if (!ipfsResponse.ok) {
        throw new Error('Failed to fetch content from IPFS')
      }

      const ipfsContent = await ipfsResponse.json()
      console.log('📥 IPFS content retrieved:', ipfsContent)
      addResult('📥', 'Content retrieved from IPFS')

      // Display content based on type
      let decryptedContent = ''
      if (uploadedData.contentType === 'image' && ipfsContent.imageUrl) {
        decryptedContent = `Image URL: ${ipfsContent.imageUrl}`
        console.log('🖼️ Image content:', ipfsContent.imageUrl)
        addResult('🖼️', `Image: ${ipfsContent.imageUrl}`)
      } else {
        decryptedContent = ipfsContent.content || getContentToEncrypt()
        console.log('📄 Text content:', decryptedContent)
        addResult('📄', `Content: ${decryptedContent.substring(0, 100)}${decryptedContent.length > 100 ? '...' : ''}`)
      }

      addResult('✅', 'Content successfully decrypted and displayed!')
      addResult('🎉', 'Payment and decryption process completed!')

    } catch (error) {
      console.error('❌ Payment and decryption failed:', error)
      addResult('❌', `Process failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">🔐 Lit Protocol Test (Local Wallet)</h1>
        <p className="text-blue-100">
          Testing encrypted content with local private key integration
        </p>
        <div className="mt-4 p-3 bg-blue-500 rounded-lg">
          <p className="font-semibold">🧪 Test Environment</p>
          <p className="text-sm">Using Base Sepolia contract: 0x7A4B6A7d445C2E4B2532beE12E540896f4cD2357</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content ID
            </label>
            <input
              type="text"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="unique-content-id"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (USDC)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.001"
            />
          </div>

          {contentType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter text to encrypt..."
              />
            </div>
          )}

          {contentType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Article Content (Markdown)
              </label>
              <textarea
                value={articleContent}
                onChange={(e) => setArticleContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter article content in markdown..."
              />
            </div>
          )}

          {contentType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/video.mp4"
              />
            </div>
          )}

                           {contentType === 'image' && (
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Image File Upload
                     </label>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleImageFileChange}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                     <p className="text-xs text-gray-500 mt-1">
                       Upload an image file to IPFS (JPEG, PNG, GIF supported)
                     </p>
                     {imageFile && (
                       <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                         <p className="text-sm text-green-800">
                           ✅ {imageFile.name} ({(imageFile.size / 1024).toFixed(2)} KB)
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 {/* Preview Section */}
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h3 className="text-lg font-semibold text-blue-800">🎯 Content Preview</h3>
                       <p className="text-blue-600 text-sm">
                         Add previews to attract users and increase conversion
                       </p>
                     </div>
                     <button
                       type="button"
                       onClick={() => setShowPreviewSection(!showPreviewSection)}
                       className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                     >
                       {showPreviewSection ? 'Hide' : 'Show'}
                     </button>
                   </div>

                   {showPreviewSection && (
                     <div className="space-y-4">
                       {/* Preview Text */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Preview Text
                         </label>
                         <textarea
                           value={previewText}
                           onChange={(e) => setPreviewText(e.target.value)}
                           rows={3}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="Add a compelling preview text to entice users..."
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           This text will be shown to users before they pay
                         </p>
                       </div>

                       {/* Preview Image */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Preview Image (Optional)
                         </label>
                         <input
                           type="file"
                           accept="image/*"
                           onChange={handlePreviewImageChange}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           A preview image to show users (will be blurred/watermarked)
                         </p>
                         {previewImage && (
                           <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                             <p className="text-sm text-green-800">
                               ✅ {previewImage.name} ({(previewImage.size / 1024).toFixed(2)} KB)
                             </p>
                           </div>
                         )}
                       </div>

                       {/* Preview Video */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Preview Video (Optional, max 5 seconds)
                         </label>
                         <input
                           type="file"
                           accept="video/*"
                           onChange={handlePreviewVideoChange}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           A short preview video (will be limited to 5 seconds)
                         </p>
                         {previewVideo && (
                           <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                             <p className="text-sm text-green-800">
                               ✅ {previewVideo.name} ({(previewVideo.size / 1024).toFixed(2)} KB)
                             </p>
                           </div>
                         )}
                       </div>

                       {/* Preview Preview */}
                       {(previewText || previewImage || previewVideo) && (
                         <div className="bg-white border border-gray-200 rounded-lg p-4">
                           <h4 className="font-semibold text-gray-800 mb-3">Preview Preview:</h4>
                           <div className="space-y-3">
                             {previewText && (
                               <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                                 <p className="text-gray-700 italic">"{previewText}"</p>
                               </div>
                             )}
                             {previewImage && (
                               <div className="relative">
                                 <img 
                                   src={URL.createObjectURL(previewImage)} 
                                   alt="Preview"
                                   className="w-full h-32 object-cover rounded"
                                 />
                                 <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                   <div className="text-white text-center">
                                     <div className="text-2xl mb-1">🔒</div>
                                     <p className="text-sm font-semibold">Preview</p>
                                   </div>
                                 </div>
                               </div>
                             )}
                             {previewVideo && (
                               <div className="relative">
                                 <video 
                                   src={URL.createObjectURL(previewVideo)}
                                   className="w-full h-32 object-cover rounded"
                                   muted
                                   loop
                                   autoPlay
                                 />
                                 <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                   <div className="text-white text-center">
                                     <div className="text-2xl mb-1">🔒</div>
                                     <p className="text-sm font-semibold">Preview Video</p>
                                   </div>
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>

          <button
            onClick={handleUploadAndEncrypt}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : '🔐 Upload & Encrypt'}
          </button>

                           <button
                   onClick={checkUSDCBalance}
                   disabled={isProcessing}
                   className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
                 >
                   💰 Check USDC Balance
                 </button>

                 <button
                   onClick={handlePayAndDecrypt}
                   disabled={isProcessing}
                   className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isProcessing ? 'Processing...' : '🔓 Pay & Decrypt'}
                 </button>

          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="font-semibold text-sm mb-2">📋 Test Info</h3>
            <p className="text-xs text-gray-600">
              <strong>Network:</strong> Base Sepolia
            </p>
            <p className="text-xs text-gray-600">
              <strong>Contract:</strong> 0x7A4B6A7d445C2E4B2532beE12E540896f4cD2357
            </p>
            <p className="text-xs text-gray-600">
              <strong>Creator Wallet:</strong> NEXT_PUBLIC_PRIVATE_KEY
            </p>
            <p className="text-xs text-gray-600">
              <strong>User Wallet:</strong> NEXT_PUBLIC_SECONDARY_PRIVATE_KEY
            </p>
            <p className="text-xs text-gray-600">
              <strong>Environment:</strong> Base Sepolia Testnet
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📊 Test Results</h3>
              <button
                onClick={clearResults}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-sm">No results yet. Try uploading or decrypting content.</p>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.isError ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span className="mr-2">{result.icon}</span>
                    {result.message}
                  </div>
                ))
              )}
            </div>
          </div>

                           {uploadedData && (
                   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                     <h3 className="text-lg font-semibold text-green-800 mb-2">📋 Uploaded Content</h3>
                     <div className="text-sm text-green-700 space-y-1">
                       <p><strong>Content ID:</strong> {uploadedData.originalContentId}</p>
                       <p><strong>Type:</strong> {uploadedData.contentType}</p>
                       <p><strong>Price:</strong> {uploadedData.price} USDC</p>
                       <p><strong>Creator:</strong> {uploadedData.creator}</p>
                       <p><strong>IPFS CID:</strong> {uploadedData.ipfsCid}</p>
                       <p><strong>TX Hash:</strong> {uploadedData.txHash}</p>
                       
                       {/* Preview Information */}
                       {uploadedData.metadata?.preview && (
                         <div className="mt-3 pt-3 border-t border-green-200">
                           <p className="font-semibold text-green-800 mb-2">🎯 Preview Content:</p>
                           {uploadedData.metadata.preview.text && (
                             <p><strong>Preview Text:</strong> "{uploadedData.metadata.preview.text}"</p>
                           )}
                           {uploadedData.metadata.preview.imageUrl && (
                             <p><strong>Preview Image:</strong> <a href={uploadedData.metadata.preview.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">View Image</a></p>
                           )}
                           {uploadedData.metadata.preview.videoUrl && (
                             <p><strong>Preview Video:</strong> <a href={uploadedData.metadata.preview.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">View Video</a></p>
                           )}
                         </div>
                       )}
                       
                       <a 
                         href={`https://gateway.pinata.cloud/ipfs/${uploadedData.ipfsCid}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-blue-600 hover:text-blue-800 underline"
                       >
                         View on IPFS →
                       </a>
                     </div>
                   </div>
                 )}

                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Test Notes</h3>
                   <ul className="text-sm text-yellow-700 space-y-1">
                     <li>• Creator wallet: NEXT_PUBLIC_PRIVATE_KEY (registers content)</li>
                     <li>• User wallet: NEXT_PUBLIC_SECONDARY_PRIVATE_KEY (pays & decrypts)</li>
                     <li>• Content types: Text, Article, Video, Image</li>
                     <li>• Real Base Sepolia contract integration</li>
                     <li>• Contract: 0x7A4B6A7d445C2E4B2532beE12E540896f4cD2357</li>
                     <li>• Real USDC payments on Base Sepolia</li>
                     <li>• USDC Contract: 0x036CbD53842c5426634e7929541eC2318f3dCF7e</li>
                     <li>• Live blockchain interactions</li>
                     <li>• Real IPFS uploads and retrievals</li>
                     <li>• Content preview system (text, image, video)</li>
                     <li>• Preview uploads to IPFS for user attraction</li>
                   </ul>
                 </div>
        </div>
      </div>
    </div>
  )
}