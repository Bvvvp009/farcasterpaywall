'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { uploadToIPFS, uploadJSONToIPFS, verifyIPFSContent } from '../lib/ipfs'
import { useUSDCTransfer, formatUSDC } from '../lib/wallet'
import { 
  generateEncryptionKey, 
  encryptContent, 
  encryptKeyForUser,
  encryptKeyForPaidAccess,
  generatePaymentProof
} from '../lib/encryption-secure'
import { FrameShare } from './FrameShare'
import { generateFrameUrl, generateShareText } from '../lib/frame-utils'

type ContentType = 'image' | 'video' | 'text' | 'article'
type AccessType = 'free' | 'paid'

export function CreateContent() {
  const { address } = useAccount()
  const [file, setFile] = useState<File | null>(null)
  const [contentType, setContentType] = useState<ContentType>('image')
  const [tipAmount, setTipAmount] = useState('1.00')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customEmbedText, setCustomEmbedText] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [articleContent, setArticleContent] = useState('')
  const [accessType, setAccessType] = useState<AccessType>('paid')
  const [isEncrypted, setIsEncrypted] = useState(true)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Add this effect to update articleContent when file changes
  useEffect(() => {
    const updateArticleContent = async () => {
      if (file && contentType === 'article') {
        try {
          const content = await file.text()
          setArticleContent(content)
        } catch (err) {
          console.error('Error reading file:', err)
          setArticleContent('')
        }
      }
    }
    updateArticleContent()
  }, [file, contentType])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-set title based on filename
      setTitle(selectedFile.name.split('.')[0] || 'Untitled Content')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!address || !file) return

    setIsUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      console.log('=== CONTENT CREATION START ===')
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
      console.log('Access Type:', accessType)
      console.log('Tip Amount:', tipAmount)

      let contentFile = file
      let encryptedContent = undefined
      let encryptionKeyMetadata = undefined
      let originalContent = undefined
      let key = undefined

      // For paid content, encrypt it first
      if (accessType === 'paid') {
        console.log('Encrypting content for paid access...')
        
        // Handle different file types
        if (file.type.startsWith('image/')) {
          // For images, convert to base64 first
          const arrayBuffer = await file.arrayBuffer()
          originalContent = Buffer.from(arrayBuffer).toString('base64')
          console.log('Image converted to base64 for encryption')
        } else {
          // For text files, read as text
          originalContent = await file.text()
          console.log('Text file read for encryption')
        }
        
        key = generateEncryptionKey()
        console.log('Generated encryption key for content')
        
        encryptedContent = await encryptContent(originalContent, key)
        console.log('Content encrypted successfully')
        
        // Create a placeholder file for IPFS (in production, you might upload encrypted content)
        const placeholder = new Blob(['This content is encrypted and requires payment to access'], { type: 'text/plain' })
        contentFile = new File([placeholder], 'encrypted.txt', { type: 'text/plain' })
        console.log('Created placeholder file for IPFS')
      }

      // Upload content to IPFS
      console.log('Uploading content to IPFS...')
      const { cid: contentCid, url: contentUrl } = await uploadToIPFS(contentFile)
      console.log('Content uploaded:', { contentCid, contentUrl })

      // For paid content, encrypt the key with the actual content ID
      if (accessType === 'paid' && key) {
        // Encrypt the key for paid access (any user who pays can decrypt)
        encryptionKeyMetadata = await encryptKeyForPaidAccess(key, contentCid, tipAmount)
        console.log('Key encrypted for paid access')
      }

      // Create metadata
      const metadata = {
        title,
        description,
        contentType,
        accessType,
        contentCid,
        contentUrl,
        encryptedContent,
        encryptionKey: encryptionKeyMetadata,
        creator: address,
        tipAmount: accessType === 'paid' ? tipAmount : '0',
        createdAt: new Date().toISOString(),
        customEmbedText: customEmbedText || undefined,
        isEncrypted: accessType === 'paid'
      }

      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS...')
      const { cid: metadataCid, url: metadataUrl } = await uploadJSONToIPFS(metadata)
      console.log('Metadata uploaded successfully:', { metadataCid, metadataUrl })

      // Store content using our API
      console.log('Storing content in database...')
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to store content: ${errorData.error || response.statusText}`)
      }

      console.log('Content stored successfully, verifying availability...')

      // Wait until the content is retrievable from the backend AND IPFS
      let confirmed = false
      let lastError = null
      for (let i = 0; i < 10; i++) { // Try for up to ~5 seconds
        try {
          // Check if content is available in our database
          const check = await fetch(`/api/content/${contentCid}`)
          if (check.ok) {
            // Also verify that content is available on IPFS
            const ipfsAvailable = await verifyIPFSContent(contentCid, 3000)
            if (ipfsAvailable) {
              confirmed = true
              console.log('Content availability confirmed (database + IPFS)')
              break
            } else {
              lastError = 'Content not available on IPFS yet'
              console.log(`IPFS check attempt ${i + 1} failed: Content not available on IPFS`)
            }
          } else {
            const errorData = await check.json().catch(() => ({}))
            lastError = errorData.error || `HTTP ${check.status}`
            console.log(`Database check attempt ${i + 1} failed:`, lastError)
          }
        } catch (checkError) {
          lastError = checkError instanceof Error ? checkError.message : 'Network error'
          console.log(`Content check attempt ${i + 1} failed:`, lastError)
        }
        await new Promise(res => setTimeout(res, 500))
      }
      
      if (!confirmed) {
        throw new Error(`Content not available after upload. Last error: ${lastError}. Please try again.`)
      }

      // Show share UI instead of redirecting immediately
      setUploadResult({ contentCid, contentUrl, metadataCid, metadataUrl })
      setIsUploading(false)
      return
    } catch (err) {
      console.error('Error in content creation:', err)
      setError(err instanceof Error ? err.message : 'Failed to create content')
    } finally {
      setIsUploading(false)
    }
  }

  if (!address) {
    return (
      <div className="text-center p-8 bg-pink-50 rounded-lg border border-pink-200">
        <p className="text-pink-800 text-lg font-medium">Please connect your wallet to create content</p>
        <p className="text-pink-600 mt-2">You need to connect your wallet to upload and manage content</p>
      </div>
    )
  }

  if (uploadResult) {
    const frameUrl = generateFrameUrl(uploadResult.contentCid)
    const shareText = generateShareText(
      {
        title,
        description,
        contentType,
        accessType,
        tipAmount: accessType === 'paid' ? tipAmount : undefined,
        customEmbedText
      },
      customEmbedText
    )
    
    return (
      <div className="p-6 bg-green-50 rounded-lg border border-green-200 max-w-xl mx-auto mt-8">
        <h3 className="text-lg font-semibold mb-4 text-green-800">🎉 Content Uploaded Successfully!</h3>
        
        {/* Content Details */}
        <div className="text-sm space-y-1 mb-6">
          <div><strong>Content CID:</strong> <code className="bg-gray-100 px-1 rounded">{uploadResult.contentCid}</code></div>
          <div><strong>Content URL:</strong> <a href={uploadResult.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadResult.contentUrl}</a></div>
          <div><strong>Metadata CID:</strong> <code className="bg-gray-100 px-1 rounded">{uploadResult.metadataCid}</code></div>
          <div><strong>Access Type:</strong> <span className="capitalize">{accessType}</span></div>
          {accessType === 'paid' && (
            <div><strong>Tip Amount:</strong> {tipAmount} USDC</div>
          )}
        </div>

        {/* Frame Sharing Section */}
        <FrameShare
          contentCid={uploadResult.contentCid}
          content={{
            title,
            description,
            contentType,
            accessType,
            tipAmount: accessType === 'paid' ? tipAmount : undefined,
            customEmbedText
          }}
          className="mb-6"
        />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <a
            href={`/content/${uploadResult.contentCid}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            title="View your content"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
            View Content
          </a>
          
          <button
            onClick={() => {
              setUploadResult(null)
              setFile(null)
              setTitle('')
              setDescription('')
              setCustomEmbedText('')
              setTipAmount('1.00')
              setAccessType('paid')
              setIsEncrypted(true)
              setArticleContent('')
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-medium"
            title="Create another piece of content"
          >
            Create Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold mb-6 text-pink-800">Create Paywalled Content</h2>

      <div className="space-y-6">
        <div>
          <label htmlFor="contentType" className="block text-sm font-medium text-pink-700 mb-1">
            Content Type
          </label>
          <select
            id="contentType"
            name="contentType"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
            aria-label="Select content type"
            title="Content type"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="text">Text</option>
            <option value="article">Article</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-pink-700 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
            required
            placeholder="Enter content title"
            aria-label="Content title"
            title="Content title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-pink-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
            rows={3}
            required
            placeholder="Enter content description"
            aria-label="Content description"
            title="Content description"
          />
        </div>

        <div>
          <label htmlFor="customEmbedText" className="block text-sm font-medium text-pink-700 mb-1">
            Custom Embed Text (Optional)
          </label>
          <textarea
            id="customEmbedText"
            name="customEmbedText"
            value={customEmbedText}
            onChange={(e) => setCustomEmbedText(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
            rows={3}
            placeholder="Enter custom text to show when sharing this content (leave empty for default)"
            aria-label="Custom embed text"
            title="Custom embed text"
          />
          <p className="mt-1 text-sm text-gray-500">
            This text will be used when sharing your content in Farcaster. If left empty, a default message will be used.
          </p>
        </div>

        <div>
          <label htmlFor="accessType" className="block text-sm font-medium text-pink-700 mb-1">
            Access Type
          </label>
          <select
            id="accessType"
            name="accessType"
            value={accessType}
            onChange={(e) => setAccessType(e.target.value as AccessType)}
            className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
          >
            <option value="free">Free</option>
            <option value="paid">Paid (Requires Tip)</option>
          </select>
        </div>

        {accessType === 'paid' && (
          <>
            <div>
              <label htmlFor="tipAmount" className="block text-sm font-medium text-pink-700 mb-1">
                Tip Amount (USDC)
              </label>
              <input
                id="tipAmount"
                name="tipAmount"
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
                min="0.01"
                step="0.01"
                required
                placeholder="Enter tip amount in USDC"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isEncrypted"
                name="isEncrypted"
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label htmlFor="isEncrypted" className="ml-2 block text-sm text-pink-700">
                Encrypt content (recommended for paid content)
              </label>
            </div>
          </>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-pink-700 mb-1">
            Content
          </label>
          {contentType === 'article' ? (
            <textarea
              id="content"
              name="content"
              value={articleContent}
              onChange={(e) => {
                const content = e.target.value
                setArticleContent(content)
                const blob = new Blob([content], { type: 'text/markdown' })
                setFile(new File([blob], 'article.md', { type: 'text/markdown' }))
              }}
              className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50"
              rows={10}
              required
              placeholder="Write your article content here..."
              aria-label="Article content"
              title="Article content"
            />
          ) : (
            <input
              id="content"
              name="content"
              type="file"
              onChange={handleFileChange}
              className="w-full p-3 border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              accept={
                contentType === 'image' 
                  ? 'image/*' 
                  : contentType === 'video' 
                  ? 'video/*' 
                  : '.txt,.md,.pdf'
              }
              required
              aria-label="Upload content file"
              title="Content file"
            />
          )}
          <p className="mt-1 text-sm text-pink-600">
            {contentType === 'image' 
              ? 'Upload an image (PNG, JPG, GIF)' 
              : contentType === 'video' 
              ? 'Upload a video (MP4, WebM, max 10MB)' 
              : contentType === 'article'
              ? 'Write your article content directly here'
              : 'Upload a text file (TXT, MD, PDF)'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label={isUploading ? 'Uploading content...' : 'Create content'}
          title={isUploading ? 'Uploading...' : 'Create Content'}
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : 'Create Content'}
        </button>
      </div>
    </form>
  )
} 