'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { uploadToIPFS, uploadJSONToIPFS } from '@/lib/ipfs'
import { useUSDCTransfer, formatUSDC } from '@/lib/wallet'

type ContentType = 'image' | 'video' | 'text' | 'article'

export function CreateContent() {
  const { address } = useAccount()
  const [file, setFile] = useState<File | null>(null)
  const [contentType, setContentType] = useState<ContentType>('image')
  const [tipAmount, setTipAmount] = useState('1.00')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      // Upload content to IPFS
      const { cid: contentCid, url: contentUrl } = await uploadToIPFS(file)

      // Create metadata
      const metadata = {
        title,
        description,
        contentType,
        contentCid,
        contentUrl,
        creator: address,
        tipAmount: formatUSDC(tipAmount),
        createdAt: new Date().toISOString(),
      }

      // Upload metadata to IPFS
      const { cid: metadataCid, url: metadataUrl } = await uploadJSONToIPFS(metadata)

      // TODO: Save metadataCid to your backend
      console.log('Content uploaded:', { contentUrl, metadataUrl })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload content')
    } finally {
      setIsUploading(false)
    }
  }

  if (!address) {
    return (
      <div className="text-center p-4">
        Please connect your wallet to create content
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Create Paywalled Content</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
            Content Type
          </label>
          <select
            id="contentType"
            name="contentType"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
            className="w-full p-2 border rounded"
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
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
            placeholder="Enter content title"
            aria-label="Content title"
            title="Content title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            required
            placeholder="Enter content description"
            aria-label="Content description"
            title="Content description"
          />
        </div>

        <div>
          <label htmlFor="tipAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Tip Amount (USDC)
          </label>
          <input
            id="tipAmount"
            name="tipAmount"
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            className="w-full p-2 border rounded"
            min="0.01"
            step="0.01"
            required
            placeholder="Enter tip amount in USDC"
            aria-label="Tip amount in USDC"
            title="Tip amount"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <input
            id="content"
            name="content"
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
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
        </div>

        {error && (
          <div className="text-red-500 text-sm" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700 disabled:opacity-50"
          aria-label={isUploading ? 'Uploading content...' : 'Create content'}
          title={isUploading ? 'Uploading...' : 'Create Content'}
        >
          {isUploading ? 'Uploading...' : 'Create Content'}
        </button>
      </div>
    </form>
  )
} 