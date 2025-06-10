'use client'

import { useState } from 'react'
import { uploadToIPFS, uploadJSONToIPFS, verifyIPFSContent } from '../lib/ipfs'
import { 
  generateEncryptionKey, 
  encryptContent, 
  decryptContent, 
  encryptKeyForUser, 
  decryptKeyForUser,
  generatePaymentProof,
  verifyUserAccess
} from '../lib/encryption-secure'
import { FrameShare } from './FrameShare'

export function TestUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('Test Content')
  const [description, setDescription] = useState('Test description')
  const [isEncrypted, setIsEncrypted] = useState(false)
  const [testUserAddress, setTestUserAddress] = useState('0x1234567890123456789012345678901234567890')
  const [paymentProof, setPaymentProof] = useState('test-payment-proof')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrieveCid, setRetrieveCid] = useState('')
  const [retrievedContent, setRetrievedContent] = useState<any>(null)
  const [isRetrieving, setIsRetrieving] = useState(false)
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptedFileType, setDecryptedFileType] = useState<string | null>(null)
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null)
  const [securityTestResult, setSecurityTestResult] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<{hasPaid: boolean, amount?: string} | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-set title based on filename
      setTitle(selectedFile.name.split('.')[0] || 'Test Content')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadResult(null)
    setDecryptedContent(null)

    try {
      console.log('=== TEST UPLOAD START ===')
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type)
      console.log('Encrypted:', isEncrypted)
      console.log('Test User Address:', testUserAddress)

      let contentFile = file
      let encryptedContent = undefined
      let encryptionKeyMetadata = undefined
      let originalContent = undefined
      let key = undefined

      // For encrypted content, encrypt it first
      if (isEncrypted) {
        console.log('Encrypting content...')
        
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
        console.log('Generated encryption key:', key)
        
        encryptedContent = await encryptContent(originalContent, key)
        console.log('Content encrypted successfully')
        
        // Create a placeholder file for IPFS (in real app, you might upload encrypted content)
        const placeholder = new Blob(['This content is encrypted'], { type: 'text/plain' })
        contentFile = new File([placeholder], 'encrypted.txt', { type: 'text/plain' })
        console.log('Created placeholder file for IPFS')
      }

      // Upload content to IPFS
      console.log('Uploading content to IPFS...')
      const { cid: contentCid, url: contentUrl } = await uploadToIPFS(contentFile)
      console.log('Content uploaded:', { contentCid, contentUrl })

      // For encrypted content, now encrypt the key with the actual content ID
      if (isEncrypted && key) {
        // Generate a payment proof for testing (in real app, this would come from payment system)
        const generatedPaymentProof = generatePaymentProof(testUserAddress, contentCid, '1.00')
        console.log('Generated payment proof for testing')
        
        // Encrypt the key for the user with secure access control
        encryptionKeyMetadata = await encryptKeyForUser(key, testUserAddress, contentCid, generatedPaymentProof)
        console.log('Key encrypted for user with access control')
      }

      // Create metadata
      const metadata = {
        title,
        description,
        contentType: file.type.startsWith('image/') ? 'image' : 'file',
        originalFileType: file.type,
        accessType: isEncrypted ? 'paid' : 'free',
        contentCid,
        contentUrl,
        encryptedContent,
        encryptionKey: encryptionKeyMetadata, // Store the full metadata object
        creator: testUserAddress,
        tipAmount: isEncrypted ? '1.00' : '0',
        createdAt: new Date().toISOString(),
        isEncrypted: isEncrypted
      }

      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS...')
      const { cid: metadataCid, url: metadataUrl } = await uploadJSONToIPFS(metadata)
      console.log('Metadata uploaded:', { metadataCid, metadataUrl })

      // Store in local database
      console.log('Storing in local database...')
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

      console.log('Content stored successfully')

      // If this is encrypted content, record the payment for testing
      if (isEncrypted) {
        console.log('Recording payment for testing...')
        const paymentResponse = await fetch('/api/payments/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentId: contentCid,
            userAddress: testUserAddress,
            txHash: '0x' + '0'.repeat(64), // Test transaction hash
            amount: '1.00',
            timestamp: Math.floor(Date.now() / 1000),
          }),
        })

        if (paymentResponse.ok) {
          console.log('Payment recorded for testing')
        } else {
          console.log('Failed to record payment (this is expected in test mode)')
        }
      }

      // Verify content availability
      console.log('Verifying content availability...')
      let confirmed = false
      for (let i = 0; i < 5; i++) {
        try {
          const check = await fetch(`/api/content/${contentCid}`)
          if (check.ok) {
            const ipfsAvailable = await verifyIPFSContent(contentCid, 3000)
            if (ipfsAvailable) {
              confirmed = true
              console.log('Content availability confirmed')
              break
            }
          }
          await new Promise(res => setTimeout(res, 1000))
        } catch (err) {
          console.log(`Verification attempt ${i + 1} failed:`, err)
        }
      }

      const result = {
        contentCid,
        contentUrl,
        metadataCid,
        metadataUrl,
        metadata,
        confirmed,
        originalContent: isEncrypted ? originalContent : undefined
      }

      setUploadResult(result)
      setRetrieveCid(contentCid) // Auto-fill retrieve field
      console.log('=== TEST UPLOAD COMPLETE ===', result)

    } catch (err) {
      console.error('Upload failed:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRetrieve = async () => {
    if (!retrieveCid.trim()) {
      setError('Please enter a CID')
      return
    }

    setIsRetrieving(true)
    setError(null)
    setRetrievedContent(null)
    setDecryptedContent(null)
    setPaymentStatus(null)

    try {
      console.log('=== TEST RETRIEVE START ===')
      console.log('Retrieving CID:', retrieveCid)

      // Try to get from local database first
      const dbResponse = await fetch(`/api/content/${retrieveCid}`)
      console.log('Database response:', dbResponse.status)

      if (dbResponse.ok) {
        const dbContent = await dbResponse.json()
        console.log('Database content:', dbContent)
        setRetrievedContent({ source: 'database', data: dbContent })

        // Check payment status if this is encrypted content
        if (dbContent.isEncrypted && dbContent.encryptionKey) {
          console.log('Checking payment status for encrypted content...')
          const paymentResponse = await fetch('/api/payments/check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contentId: retrieveCid,
              userAddress: testUserAddress,
            }),
          })

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json()
            setPaymentStatus(paymentData)
            console.log('Payment status:', paymentData)
          } else {
            console.log('Failed to check payment status')
            setPaymentStatus({ hasPaid: false })
          }
        }
      } else {
        console.log('Not found in database, checking IPFS...')
        
        // Try to get from IPFS
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${retrieveCid}`
        const ipfsResponse = await fetch(ipfsUrl)
        
        if (ipfsResponse.ok) {
          const ipfsContent = await ipfsResponse.text()
          console.log('IPFS content:', ipfsContent)
          setRetrievedContent({ source: 'ipfs', data: ipfsContent, url: ipfsUrl })
        } else {
          throw new Error('Content not found in database or IPFS')
        }
      }

      console.log('=== TEST RETRIEVE COMPLETE ===')

    } catch (err) {
      console.error('Retrieve failed:', err)
      setError(err instanceof Error ? err.message : 'Retrieve failed')
    } finally {
      setIsRetrieving(false)
    }
  }

  const handleDecrypt = async () => {
    if (!retrievedContent || !retrievedContent.data.encryptedContent || !retrievedContent.data.encryptionKey) {
      setError('No encrypted content or key available for decryption')
      return
    }

    setIsDecrypting(true)
    setError(null)
    setDecryptedContent(null)
    setDecryptedFileType(null)
    setDecryptedImageUrl(null)

    try {
      console.log('=== TEST DECRYPT START ===')
      console.log('Decrypting content for user:', testUserAddress)

      // Check if user has paid (in real app, this would be verified server-side)
      if (paymentStatus && !paymentStatus.hasPaid) {
        throw new Error('Payment required to decrypt this content')
      }

      // Use the stored payment proof from the encryption key metadata
      const storedPaymentProof = retrievedContent.data.encryptionKey.paymentProof
      console.log('Using stored payment proof for decryption')

      // Decrypt the key for the user (in real app, this would use user's private key)
      const decryptedKey = await decryptKeyForUser(
        retrievedContent.data.encryptionKey, 
        testUserAddress,
        retrieveCid,
        storedPaymentProof
      )
      console.log('Key decrypted for user')

      // Decrypt the content
      const decrypted = await decryptContent(retrievedContent.data.encryptedContent, decryptedKey)
      console.log('Content decrypted successfully')
      console.log('Decrypted content length:', decrypted.length)

      // Determine if this is an image based on the original file type or content
      const isImage = retrievedContent.data.contentType === 'image' || 
                     retrievedContent.data.originalFileType?.startsWith('image/') ||
                     (uploadResult && uploadResult.metadata.contentType === 'image')

      if (isImage) {
        console.log('Detected image content, converting from base64')
        setDecryptedFileType('image')
        
        // Convert base64 back to image
        const imageBlob = new Blob([Buffer.from(decrypted, 'base64')], { 
          type: retrievedContent.data.originalFileType || 'image/jpeg' 
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

      console.log('=== TEST DECRYPT COMPLETE ===')

    } catch (err) {
      console.error('Decrypt failed:', err)
      setError(err instanceof Error ? err.message : 'Decrypt failed')
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setTitle('Test Content')
    setDescription('Test description')
    setIsEncrypted(false)
    setTestUserAddress('0x1234567890123456789012345678901234567890')
    setPaymentProof('test-payment-proof')
    setUploadResult(null)
    setRetrieveCid('')
    setRetrievedContent(null)
    setDecryptedContent(null)
    setDecryptedFileType(null)
    setSecurityTestResult(null)
    setPaymentStatus(null)
    
    // Clean up image URL to prevent memory leaks
    if (decryptedImageUrl) {
      URL.revokeObjectURL(decryptedImageUrl)
      setDecryptedImageUrl(null)
    }
    
    setError(null)
  }

  const handleQuickTest = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    // Enable encryption for quick test
    setIsEncrypted(true)
    
    setIsUploading(true)
    setError(null)
    setUploadResult(null)
    setRetrievedContent(null)
    setDecryptedContent(null)

    try {
      console.log('=== QUICK ENCRYPTION/DECRYPTION TEST START ===')
      
      // Step 1: Upload with encryption
      console.log('Step 1: Uploading with encryption...')
      await handleUpload()
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!uploadResult) {
        throw new Error('Upload failed during quick test')
      }

      // Step 2: Retrieve content
      console.log('Step 2: Retrieving content...')
      setRetrieveCid(uploadResult.contentCid)
      await handleRetrieve()
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!retrievedContent) {
        throw new Error('Retrieve failed during quick test')
      }

      // Step 3: Decrypt content
      console.log('Step 3: Decrypting content...')
      await handleDecrypt()
      
      console.log('=== QUICK ENCRYPTION/DECRYPTION TEST COMPLETE ===')
      
      // Show success message
      setError(null)
      
    } catch (err) {
      console.error('Quick test failed:', err)
      setError(err instanceof Error ? err.message : 'Quick test failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSecurityTest = async () => {
    if (!retrievedContent || !retrievedContent.data.encryptedContent) {
      setError('No encrypted content available for security test')
      return
    }

    setSecurityTestResult(null)
    setError(null)

    try {
      console.log('=== SECURITY TEST START ===')
      console.log('Retrieved encryption key metadata:', retrievedContent.data.encryptionKey)
      
      // Test 1: Try to decrypt without payment proof
      console.log('Test 1: Attempting decryption without payment proof...')
      try {
        await decryptKeyForUser(
          retrievedContent.data.encryptionKey,
          testUserAddress,
          retrieveCid,
          '' // No payment proof
        )
        setSecurityTestResult('❌ SECURITY FAILURE: Decryption succeeded without payment proof!')
        return
      } catch (err) {
        console.log('✅ Security test passed: Decryption failed without payment proof')
        console.log('Error:', err instanceof Error ? err.message : String(err))
      }

      // Test 2: Try to decrypt with wrong user address
      console.log('Test 2: Attempting decryption with wrong user address...')
      try {
        const generatedPaymentProof = generatePaymentProof(testUserAddress, retrieveCid, '1.00')
        await decryptKeyForUser(
          retrievedContent.data.encryptionKey,
          '0x9876543210987654321098765432109876543210',
          retrieveCid,
          generatedPaymentProof
        )
        setSecurityTestResult('❌ SECURITY FAILURE: Decryption succeeded with wrong user address!')
        return
      } catch (err) {
        console.log('✅ Security test passed: Decryption failed with wrong user address')
        console.log('Error:', err instanceof Error ? err.message : String(err))
      }

      // Test 3: Try to decrypt with wrong payment proof
      console.log('Test 3: Attempting decryption with wrong payment proof...')
      try {
        const wrongProof = generatePaymentProof(testUserAddress, retrieveCid, '2.00')
        await decryptKeyForUser(
          retrievedContent.data.encryptionKey,
          testUserAddress,
          retrieveCid,
          wrongProof
        )
        setSecurityTestResult('❌ SECURITY FAILURE: Decryption succeeded with wrong payment proof!')
        return
      } catch (err) {
        console.log('✅ Security test passed: Decryption failed with wrong payment proof')
        console.log('Error:', err instanceof Error ? err.message : String(err))
      }

      // Test 4: Verify proper access works
      console.log('Test 4: Verifying proper access works...')
      try {
        const storedPaymentProof = retrievedContent.data.encryptionKey.paymentProof
        await decryptKeyForUser(
          retrievedContent.data.encryptionKey,
          testUserAddress,
          retrieveCid,
          storedPaymentProof
        )
        console.log('✅ Security test passed: Proper access works correctly')
        setSecurityTestResult('✅ SECURITY TEST PASSED: All access controls working correctly!')
      } catch (err) {
        console.log('❌ Security test failed: Proper access failed!')
        console.log('Error:', err instanceof Error ? err.message : String(err))
        setSecurityTestResult('❌ SECURITY FAILURE: Proper access failed!')
      }

      console.log('=== SECURITY TEST COMPLETE ===')

    } catch (err) {
      console.error('Security test failed:', err)
      setError(err instanceof Error ? err.message : 'Security test failed')
    }
  }

  return (
    <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-blue-800">🧪 Test Upload & Retrieve (with Encryption)</h3>
      <p className="text-sm text-blue-600 mb-4">
        This is a test component for debugging upload/retrieve functionality with encryption support.
      </p>

      <div className="space-y-6">
        {/* Upload Section */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium mb-3 text-blue-800">Upload Test</h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="test-file" className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <input
                id="test-file"
                type="file"
                onChange={handleFileChange}
                className="w-full p-2 border border-gray-300 rounded"
                accept="image/*,text/*"
                aria-label="Select file for upload"
                title="Select file for upload"
                placeholder="Select file for upload"
              />
            </div>

            <div>
              <label htmlFor="test-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                id="test-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter content title"
                aria-label="Content title"
                title="Content title"
              />
            </div>

            <div>
              <label htmlFor="test-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="test-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Enter content description"
                aria-label="Content description"
              />
            </div>

            <div>
              <label htmlFor="test-user-address" className="block text-sm font-medium text-gray-700 mb-1">
                Test User Address
              </label>
              <input
                id="test-user-address"
                type="text"
                value={testUserAddress}
                onChange={(e) => setTestUserAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter test user address"
                aria-label="Test user address"
                title="Test user address"
              />
            </div>

            <div>
              <label htmlFor="test-payment-proof" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Proof (for testing)
              </label>
              <input
                id="test-payment-proof"
                type="text"
                value={paymentProof}
                onChange={(e) => setPaymentProof(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter payment proof for decryption"
                aria-label="Payment proof"
                title="Payment proof"
              />
              <p className="text-xs text-gray-500 mt-1">
                In production, this would be a cryptographic proof from your payment system.
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="test-encrypted"
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="test-encrypted" className="ml-2 block text-sm text-gray-700">
                Encrypt content (test encryption/decryption flow)
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Test Content'}
              </button>
              
              <button
                onClick={handleQuickTest}
                disabled={isUploading || !file}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm"
                title="Quick test: Upload → Retrieve → Decrypt"
              >
                {isUploading ? 'Testing...' : '🚀 Quick Test'}
              </button>
            </div>
          </div>

          {uploadResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-800 mb-2">Upload Successful!</h5>
              <div className="text-sm space-y-1 mb-4">
                <div><strong>Content CID:</strong> <code className="bg-gray-100 px-1 rounded">{uploadResult.contentCid}</code></div>
                <div><strong>Content URL:</strong> <a href={uploadResult.contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{uploadResult.contentUrl}</a></div>
                <div><strong>Metadata CID:</strong> <code className="bg-gray-100 px-1 rounded">{uploadResult.metadataCid}</code></div>
                <div><strong>Confirmed Available:</strong> {uploadResult.confirmed ? '✅' : '❌'}</div>
                <div><strong>Encrypted:</strong> {uploadResult.metadata.isEncrypted ? '✅' : '❌'}</div>
                <div><strong>Access Type:</strong> {uploadResult.metadata.accessType}</div>
                <div><strong>File Type:</strong> {uploadResult.metadata.originalFileType}</div>
                <div><strong>Content Type:</strong> {uploadResult.metadata.contentType}</div>
                {uploadResult.originalContent && (
                  <div><strong>Original Content:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{uploadResult.originalContent.substring(0, 50)}...</code></div>
                )}
              </div>
              
              {/* Frame Sharing Section */}
              <FrameShare
                contentCid={uploadResult.contentCid}
                content={{
                  title: uploadResult.metadata.title,
                  description: uploadResult.metadata.description,
                  contentType: uploadResult.metadata.contentType,
                  accessType: uploadResult.metadata.accessType,
                  tipAmount: uploadResult.metadata.tipAmount
                }}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Retrieve Section */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium mb-3 text-blue-800">Retrieve Test</h4>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="test-retrieve-cid" className="block text-sm font-medium text-gray-700 mb-1">
                CID to Retrieve
              </label>
              <input
                id="test-retrieve-cid"
                type="text"
                value={retrieveCid}
                onChange={(e) => setRetrieveCid(e.target.value)}
                placeholder="Enter CID (e.g., Qmdo94oFpkNDUAUZaEaUu1z6SrFewwdeQrfrWqV3CjFPHc)"
                className="w-full p-2 border border-gray-300 rounded"
                title="CID to Retrieve"
              />
            </div>

            <button
              onClick={handleRetrieve}
              disabled={isRetrieving || !retrieveCid.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isRetrieving ? 'Retrieving...' : 'Retrieve Content'}
            </button>
          </div>

          {retrievedContent && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-800 mb-2">Retrieve Successful!</h5>
              <div className="text-sm space-y-2">
                <div><strong>Source:</strong> {retrievedContent.source}</div>
                {retrievedContent.url && (
                  <div><strong>URL:</strong> <a href={retrievedContent.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{retrievedContent.url}</a></div>
                )}
                <div><strong>Encrypted:</strong> {retrievedContent.data.isEncrypted ? '✅' : '❌'}</div>
                <div><strong>Access Type:</strong> {retrievedContent.data.accessType}</div>
                {retrievedContent.data.encryptedContent && (
                  <div><strong>Has Encrypted Content:</strong> ✅</div>
                )}
                {retrievedContent.data.encryptionKey && (
                  <div><strong>Has Encryption Key:</strong> ✅</div>
                )}
                
                {/* Payment Status */}
                {paymentStatus && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <h6 className="font-medium text-yellow-800 mb-1">💰 Payment Status</h6>
                    <div className="text-xs text-yellow-700">
                      <strong>Has Paid:</strong> {paymentStatus.hasPaid ? '✅ Yes' : '❌ No'}
                      {paymentStatus.amount && (
                        <div><strong>Amount:</strong> {paymentStatus.amount} USDC</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Auto-show decrypt option for encrypted content */}
                {retrievedContent.data.encryptedContent && retrievedContent.data.encryptionKey && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
                    <h6 className="font-medium text-purple-800 mb-2">🔐 Encrypted Content Detected</h6>
                    <p className="text-sm text-purple-700 mb-3">
                      This content is encrypted. You can decrypt it using the stored encryption key.
                    </p>
                    
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="decrypt-user-address" className="block text-xs font-medium text-purple-700 mb-1">
                          User Address for Decryption
                        </label>
                        <input
                          id="decrypt-user-address"
                          type="text"
                          value={testUserAddress}
                          onChange={(e) => setTestUserAddress(e.target.value)}
                          className="w-full p-2 border border-purple-300 rounded text-sm"
                          placeholder="Enter user address for key decryption"
                          title="User address for decryption"
                        />
                        <p className="text-xs text-purple-600 mt-1">
                          Use the same address that was used during upload for successful decryption.
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={handleDecrypt}
                          disabled={isDecrypting}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {isDecrypting ? '🔓 Decrypting...' : '🔓 Decrypt Content'}
                        </button>
                        
                        <button
                          onClick={() => {
                            // Auto-fill with the creator address if available
                            if (retrievedContent.data.creator) {
                              setTestUserAddress(retrievedContent.data.creator)
                            }
                          }}
                          className="px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                          title="Auto-fill with creator address"
                        >
                          Auto-fill
                        </button>
                      </div>
                    </div>
                    
                    {decryptedContent && (
                      <div className="mt-3 p-2 bg-white border border-purple-300 rounded">
                        <h6 className="font-medium text-purple-800 mb-1">✅ Decryption Successful!</h6>
                        <div className="text-xs text-purple-700 mb-2">
                          <strong>Content Type:</strong> {decryptedFileType}
                        </div>
                        
                        {decryptedFileType === 'image' && decryptedImageUrl && (
                          <div className="mb-3">
                            <div className="text-xs text-purple-700 mb-2">
                              <strong>Decrypted Image:</strong>
                            </div>
                            <div className="border border-gray-200 rounded p-2 bg-gray-50">
                              <img 
                                src={decryptedImageUrl} 
                                alt="Decrypted content"
                                className="max-w-full max-h-64 object-contain mx-auto"
                                onError={(e) => {
                                  console.error('Failed to load decrypted image:', e)
                                  setError('Failed to display decrypted image')
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Image size: {decryptedContent.length} characters (base64)
                            </div>
                          </div>
                        )}
                        
                        {decryptedFileType === 'text' && (
                          <div className="mb-3">
                            <div className="text-xs text-purple-700 mb-2">
                              <strong>Decrypted Text:</strong>
                            </div>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32 border">
                              {decryptedContent}
                            </pre>
                          </div>
                        )}
                        
                        {/* Show comparison if we have original content */}
                        {uploadResult && uploadResult.originalContent && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <h6 className="font-medium text-green-800 mb-1 text-xs">✅ Content Verification</h6>
                            <div className="text-xs text-green-700">
                              <strong>Match:</strong> {decryptedContent === uploadResult.originalContent ? '✅ Perfect Match' : '❌ Content Mismatch'}
                            </div>
                            {decryptedContent !== uploadResult.originalContent && (
                              <div className="mt-1 text-xs text-red-600">
                                <strong>Original:</strong> {uploadResult.originalContent.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div><strong>Full Metadata:</strong></div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(retrievedContent.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Security Test Section */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium mb-3 text-blue-800">Security Test</h4>
          
          <div className="space-y-3">
            <button
              onClick={handleSecurityTest}
              disabled={isRetrieving || !retrieveCid.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isRetrieving ? 'Testing...' : '🔐 Run Security Test'}
            </button>
          </div>

          {securityTestResult && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-800 mb-2">Security Test Result</h5>
              <div className="text-sm space-y-2">
                <div>{securityTestResult}</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear All
        </button>
      </div>
    </div>
  )
} 