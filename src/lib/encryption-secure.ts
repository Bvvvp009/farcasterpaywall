import { Buffer } from 'buffer'

// Interface for encrypted key metadata
interface EncryptedKeyMetadata {
  encryptedKey: string
  userAddress: string
  contentId: string
  paymentProof: string
  timestamp: string
  accessToken: string
  signature: string
}

// Interface for payment verification
interface PaymentVerification {
  isValid: boolean
  amount: string
  timestamp: string
  transactionId?: string
}

// Generate a random encryption key
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(key).toString('base64')
}

// Generate a unique access token for each user-content pair
export async function generateAccessToken(userAddress: string, contentId: string, timestamp: string): Promise<string> {
  const data = `${userAddress}:${contentId}:${timestamp}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  const hash = await crypto.subtle.digest('SHA-256', dataBuffer)
  return Buffer.from(hash).toString('base64')
}

// Encrypt content using AES-GCM with proper key derivation
export async function encryptContent(content: string, key: string): Promise<string> {
  const encoder = new TextEncoder()
  const contentBuffer = encoder.encode(content)
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Import the key
  const keyBuffer = Buffer.from(key, 'base64')
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  // Encrypt the content
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    contentBuffer
  )
  
  // Combine IV and encrypted content
  const result = new Uint8Array(iv.length + encryptedContent.byteLength)
  result.set(iv)
  result.set(new Uint8Array(encryptedContent), iv.length)
  
  return Buffer.from(result).toString('base64')
}

// Decrypt content using AES-GCM
export async function decryptContent(encryptedContent: string, key: string): Promise<string> {
  const encryptedBuffer = Buffer.from(encryptedContent, 'base64')
  
  // Extract IV and encrypted content
  const iv = encryptedBuffer.slice(0, 12)
  const content = encryptedBuffer.slice(12)
  
  // Import the key
  const keyBuffer = Buffer.from(key, 'base64')
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  // Decrypt the content
  const decryptedContent = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    content
  )
  
  // Convert back to string
  const decoder = new TextDecoder()
  return decoder.decode(decryptedContent)
}

// Secure key encryption for user access with proper access control
export async function encryptKeyForUser(
  contentKey: string, 
  userAddress: string, 
  contentId: string,
  paymentProof: string
): Promise<EncryptedKeyMetadata> {
  const timestamp = new Date().toISOString()
  const accessToken = await generateAccessToken(userAddress, contentId, timestamp)
  
  // Create a master key from user address and payment proof
  const masterKeyData = `${userAddress}:${paymentProof}:${contentId}`
  const encoder = new TextEncoder()
  const masterKeyBuffer = encoder.encode(masterKeyData)
  const masterKeyHash = await crypto.subtle.digest('SHA-256', masterKeyBuffer)
  
  // Use the master key to encrypt the content key
  const masterKey = await crypto.subtle.importKey(
    'raw',
    masterKeyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  // Generate IV for key encryption
  const keyIv = crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt the content key
  const contentKeyBuffer = encoder.encode(contentKey)
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: keyIv },
    masterKey,
    contentKeyBuffer
  )
  
  // Combine IV and encrypted key
  const encryptedKeyResult = new Uint8Array(keyIv.length + encryptedKeyBuffer.byteLength)
  encryptedKeyResult.set(keyIv)
  encryptedKeyResult.set(new Uint8Array(encryptedKeyBuffer), keyIv.length)
  
  // Create signature for verification
  const signatureData = `${userAddress}:${contentId}:${timestamp}:${paymentProof}`
  const signatureBuffer = encoder.encode(signatureData)
  const signatureHash = await crypto.subtle.digest('SHA-256', signatureBuffer)
  
  return {
    encryptedKey: Buffer.from(encryptedKeyResult).toString('base64'),
    userAddress,
    contentId,
    paymentProof,
    timestamp,
    accessToken,
    signature: Buffer.from(signatureHash).toString('base64')
  }
}

// Secure key decryption for user access with verification
export async function decryptKeyForUser(
  encryptedKeyMetadata: EncryptedKeyMetadata,
  userAddress: string,
  contentId: string,
  paymentProof: string
): Promise<string> {
  // Verify user address matches
  if (encryptedKeyMetadata.userAddress !== userAddress) {
    throw new Error('User address mismatch')
  }
  
  // Verify content ID matches
  if (encryptedKeyMetadata.contentId !== contentId) {
    throw new Error('Content ID mismatch')
  }
  
  // Verify payment proof
  if (encryptedKeyMetadata.paymentProof !== paymentProof) {
    throw new Error('Payment proof mismatch')
  }
  
  // Verify signature
  const encoder = new TextEncoder()
  const signatureData = `${userAddress}:${contentId}:${encryptedKeyMetadata.timestamp}:${paymentProof}`
  const signatureBuffer = encoder.encode(signatureData)
  const expectedSignatureHash = await crypto.subtle.digest('SHA-256', signatureBuffer)
  const expectedSignature = Buffer.from(expectedSignatureHash).toString('base64')
  
  if (encryptedKeyMetadata.signature !== expectedSignature) {
    throw new Error('Signature verification failed')
  }
  
  // Create the same master key used for encryption
  const masterKeyData = `${userAddress}:${paymentProof}:${contentId}`
  const masterKeyBuffer = encoder.encode(masterKeyData)
  const masterKeyHash = await crypto.subtle.digest('SHA-256', masterKeyBuffer)
  
  const masterKey = await crypto.subtle.importKey(
    'raw',
    masterKeyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  // Extract IV and encrypted key
  const encryptedKeyBuffer = Buffer.from(encryptedKeyMetadata.encryptedKey, 'base64')
  const keyIv = encryptedKeyBuffer.slice(0, 12)
  const encryptedKey = encryptedKeyBuffer.slice(12)
  
  // Decrypt the content key
  const decryptedKeyBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: keyIv },
    masterKey,
    encryptedKey
  )
  
  return new TextDecoder().decode(decryptedKeyBuffer)
}

// Verify user has access to content
export async function verifyUserAccess(
  userAddress: string,
  contentId: string,
  paymentProof: string
): Promise<PaymentVerification> {
  // In a real implementation, you would:
  // 1. Verify the payment proof against your payment system
  // 2. Check if the payment is still valid
  // 3. Verify the user has the right permissions
  
  if (!paymentProof) {
    return { isValid: false, amount: '0', timestamp: new Date().toISOString() }
  }
  
  // For testing purposes, we'll simulate a valid payment
  // In production, this would verify against your payment system
  try {
    // Decode the payment proof to extract information
    const decodedProof = Buffer.from(paymentProof, 'base64').toString('utf-8')
    const parts = decodedProof.split(':')
    
    if (parts.length >= 4) {
      const [proofUserAddress, proofContentId, amount, timestamp] = parts
      
      // Verify the payment proof matches the request
      if (proofUserAddress === userAddress && proofContentId === contentId) {
        return {
          isValid: true,
          amount,
          timestamp,
          transactionId: `tx_${Date.now()}`
        }
      }
    }
    
    return { isValid: false, amount: '0', timestamp: new Date().toISOString() }
  } catch (error) {
    return { isValid: false, amount: '0', timestamp: new Date().toISOString() }
  }
}

// Generate a payment proof (in real app, this would come from your payment system)
export function generatePaymentProof(userAddress: string, contentId: string, amount: string): string {
  const timestamp = new Date().toISOString()
  const data = `${userAddress}:${contentId}:${amount}:${timestamp}`
  
  // In a real app, this would be a cryptographic signature from your payment system
  return Buffer.from(data).toString('base64')
}

// Store encrypted key metadata securely
export async function storeEncryptedKey(metadata: EncryptedKeyMetadata): Promise<string> {
  // In a real implementation, you would:
  // 1. Store this in a secure database
  // 2. Use proper access controls
  // 3. Encrypt the metadata itself
  
  // For now, we'll return a storage ID
  const storageId = Buffer.from(`${metadata.userAddress}:${metadata.contentId}:${Date.now()}`).toString('base64')
  
  // In production, store in database:
  // await db.encryptedKeys.create({
  //   storageId,
  //   ...metadata,
  //   createdAt: new Date()
  // })
  
  return storageId
}

// Retrieve encrypted key metadata
export async function retrieveEncryptedKey(storageId: string): Promise<EncryptedKeyMetadata | null> {
  // In a real implementation, you would:
  // 1. Retrieve from secure database
  // 2. Verify access permissions
  // 3. Decrypt metadata if needed
  
  // For now, we'll return null (simulating not found)
  // In production:
  // const metadata = await db.encryptedKeys.findByStorageId(storageId)
  // return metadata
  
  return null
}

// Clean up expired access tokens
export async function cleanupExpiredAccess(expirationHours: number = 24): Promise<void> {
  // In a real implementation, you would:
  // 1. Find expired access tokens
  // 2. Remove them from storage
  // 3. Log cleanup activities
  
  const cutoffTime = new Date(Date.now() - expirationHours * 60 * 60 * 1000)
  
  // In production:
  // await db.encryptedKeys.deleteMany({
  //   where: {
  //     createdAt: { lt: cutoffTime }
  //   }
  // })
} 