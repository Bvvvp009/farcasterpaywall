import { Buffer } from 'buffer'

// Generate a random encryption key
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32))
  return Buffer.from(key).toString('base64')
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

// Encrypt the encryption key with the user's public key
export async function encryptKeyForUser(key: string, publicKey: string): Promise<string> {
  // This would use the user's public key to encrypt the content key
  // For now, we'll just return the key as is
  // TODO: Implement proper public key encryption
  return key
}

// Decrypt the encryption key with the user's private key
export async function decryptKeyForUser(encryptedKey: string, privateKey: string): Promise<string> {
  // This would use the user's private key to decrypt the content key
  // For now, we'll just return the key as is
  // TODO: Implement proper private key decryption
  return encryptedKey
} 