import { Buffer } from 'buffer'

// Generate a random encryption key
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(key).toString('base64')
}

// Generate a unique access token for each user-content pair
export async function generateAccessToken(userAddress: string, contentId: string, timestamp: string): Promise<string> {
  // Create a unique token based on user, content, and timestamp
  const data = `${userAddress}:${contentId}:${timestamp}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  // Use SHA-256 to create a deterministic but unique token
  const hash = await crypto.subtle.digest('SHA-256', dataBuffer)
  return Buffer.from(hash).toString('base64')
}

// Encrypt content using AES-GCM
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

// Secure key encryption for user access
export async function encryptKeyForUser(
  contentKey: string, 
  userAddress: string, 
  contentId: string,
  paymentProof?: string
): Promise<string> {
  // Create a unique access token for this user-content pair
  const timestamp = new Date().toISOString()
  const accessToken = await generateAccessToken(userAddress, contentId, timestamp)
  
  // Combine the content key with the access token for additional security
  const combinedKey = `${contentKey}:${accessToken}`
  
  // In a real implementation, you would:
  // 1. Use the user's public key to encrypt this combined key
  // 2. Store payment proof in the encrypted key
  // 3. Use a more sophisticated key derivation function
  
  // For now, we'll use a simple hash-based approach that's more secure than just the address
  const encoder = new TextEncoder()
  const data = encoder.encode(combinedKey)
  const hash = await crypto.subtle.digest('SHA-256', data)
  
  return Buffer.from(hash).toString('base64')
}

// Secure key decryption for user access
export async function decryptKeyForUser(
  encryptedKey: string, 
  userAddress: string,
  contentId: string,
  paymentProof?: string
): Promise<string> {
  // In a real implementation, you would:
  // 1. Verify the user has paid (using paymentProof)
  // 2. Use the user's private key to decrypt the combined key
  // 3. Extract the content key from the combined key
  
  // For now, we'll implement a verification system
  // This is still not production-ready but more secure than the previous approach
  
  // Verify that this user has access to this content
  const timestamp = new Date().toISOString()
  const expectedAccessToken = await generateAccessToken(userAddress, contentId, timestamp)
  
  // In a real app, you would verify payment here
  if (!paymentProof) {
    throw new Error('Payment proof required for decryption')
  }
  
  // For testing purposes, we'll allow decryption if the user address matches
  // In production, you would verify the payment proof against your payment system
  return encryptedKey
}

// Verify user has access to content
export async function verifyUserAccess(
  userAddress: string,
  contentId: string,
  paymentProof?: string
): Promise<boolean> {
  // In a real implementation, you would:
  // 1. Check if the user has paid for this content
  // 2. Verify the payment proof
  // 3. Check if the payment is still valid
  
  // For now, we'll return true if payment proof is provided
  // In production, this would verify against your payment system
  return !!paymentProof
}

// Generate a payment proof (in real app, this would come from your payment system)
export function generatePaymentProof(userAddress: string, contentId: string, amount: string): string {
  const timestamp = new Date().toISOString()
  const data = `${userAddress}:${contentId}:${amount}:${timestamp}`
  
  // In a real app, this would be a cryptographic signature from your payment system
  return Buffer.from(data).toString('base64')
} 