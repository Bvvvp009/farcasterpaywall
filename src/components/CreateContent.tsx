'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { uploadToIPFS, uploadJSONToIPFS } from '../lib/ipfs'
import { useUSDCTransfer, formatUSDC } from '../lib/wallet'
import { generateEncryptionKey, encryptContent, encryptKeyForUser } from '../lib/encryption'

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
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!address || !file) return

    setIsUploading(true)
    setError(null)

    try {
      let contentFile = file
      let contentUrl = ''
      let encryptedContent = undefined
      let encryptionKey = undefined

      if (contentType === 'article') {
        const articleContent = await file.text()
        const blob = new Blob([articleContent], { type: 'text/markdown' })
        contentFile = new File([blob], 'article.md', { type: 'text/markdown' })
      }

      // For paid content, encrypt it
      if (accessType === 'paid' && isEncrypted) {
        const content = await contentFile.text()
        const key = generateEncryptionKey()
        encryptedContent = await encryptContent(content, key)
        
        // In a real implementation, we would encrypt the key with the user's public key
        // For now, we'll just store it (this is NOT secure for production)
        encryptionKey = await encryptKeyForUser(key, address)
        
        // Create a placeholder file for IPFS
        const placeholder = new Blob(['This content is encrypted'], { type: 'text/plain' })
        contentFile = new File([placeholder], 'encrypted.txt', { type: 'text/plain' })
      }

      // Upload content to IPFS
      const { cid: contentCid, url: uploadedUrl } = await uploadToIPFS(contentFile)
      contentUrl = uploadedUrl

      // Create metadata
      const metadata = {
        title,
        description,
        contentType,
        accessType,
        contentCid,
        contentUrl,
        encryptedContent,
        encryptionKey,
        creator: address,
        tipAmount: accessType === 'paid' ? tipAmount : '0',
        createdAt: new Date().toISOString(),
        customEmbedText: customEmbedText || undefined,
      }

      // Upload metadata to IPFS
      const { cid: metadataCid, url: metadataUrl } = await uploadJSONToIPFS(metadata)

      // Store content using our API
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      })

      if (!response.ok) {
        throw new Error('Failed to store content')
      }

      // Wait until the content is retrievable from the backend
      let confirmed = false
      for (let i = 0; i < 10; i++) { // Try for up to ~5 seconds
        const check = await fetch(`/api/content/${contentCid}`)
        if (check.ok) {
          confirmed = true
          break
        }
        await new Promise(res => setTimeout(res, 500))
      }
      if (!confirmed) {
        throw new Error('Content not available after upload. Please try again.')
      }

      // Now safe to redirect or enable cast
      window.location.href = `/content/${contentCid}`

    } catch (err) {
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